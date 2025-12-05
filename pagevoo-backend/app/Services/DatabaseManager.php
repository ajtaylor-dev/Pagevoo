<?php

namespace App\Services;

use App\Models\DatabaseInstance;
use App\Models\Template;
use App\Models\UserWebsite;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Artisan;
use Exception;

class DatabaseManager
{
    protected SystemPageService $systemPageService;

    public function __construct()
    {
        $this->systemPageService = new SystemPageService();
    }
    /**
     * Create a new database for a template.
     */
    public function createTemplateDatabase(int $templateId): DatabaseInstance
    {
        $databaseName = "pagevoo_template_{$templateId}";

        // Check if database already exists
        $existing = DatabaseInstance::where('type', 'template')
            ->where('reference_id', $templateId)
            ->first();

        if ($existing) {
            throw new Exception("Database already exists for template {$templateId}");
        }

        // Create database instance record
        $instance = DatabaseInstance::create([
            'type' => 'template',
            'reference_id' => $templateId,
            'database_name' => $databaseName,
            'status' => 'creating',
        ]);

        try {
            // Create the actual database
            DB::statement("CREATE DATABASE IF NOT EXISTS `{$databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            // Run migrations on the new database
            $this->runMigrationsOnDatabase($databaseName);

            // Mark as active
            $instance->markAsActive();

            // Update size
            $this->updateDatabaseSize($instance);

            return $instance->fresh();
        } catch (Exception $e) {
            $instance->markAsError();
            throw new Exception("Failed to create template database: " . $e->getMessage());
        }
    }

    /**
     * Create a new database for a user website.
     */
    public function createWebsiteDatabase(int $userId, string $websiteName = 'website'): DatabaseInstance
    {
        // Sanitize website name and generate random suffix
        $sanitized = $this->sanitizeForDatabaseName($websiteName);
        $randomSuffix = bin2hex(random_bytes(4)); // 8 character random string
        $databaseName = "pagevoo_{$sanitized}_{$randomSuffix}";

        // Check if database already exists
        $existing = DatabaseInstance::where('type', 'website')
            ->where('reference_id', $userId)
            ->first();

        if ($existing) {
            throw new Exception("Database already exists for user {$userId}");
        }

        // Create database instance record
        $instance = DatabaseInstance::create([
            'type' => 'website',
            'reference_id' => $userId,
            'database_name' => $databaseName,
            'status' => 'creating',
        ]);

        try {
            // Create the actual database
            DB::statement("CREATE DATABASE IF NOT EXISTS `{$databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            // Run migrations on the new database
            $this->runMigrationsOnDatabase($databaseName);

            // Mark as active
            $instance->markAsActive();

            // Update size
            $this->updateDatabaseSize($instance);

            return $instance->fresh();
        } catch (Exception $e) {
            $instance->markAsError();
            throw new Exception("Failed to create website database: " . $e->getMessage());
        }
    }

    /**
     * Copy a template database to a website database.
     */
    public function copyTemplateDatabaseToWebsite(int $templateId, int $userId, string $websiteName = 'website'): DatabaseInstance
    {
        // Get template database
        $templateDb = DatabaseInstance::where('type', 'template')
            ->where('reference_id', $templateId)
            ->where('status', 'active')
            ->firstOrFail();

        $sourceName = $templateDb->database_name;

        // Sanitize website name and generate random suffix
        $sanitized = $this->sanitizeForDatabaseName($websiteName);
        $randomSuffix = bin2hex(random_bytes(4)); // 8 character random string
        $targetName = "pagevoo_{$sanitized}_{$randomSuffix}";

        // Check if website database already exists
        $existing = DatabaseInstance::where('type', 'website')
            ->where('reference_id', $userId)
            ->first();

        if ($existing) {
            throw new Exception("Database already exists for user {$userId}");
        }

        // Create database instance record
        $instance = DatabaseInstance::create([
            'type' => 'website',
            'reference_id' => $userId,
            'database_name' => $targetName,
            'status' => 'copying',
            'metadata' => $templateDb->metadata, // Copy metadata (installed features)
        ]);

        try {
            // Create target database
            DB::statement("CREATE DATABASE IF NOT EXISTS `{$targetName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            // Copy all tables from source to target
            $this->copyDatabaseTables($sourceName, $targetName);

            // Mark as active
            $instance->markAsActive();

            // Update size
            $this->updateDatabaseSize($instance);

            return $instance->fresh();
        } catch (Exception $e) {
            $instance->markAsError();
            throw new Exception("Failed to copy template database: " . $e->getMessage());
        }
    }

    /**
     * Delete a database instance.
     */
    public function deleteDatabase(DatabaseInstance $instance, bool $hardDelete = false): bool
    {
        $instance->markAsDeleting();

        try {
            // Drop the actual database
            DB::statement("DROP DATABASE IF EXISTS `{$instance->database_name}`");

            if ($hardDelete) {
                // Permanently delete the record
                $instance->forceDelete();
            } else {
                // Soft delete
                $instance->delete();
            }

            return true;
        } catch (Exception $e) {
            $instance->markAsError();
            throw new Exception("Failed to delete database: " . $e->getMessage());
        }
    }

    /**
     * Backup a database.
     */
    public function backupDatabase(DatabaseInstance $instance): string
    {
        $backupPath = storage_path("app/backups/database");

        if (!file_exists($backupPath)) {
            mkdir($backupPath, 0755, true);
        }

        $filename = "{$instance->database_name}_" . now()->format('Y-m-d_H-i-s') . ".sql";
        $fullPath = "{$backupPath}/{$filename}";

        $dbHost = Config::get('database.connections.mysql.host');
        $dbUser = Config::get('database.connections.mysql.username');
        $dbPass = Config::get('database.connections.mysql.password');

        // Use mysqldump to create backup
        $command = sprintf(
            'mysqldump -h %s -u %s -p%s %s > %s',
            escapeshellarg($dbHost),
            escapeshellarg($dbUser),
            escapeshellarg($dbPass),
            escapeshellarg($instance->database_name),
            escapeshellarg($fullPath)
        );

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new Exception("Database backup failed");
        }

        $instance->recordBackup();

        return $fullPath;
    }

    /**
     * Restore a database from backup.
     */
    public function restoreDatabase(DatabaseInstance $instance, string $backupPath): bool
    {
        if (!file_exists($backupPath)) {
            throw new Exception("Backup file not found: {$backupPath}");
        }

        $dbHost = Config::get('database.connections.mysql.host');
        $dbUser = Config::get('database.connections.mysql.username');
        $dbPass = Config::get('database.connections.mysql.password');

        // Drop existing tables
        DB::statement("DROP DATABASE IF EXISTS `{$instance->database_name}`");
        DB::statement("CREATE DATABASE `{$instance->database_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Use mysql to restore backup
        $command = sprintf(
            'mysql -h %s -u %s -p%s %s < %s',
            escapeshellarg($dbHost),
            escapeshellarg($dbUser),
            escapeshellarg($dbPass),
            escapeshellarg($instance->database_name),
            escapeshellarg($backupPath)
        );

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new Exception("Database restore failed");
        }

        return true;
    }

    /**
     * Get database instance for a template.
     */
    public function getTemplateDatabaseInstance(int $templateId): ?DatabaseInstance
    {
        return DatabaseInstance::where('type', 'template')
            ->where('reference_id', $templateId)
            ->first();
    }

    /**
     * Get database instance for a user website.
     */
    public function getWebsiteDatabaseInstance(int $userId): ?DatabaseInstance
    {
        return DatabaseInstance::where('type', 'website')
            ->where('reference_id', $userId)
            ->first();
    }

    /**
     * Update the size of a database instance.
     */
    public function updateDatabaseSize(DatabaseInstance $instance): void
    {
        $result = DB::select(
            "SELECT SUM(data_length + index_length) AS size
             FROM information_schema.TABLES
             WHERE table_schema = ?",
            [$instance->database_name]
        );

        $size = $result[0]->size ?? 0;
        $instance->updateSize((int) $size);
    }

    /**
     * Run migrations on a specific database.
     */
    protected function runMigrationsOnDatabase(string $databaseName): void
    {
        // Create a temporary connection for this database
        Config::set('database.connections.temp', [
            'driver' => 'mysql',
            'host' => Config::get('database.connections.mysql.host'),
            'port' => Config::get('database.connections.mysql.port'),
            'database' => $databaseName,
            'username' => Config::get('database.connections.mysql.username'),
            'password' => Config::get('database.connections.mysql.password'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        // Run migrations for script features on this database
        $migrationPath = 'database/migrations/script_features';

        Artisan::call('migrate', [
            '--database' => 'temp',
            '--path' => $migrationPath,
            '--force' => true,
        ]);
    }

    /**
     * Copy all tables from source database to target database.
     */
    protected function copyDatabaseTables(string $sourceDb, string $targetDb): void
    {
        // Get all tables from source database
        $tables = DB::select("SHOW TABLES FROM `{$sourceDb}`");
        $tableKey = "Tables_in_{$sourceDb}";

        foreach ($tables as $table) {
            $tableName = $table->$tableKey;

            // Drop table if exists in target
            DB::statement("DROP TABLE IF EXISTS `{$targetDb}`.`{$tableName}`");

            // Create table structure
            $createTableResult = DB::select("SHOW CREATE TABLE `{$sourceDb}`.`{$tableName}`");
            $createTableSql = $createTableResult[0]->{'Create Table'};

            // Execute create table in target database
            DB::connection()->getPdo()->exec("USE `{$targetDb}`");
            DB::statement($createTableSql);

            // Copy data
            DB::statement("INSERT INTO `{$targetDb}`.`{$tableName}` SELECT * FROM `{$sourceDb}`.`{$tableName}`");

            // Switch back to main database
            DB::connection()->getPdo()->exec("USE `pagevoo_core`");
        }
    }

    /**
     * Install a feature on a database.
     */
    public function installFeature(DatabaseInstance $instance, string $featureType, array $config = []): bool
    {
        // Run feature-specific migrations
        $migrationPath = "database/migrations/script_features/{$featureType}";

        if (!file_exists(base_path($migrationPath))) {
            throw new Exception("Feature migrations not found: {$featureType}");
        }

        // Create temporary connection
        Config::set('database.connections.temp', [
            'driver' => 'mysql',
            'host' => Config::get('database.connections.mysql.host'),
            'port' => Config::get('database.connections.mysql.port'),
            'database' => $instance->database_name,
            'username' => Config::get('database.connections.mysql.username'),
            'password' => Config::get('database.connections.mysql.password'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        // Run migrations
        Artisan::call('migrate', [
            '--database' => 'temp',
            '--path' => $migrationPath,
            '--force' => true,
        ]);

        // Add to installed features
        $instance->addInstalledFeature($featureType, $config);

        // Create system pages for features that require them
        $this->createSystemPagesForFeature($instance, $featureType);

        // Update size
        $this->updateDatabaseSize($instance);

        return true;
    }

    /**
     * Uninstall a feature from a database.
     */
    public function uninstallFeature(DatabaseInstance $instance, string $featureType): bool
    {
        // Remove system pages for this feature
        $this->removeSystemPagesForFeature($instance, $featureType);

        // Remove from installed features
        $instance->removeInstalledFeature($featureType);

        // Note: We don't automatically rollback migrations as data might be important
        // This should be handled manually or with confirmation

        // Update size
        $this->updateDatabaseSize($instance);

        return true;
    }

    /**
     * Create system pages when a feature is installed.
     */
    protected function createSystemPagesForFeature(DatabaseInstance $instance, string $featureType): void
    {
        // Only create system pages for features that have them defined
        if (!in_array($featureType, $this->systemPageService->getSupportedFeatures())) {
            return;
        }

        if ($instance->isTemplateDatabase()) {
            $template = Template::find($instance->reference_id);
            if ($template) {
                $this->systemPageService->createTemplateSystemPages($template, $featureType);
            }
        } elseif ($instance->isWebsiteDatabase()) {
            $website = UserWebsite::find($instance->reference_id);
            if ($website) {
                $this->systemPageService->createUserWebsiteSystemPages($website, $featureType);
            }
        }
    }

    /**
     * Remove system pages when a feature is uninstalled.
     */
    protected function removeSystemPagesForFeature(DatabaseInstance $instance, string $featureType): void
    {
        // Only remove system pages for features that have them defined
        if (!in_array($featureType, $this->systemPageService->getSupportedFeatures())) {
            return;
        }

        if ($instance->isTemplateDatabase()) {
            $template = Template::find($instance->reference_id);
            if ($template) {
                $this->systemPageService->removeTemplateSystemPages($template, $featureType);
            }
        } elseif ($instance->isWebsiteDatabase()) {
            $website = UserWebsite::find($instance->reference_id);
            if ($website) {
                $this->systemPageService->removeUserWebsiteSystemPages($website, $featureType);
            }
        }
    }

    /**
     * Get list of tables in a database.
     */
    public function getTables(DatabaseInstance $instance): array
    {
        $tables = DB::select("SHOW TABLES FROM `{$instance->database_name}`");
        $tableKey = "Tables_in_{$instance->database_name}";

        $result = [];
        foreach ($tables as $table) {
            $tableName = $table->$tableKey;

            // Get table info
            $tableInfo = DB::select(
                "SELECT
                    TABLE_ROWS as row_count,
                    DATA_LENGTH + INDEX_LENGTH as size_bytes,
                    CREATE_TIME as created_at,
                    UPDATE_TIME as updated_at
                 FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                [$instance->database_name, $tableName]
            );

            $info = $tableInfo[0] ?? null;

            $result[] = [
                "name" => $tableName,
                "row_count" => $info->row_count ?? 0,
                "size_bytes" => $info->size_bytes ?? 0,
                "created_at" => $info->created_at,
                "updated_at" => $info->updated_at,
            ];
        }

        return $result;
    }

    /**
     * Get columns for a specific table.
     */
    public function getTableColumns(DatabaseInstance $instance, string $tableName): array
    {
        // Sanitize table name to prevent SQL injection
        $safeTableName = preg_replace('/[^a-zA-Z0-9_]/', '', $tableName);

        // Validate table exists by checking information_schema
        $tableExists = DB::select(
            "SELECT TABLE_NAME FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
            [$instance->database_name, $safeTableName]
        );

        if (empty($tableExists)) {
            throw new Exception("Table '{$safeTableName}' not found in database");
        }

        $columns = DB::select(
            "SELECT
                COLUMN_NAME as name,
                COLUMN_TYPE as type,
                IS_NULLABLE as nullable,
                COLUMN_KEY as `key`,
                COLUMN_DEFAULT as `default`,
                EXTRA as extra,
                COLUMN_COMMENT as comment
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION",
            [$instance->database_name, $safeTableName]
        );

        return array_map(function ($col) {
            return [
                'name' => $col->name,
                'type' => $col->type,
                'nullable' => $col->nullable === 'YES',
                'key' => $col->key, // PRI, UNI, MUL, or empty
                'default' => $col->default,
                'extra' => $col->extra, // auto_increment, etc.
                'comment' => $col->comment,
            ];
        }, $columns);
    }

    /**
     * Get rows from a specific table with pagination.
     */
    public function getTableRows(DatabaseInstance $instance, string $tableName, int $page = 1, int $perPage = 50, ?string $orderBy = null, string $orderDir = 'ASC'): array
    {
        // Sanitize table name to prevent SQL injection
        $safeTableName = preg_replace('/[^a-zA-Z0-9_]/', '', $tableName);

        // Validate table exists by checking information_schema
        $tableExists = DB::select(
            "SELECT TABLE_NAME FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
            [$instance->database_name, $safeTableName]
        );

        if (empty($tableExists)) {
            throw new Exception("Table '{$safeTableName}' not found in database");
        }

        // Set up dynamic connection for this database
        $connectionName = "user_db_{$instance->id}";
        Config::set("database.connections.{$connectionName}", [
            'driver' => 'mysql',
            'host' => config('database.connections.mysql.host'),
            'port' => config('database.connections.mysql.port'),
            'database' => $instance->database_name,
            'username' => config('database.connections.mysql.username'),
            'password' => config('database.connections.mysql.password'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        // Purge the connection to force a fresh one
        DB::purge($connectionName);
        $connection = DB::connection($connectionName);

        // Get total count
        $countResult = $connection->select("SELECT COUNT(*) as total FROM `{$safeTableName}`");
        $total = $countResult[0]->total ?? 0;

        // Build query
        $offset = ($page - 1) * $perPage;

        // Default to primary key or first column for ordering
        if (!$orderBy) {
            $columns = $this->getTableColumns($instance, $safeTableName);
            $primaryKey = collect($columns)->firstWhere('key', 'PRI');
            $orderBy = $primaryKey ? $primaryKey['name'] : ($columns[0]['name'] ?? 'id');
        }

        // Sanitize orderBy to prevent SQL injection
        $orderBy = preg_replace('/[^a-zA-Z0-9_]/', '', $orderBy);
        $orderDir = strtoupper($orderDir) === 'DESC' ? 'DESC' : 'ASC';

        $rows = $connection->select(
            "SELECT * FROM `{$safeTableName}` ORDER BY `{$orderBy}` {$orderDir} LIMIT ? OFFSET ?",
            [$perPage, $offset]
        );

        return [
            'rows' => array_map(function ($row) {
                return (array) $row;
            }, $rows),
            'pagination' => [
                'total' => (int) $total,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => (int) ceil($total / $perPage),
            ],
        ];
    }

    /**
     * Sanitize a string to make it safe for use in a database name.
     * Keeps only alphanumeric characters and underscores, converts to lowercase.
     */
    private function sanitizeForDatabaseName(string $name): string
    {
        // Convert to lowercase
        $sanitized = strtolower($name);

        // Replace spaces and hyphens with underscores
        $sanitized = str_replace([' ', '-'], '_', $sanitized);

        // Remove all non-alphanumeric characters except underscores
        $sanitized = preg_replace('/[^a-z0-9_]/', '', $sanitized);

        // Remove multiple consecutive underscores
        $sanitized = preg_replace('/_+/', '_', $sanitized);

        // Trim underscores from start and end
        $sanitized = trim($sanitized, '_');

        // Limit length to 20 characters
        $sanitized = substr($sanitized, 0, 20);

        // If empty after sanitization, use 'website' as default
        return empty($sanitized) ? 'website' : $sanitized;
    }
}
