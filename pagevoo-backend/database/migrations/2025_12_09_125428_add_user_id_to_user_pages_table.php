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
        Schema::table('user_pages', function (Blueprint $table) {
            // Add user_id for standalone system pages (not tied to a website)
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->onDelete('cascade');

            // Make user_website_id nullable (system pages won't have this)
            $table->foreignId('user_website_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_pages', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
