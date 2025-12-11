<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds gallery_album_id to ecommerce_categories to link with Image Gallery albums.
     * This migration is run when E-commerce feature is installed/upgraded.
     */
    public function up(): void
    {
        // Add gallery_album_id to categories to link with Image Gallery albums
        if (!Schema::connection('user_db')->hasColumn('ecommerce_categories', 'gallery_album_id')) {
            Schema::connection('user_db')->table('ecommerce_categories', function (Blueprint $table) {
                $table->uuid('gallery_album_id')->nullable()->after('parent_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::connection('user_db')->hasColumn('ecommerce_categories', 'gallery_album_id')) {
            Schema::connection('user_db')->table('ecommerce_categories', function (Blueprint $table) {
                $table->dropColumn('gallery_album_id');
            });
        }
    }
};
