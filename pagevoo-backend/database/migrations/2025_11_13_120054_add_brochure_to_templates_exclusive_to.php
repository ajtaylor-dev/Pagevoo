<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if we're using SQLite (for testing) or MySQL (production)
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            // For SQLite, we need to recreate the column
            // SQLite doesn't support MODIFY COLUMN or proper ENUM
            // Using CHECK constraint instead
            Schema::table('templates', function (Blueprint $table) {
                // Drop the old column (if it exists)
                if (Schema::hasColumn('templates', 'exclusive_to_backup')) {
                    $table->dropColumn('exclusive_to_backup');
                }

                // Rename the current column to backup
                $table->renameColumn('exclusive_to', 'exclusive_to_backup');
            });

            Schema::table('templates', function (Blueprint $table) {
                // Create new column with updated values
                $table->string('exclusive_to')->nullable()
                    ->after('exclusive_to_backup');
            });

            // Copy data from backup to new column
            DB::statement("UPDATE templates SET exclusive_to = exclusive_to_backup");

            // Drop the backup column
            Schema::table('templates', function (Blueprint $table) {
                $table->dropColumn('exclusive_to_backup');
            });

            // Add CHECK constraint for SQLite
            DB::statement("
                CREATE TRIGGER IF NOT EXISTS check_exclusive_to_insert
                BEFORE INSERT ON templates
                FOR EACH ROW
                WHEN NEW.exclusive_to IS NOT NULL AND NEW.exclusive_to NOT IN ('pro', 'niche', 'brochure')
                BEGIN
                    SELECT RAISE(ABORT, 'Invalid exclusive_to value');
                END;
            ");

            DB::statement("
                CREATE TRIGGER IF NOT EXISTS check_exclusive_to_update
                BEFORE UPDATE ON templates
                FOR EACH ROW
                WHEN NEW.exclusive_to IS NOT NULL AND NEW.exclusive_to NOT IN ('pro', 'niche', 'brochure')
                BEGIN
                    SELECT RAISE(ABORT, 'Invalid exclusive_to value');
                END;
            ");
        } else {
            // For MySQL, use MODIFY COLUMN with ENUM
            DB::statement("ALTER TABLE templates MODIFY COLUMN exclusive_to ENUM('pro', 'niche', 'brochure') NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            // Drop the triggers
            DB::statement("DROP TRIGGER IF EXISTS check_exclusive_to_insert");
            DB::statement("DROP TRIGGER IF EXISTS check_exclusive_to_update");

            // For SQLite, recreate column with old values
            Schema::table('templates', function (Blueprint $table) {
                $table->renameColumn('exclusive_to', 'exclusive_to_backup');
            });

            Schema::table('templates', function (Blueprint $table) {
                $table->string('exclusive_to')->nullable()
                    ->after('exclusive_to_backup');
            });

            // Copy data, removing 'brochure' values
            DB::statement("UPDATE templates SET exclusive_to = CASE WHEN exclusive_to_backup = 'brochure' THEN NULL ELSE exclusive_to_backup END");

            Schema::table('templates', function (Blueprint $table) {
                $table->dropColumn('exclusive_to_backup');
            });

            // Add back the old CHECK constraint
            DB::statement("
                CREATE TRIGGER IF NOT EXISTS check_exclusive_to_insert
                BEFORE INSERT ON templates
                FOR EACH ROW
                WHEN NEW.exclusive_to IS NOT NULL AND NEW.exclusive_to NOT IN ('pro', 'niche')
                BEGIN
                    SELECT RAISE(ABORT, 'Invalid exclusive_to value');
                END;
            ");

            DB::statement("
                CREATE TRIGGER IF NOT EXISTS check_exclusive_to_update
                BEFORE UPDATE ON templates
                FOR EACH ROW
                WHEN NEW.exclusive_to IS NOT NULL AND NEW.exclusive_to NOT IN ('pro', 'niche')
                BEGIN
                    SELECT RAISE(ABORT, 'Invalid exclusive_to value');
                END;
            ");
        } else {
            // For MySQL
            DB::statement("ALTER TABLE templates MODIFY COLUMN exclusive_to ENUM('pro', 'niche') NULL");
        }
    }
};
