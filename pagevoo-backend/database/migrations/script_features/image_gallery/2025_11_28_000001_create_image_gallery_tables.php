<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates tables for Image Gallery script feature in per-user database.
     * This migration is run when Image Gallery feature is installed.
     */
    public function up(): void
    {
        // Image Galleries Configuration Table
        Schema::connection('user_db')->create('image_galleries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('website_id'); // References user_websites in main DB
            $table->string('name'); // Admin reference name
            $table->text('description')->nullable();
            $table->enum('layout', ['grid', 'masonry', 'carousel', 'justified'])->default('grid');
            $table->integer('columns')->default(3);
            $table->string('gap', 20)->default('16px');
            $table->boolean('enable_lightbox')->default(true);
            $table->enum('show_captions', ['hover', 'below', 'none'])->default('hover');
            $table->enum('hover_effect', ['none', 'zoom', 'darken', 'brighten', 'grayscale'])->default('zoom');
            $table->string('border_radius', 20)->default('8px');
            $table->enum('aspect_ratio', ['square', '4:3', '16:9', 'original'])->default('square');
            $table->boolean('lazy_loading')->default(true);
            $table->json('container_style')->nullable(); // {padding, background, borderRadius}
            $table->timestamps();

            // Indexes
            $table->index('website_id');
        });

        // Gallery Albums/Categories Table
        Schema::connection('user_db')->create('gallery_albums', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('website_id'); // References user_websites in main DB
            $table->string('name');
            $table->text('description')->nullable();
            $table->uuid('cover_image_id')->nullable();
            $table->integer('image_count')->default(0);
            $table->integer('order')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('website_id');
            $table->index('order');
        });

        // Gallery Images Table
        Schema::connection('user_db')->create('gallery_images', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('website_id'); // References user_websites in main DB
            $table->uuid('album_id')->nullable(); // Can be null (uncategorized)
            $table->string('filename');
            $table->string('path'); // Relative path to image file
            $table->string('thumbnail_path')->nullable(); // Relative path to thumbnail
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('alt_text')->nullable(); // For accessibility
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->integer('size')->default(0); // File size in bytes
            $table->string('mime_type', 50)->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('website_id');
            $table->index('album_id');
            $table->index('order');

            // Foreign key
            $table->foreign('album_id')
                ->references('id')
                ->on('gallery_albums')
                ->onDelete('set null');
        });

        // Gallery to Image mapping for multi-gallery support
        Schema::connection('user_db')->create('gallery_image_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gallery_id')->constrained('image_galleries')->onDelete('cascade');
            $table->uuid('image_id');
            $table->integer('order')->default(0);
            $table->timestamps();

            // Indexes
            $table->index(['gallery_id', 'image_id']);
            $table->index('order');

            // Foreign key
            $table->foreign('image_id')
                ->references('id')
                ->on('gallery_images')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('user_db')->dropIfExists('gallery_image_mappings');
        Schema::connection('user_db')->dropIfExists('gallery_images');
        Schema::connection('user_db')->dropIfExists('gallery_albums');
        Schema::connection('user_db')->dropIfExists('image_galleries');
    }
};
