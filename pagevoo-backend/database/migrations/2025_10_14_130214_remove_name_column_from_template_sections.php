<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if 'name' column exists before dropping it
        if (Schema::hasColumn('template_sections', 'name')) {
            Schema::table('template_sections', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }

        if (Schema::hasColumn('user_sections', 'name')) {
            Schema::table('user_sections', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_sections', function (Blueprint $table) {
            $table->string('name')->nullable()->after('template_page_id');
        });

        Schema::table('user_sections', function (Blueprint $table) {
            $table->string('name')->nullable()->after('user_page_id');
        });
    }
};
