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
        Schema::table('template_sections', function (Blueprint $table) {
            $table->string('section_name')->nullable()->after('type');
            $table->string('section_id')->nullable()->after('section_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_sections', function (Blueprint $table) {
            $table->dropColumn(['section_name', 'section_id']);
        });
    }
};
