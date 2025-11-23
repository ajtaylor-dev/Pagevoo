<?php

namespace App\Services;

use App\Models\DatabaseInstance;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Artisan;
use Exception;

class DatabaseManager
{
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

        // Update size
        $this->updateDatabaseSize($instance);

        return true;
    }

    /**
     * Uninstall a feature from a database.
     */
    public function uninstallFeature(DatabaseInstance $instance, string $featureType): bool
    {
        // Remove from installed features
        $instance->removeInstalledFeature($featureType);

        // Note: We don't automatically rollback migrations as data might be important
        // This should be handled manually or with confirmation

        // Update size
        $this->updateDatabaseSize($instance);

        return true;
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
