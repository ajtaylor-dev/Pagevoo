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
        // Alter ENUM column to add 'brochure' option
        DB::statement("ALTER TABLE templates MODIFY COLUMN exclusive_to ENUM('pro', 'niche', 'brochure') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original ENUM
        DB::statement("ALTER TABLE templates MODIFY COLUMN exclusive_to ENUM('pro', 'niche') NULL");
    }
};
