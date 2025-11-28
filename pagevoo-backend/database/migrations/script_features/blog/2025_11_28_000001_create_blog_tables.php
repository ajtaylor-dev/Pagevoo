<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates tables for Blog script feature in per-user database.
     * This migration is run when Blog feature is installed.
     */
    public function up(): void
    {
        // Blog Categories Table
        Schema::create('blog_categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('website_id'); // References user_websites in main DB
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('website_id');
            $table->index('slug');
            $table->unique(['website_id', 'slug']);
        });

        // Blog Tags Table
        Schema::create('blog_tags', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('website_id'); // References user_websites in main DB
            $table->string('name');
            $table->string('slug');
            $table->timestamps();

            // Indexes
            $table->index('website_id');
            $table->index('slug');
            $table->unique(['website_id', 'slug']);
        });

        // Blog Posts Table
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('website_id'); // References user_websites in main DB
            $table->string('title');
            $table->string('slug');
            $table->text('excerpt')->nullable(); // Short summary for listings
            $table->longText('content'); // Full post content (HTML from WYSIWYG)
            $table->string('featured_image')->nullable(); // Path to featured image
            $table->string('author_name')->nullable(); // Author display name
            $table->foreignId('category_id')->nullable()->constrained('blog_categories')->onDelete('set null');
            $table->enum('status', ['draft', 'published', 'scheduled'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->boolean('allow_comments')->default(false); // For future use
            $table->integer('view_count')->default(0);
            $table->json('seo_meta')->nullable(); // {meta_title, meta_description, og_image}
            $table->timestamps();

            // Indexes
            $table->index('website_id');
            $table->index('slug');
            $table->index('status');
            $table->index('published_at');
            $table->index('category_id');
            $table->unique(['website_id', 'slug']);
        });

        // Blog Post Tags Pivot Table
        Schema::create('blog_post_tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('blog_posts')->onDelete('cascade');
            $table->foreignId('tag_id')->constrained('blog_tags')->onDelete('cascade');
            $table->timestamps();

            // Indexes
            $table->unique(['post_id', 'tag_id']);
        });

        // Blog Settings Table (per-website configuration)
        Schema::create('blog_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('website_id')->unique();
            $table->string('default_author_name')->nullable();
            $table->integer('posts_per_page')->default(10);
            $table->boolean('show_author')->default(true);
            $table->boolean('show_date')->default(true);
            $table->boolean('show_category')->default(true);
            $table->boolean('show_tags')->default(true);
            $table->boolean('show_excerpt')->default(true);
            $table->boolean('show_featured_image')->default(true);
            $table->boolean('show_read_more')->default(true);
            $table->string('date_format')->default('M d, Y'); // PHP date format
            $table->timestamps();

            // Index
            $table->index('website_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blog_post_tags');
        Schema::dropIfExists('blog_posts');
        Schema::dropIfExists('blog_tags');
        Schema::dropIfExists('blog_categories');
        Schema::dropIfExists('blog_settings');
    }
};
