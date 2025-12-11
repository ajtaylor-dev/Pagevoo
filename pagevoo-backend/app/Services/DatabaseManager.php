<?php

namespace App\Services;

use App\Models\DatabaseInstance;
use App\Models\Template;
use App\Models\UserWebsite;
use App\Models\UserPage;
use App\Models\UserSection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Artisan;
use Exception;

class DatabaseManager
{
    protected SystemPageService $systemPageService;

    /**
     * Feature dependency mapping.
     * Key = feature that depends on other features
     * Value = array of features it depends on
     *
     * Example: 'voopress' => ['blog'] means VooPress requires Blog to be installed
     */
    protected array $featureDependencies = [
        'voopress' => ['blog'],  // VooPress requires blog feature
        'ecommerce' => ['user_access_system', 'image_gallery'],  // E-commerce requires UAS for customer accounts and Image Gallery for product photos
        // Add more static dependencies as features are developed
    ];

    /**
     * Configuration-based dependencies.
     * Returns features that are required based on the configuration of another feature.
     *
     * @param DatabaseInstance $instance
     * @param string $featureType The feature being checked for uninstall
     * @return array Features that depend on this one based on configuration
     */
    protected function getConfigurationDependencies(DatabaseInstance $instance, string $featureType): array
    {
        $blocking = [];

        // Check if booking feature has payments enabled and depends on e-commerce
        if ($featureType === 'ecommerce') {
            $installedFeatures = $this->getInstalledFeatureTypes($instance);

            if (in_array('booking', $installedFeatures)) {
                // Check if booking has any services with pricing or deposits
                try {
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

                    $hasPaidServices = DB::connection('temp')
                        ->table('booking_services')
                        ->where('price', '>', 0)
                        ->exists();

                    $hasDeposits = DB::connection('temp')
                        ->table('bookings')
                        ->where('deposit_paid', '>', 0)
                        ->orWhere('amount_paid', '>', 0)
                        ->exists();

                    DB::purge('temp');

                    if ($hasPaidServices || $hasDeposits) {
                        $blocking[] = 'booking';
                    }
                } catch (Exception $e) {
                    // If we can't check, assume it's safe to uninstall
                    \Log::warning("Could not check booking payment dependencies: " . $e->getMessage());
                }
            }
        }

        // Check if any feature requires UAS (user access system)
        if ($featureType === 'user_access_system') {
            // Future: Check if e-commerce has customer accounts enabled
            // Future: Check if other features require user authentication
        }

        return $blocking;
    }

    /**
     * Helper method to get just the feature types as a simple array.
     *
     * @param DatabaseInstance $instance
     * @return array Simple array of feature type strings
     */
    protected function getInstalledFeatureTypes(DatabaseInstance $instance): array
    {
        $features = $instance->getInstalledFeatures();
        return array_map(function($feature) {
            return $feature['type'];
        }, $features);
    }

    public function __construct()
    {
        $this->systemPageService = new SystemPageService();
    }

    /**
     * Get features that depend on the given feature.
     *
     * @param string $featureType The feature being checked
     * @return array List of features that depend on this feature
     */
    public function getDependentFeatures(string $featureType): array
    {
        $dependentFeatures = [];

        foreach ($this->featureDependencies as $feature => $dependencies) {
            if (in_array($featureType, $dependencies)) {
                $dependentFeatures[] = $feature;
            }
        }

        return $dependentFeatures;
    }

    /**
     * Check if a feature can be safely uninstalled.
     * Returns blocking features if any are installed that depend on this feature.
     *
     * @param DatabaseInstance $instance
     * @param string $featureType
     * @return array ['can_uninstall' => bool, 'blocking_features' => array, 'blocking_reasons' => array]
     */
    public function canUninstallFeature(DatabaseInstance $instance, string $featureType): array
    {
        $installedFeatureTypes = $this->getInstalledFeatureTypes($instance);
        $blockingFeatures = [];
        $blockingReasons = [];

        // Check static dependencies (Feature A requires Feature B)
        $dependentFeatures = $this->getDependentFeatures($featureType);
        foreach ($dependentFeatures as $dependent) {
            if (in_array($dependent, $installedFeatureTypes)) {
                $blockingFeatures[] = $dependent;
                $blockingReasons[$dependent] = 'This feature requires ' . $this->getFeatureName($featureType);
            }
        }

        // Check configuration-based dependencies
        $configDependencies = $this->getConfigurationDependencies($instance, $featureType);
        foreach ($configDependencies as $dependent) {
            if (!in_array($dependent, $blockingFeatures)) {
                $blockingFeatures[] = $dependent;
                $blockingReasons[$dependent] = $this->getConfigurationDependencyReason($featureType, $dependent);
            }
        }

        return [
            'can_uninstall' => empty($blockingFeatures),
            'blocking_features' => $blockingFeatures,
            'blocking_reasons' => $blockingReasons,
        ];
    }

    /**
     * Get a human-readable name for a feature type.
     *
     * @param string $featureType
     * @return string
     */
    protected function getFeatureName(string $featureType): string
    {
        $names = [
            'contact_form' => 'Contact Form',
            'image_gallery' => 'Image Gallery',
            'blog' => 'Blog',
            'events' => 'Events Calendar',
            'user_access_system' => 'User Access System',
            'booking' => 'Booking System',
            'voopress' => 'VooPress',
            'ecommerce' => 'E-commerce',
        ];

        return $names[$featureType] ?? ucwords(str_replace('_', ' ', $featureType));
    }

    /**
     * Get the reason why a feature is blocking uninstallation due to configuration.
     *
     * @param string $featureType The feature being uninstalled
     * @param string $dependent The feature blocking the uninstallation
     * @return string
     */
    protected function getConfigurationDependencyReason(string $featureType, string $dependent): string
    {
        if ($featureType === 'ecommerce' && $dependent === 'booking') {
            return 'Booking System has paid services or received payments that depend on the E-commerce feature';
        }

        return $this->getFeatureName($dependent) . ' is configured to use ' . $this->getFeatureName($featureType);
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

        // Create temporary connection for Artisan migrate command
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

        // ALSO configure user_db connection - migrations use Schema::connection('user_db')
        Config::set('database.connections.user_db', [
            'driver' => 'mysql',
            'host' => Config::get('database.connections.mysql.host'),
            'port' => Config::get('database.connections.mysql.port'),
            'database' => $instance->database_name,
            'username' => Config::get('database.connections.mysql.username'),
            'password' => Config::get('database.connections.mysql.password'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ]);
        DB::purge('user_db');

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
     * Get the tables associated with a feature type.
     * Tables are listed in the order they should be dropped (children first).
     */
    protected function getFeatureTables(string $featureType): array
    {
        $tableMap = [
            'contact_form' => [
                'support_tickets',
                'form_submissions',
                'contact_forms',
            ],
            'image_gallery' => [
                'gallery_image_mappings',
                'gallery_images',
                'gallery_albums',
                'image_galleries',
            ],
            'blog' => [
                'blog_post_tags',
                'blog_posts',
                'blog_tags',
                'blog_categories',
                'blog_settings',
            ],
            'events' => [
                'events',
                'event_categories',
                'event_settings',
            ],
            'user_access_system' => [
                'uas_activity_log',
                'uas_settings',
                'uas_permission_definitions',
                'uas_page_access',
                'uas_sessions',
                'uas_password_resets',
                'uas_user_security_answers',
                'uas_security_questions',
                'uas_email_verifications',
                'uas_users',
                'uas_groups',
            ],
            'booking' => [
                'booking_settings',
                'bookings',
                'booking_resources',
                'booking_availability',
                'booking_business_hours',
                'booking_staff_services',
                'booking_staff',
                'booking_services',
                'booking_categories',
            ],
            'voopress' => [
                // VooPress uses existing feature tables (blog, events, etc.)
                // Configuration is stored in user_websites table
            ],
            'ecommerce' => [
                'ecommerce_settings',
                'ecommerce_cart_items',
                'ecommerce_carts',
                'ecommerce_order_items',
                'ecommerce_orders',
                'ecommerce_customer_addresses',
                'ecommerce_customers',
                'ecommerce_digital_files',
                'ecommerce_product_variants',
                'ecommerce_products',
                'ecommerce_categories',
            ],
        ];

        return $tableMap[$featureType] ?? [];
    }

    /**
     * Drop feature tables from the database.
     */
    protected function dropFeatureTables(DatabaseInstance $instance, string $featureType): void
    {
        $tables = $this->getFeatureTables($featureType);

        if (empty($tables)) {
            return;
        }

        // Set up temporary connection to feature database
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

        // Disable foreign key checks to allow dropping tables in any order
        DB::connection('temp')->statement('SET FOREIGN_KEY_CHECKS = 0');

        foreach ($tables as $table) {
            try {
                DB::connection('temp')->statement("DROP TABLE IF EXISTS `{$table}`");
            } catch (Exception $e) {
                // Log but continue - table might not exist
                \Log::warning("Failed to drop table {$table} from {$instance->database_name}: " . $e->getMessage());
            }
        }

        // Re-enable foreign key checks
        DB::connection('temp')->statement('SET FOREIGN_KEY_CHECKS = 1');

        // Purge the temporary connection
        DB::purge('temp');
    }

    /**
     * Uninstall a feature from a database.
     */
    public function uninstallFeature(DatabaseInstance $instance, string $featureType): bool
    {
        // Remove system pages for this feature
        $this->removeSystemPagesForFeature($instance, $featureType);

        // Special handling for VooPress - clean up VooPress pages and config
        if ($featureType === 'voopress') {
            $this->cleanupVooPressFeature($instance);
        }

        // Drop feature tables from the database
        $this->dropFeatureTables($instance, $featureType);

        // Remove from installed features
        $instance->removeInstalledFeature($featureType);

        // Update size
        $this->updateDatabaseSize($instance);

        return true;
    }

    /**
     * Clean up VooPress pages and configuration when uninstalling.
     */
    protected function cleanupVooPressFeature(DatabaseInstance $instance): void
    {
        $userId = $instance->reference_id;

        // Delete VooPress sections first (foreign key constraint)
        $voopressPageIds = UserPage::where('user_id', $userId)
            ->where('feature_type', 'voopress')
            ->pluck('id');

        if ($voopressPageIds->isNotEmpty()) {
            UserSection::whereIn('user_page_id', $voopressPageIds)->delete();
        }

        // Delete VooPress pages
        UserPage::where('user_id', $userId)
            ->where('feature_type', 'voopress')
            ->delete();

        // Clear VooPress config from website
        $website = UserWebsite::where('user_id', $userId)->first();
        if ($website) {
            $website->update([
                'is_voopress' => false,
                'voopress_theme' => null,
                'voopress_config' => null,
            ]);
        }

        \Log::info("Cleaned up VooPress feature for user {$userId}");
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
            // reference_id is user_id for website databases, not website_id
            $website = UserWebsite::where('user_id', $instance->reference_id)->first();
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
            // reference_id is user_id for website databases, not website_id
            $website = UserWebsite::where('user_id', $instance->reference_id)->first();
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
