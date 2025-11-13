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
        // Copy package values to account_tier for existing users
        // This ensures users who had brochure/niche/pro packages maintain their tier
        DB::statement("
            UPDATE users
            SET account_tier = CASE
                WHEN package = 'brochure' THEN 'brochure'
                WHEN package = 'niche' THEN 'niche'
                WHEN package = 'pro' THEN 'pro'
                ELSE 'trial'
            END
            WHERE account_tier IS NULL OR account_tier = 'trial'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this data migration
    }
};
