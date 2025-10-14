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
            $table->json('css')->nullable()->after('content');
        });

        Schema::table('user_sections', function (Blueprint $table) {
            $table->json('css')->nullable()->after('content');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_sections', function (Blueprint $table) {
            $table->dropColumn('css');
        });

        Schema::table('user_sections', function (Blueprint $table) {
            $table->dropColumn('css');
        });
    }
};
