<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates tables for Events Calendar script feature in per-user database.
     * This migration is run when Events feature is installed.
     */
    public function up(): void
    {
        // Event Categories Table
        Schema::create('event_categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('website_id'); // References user_websites in main DB
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('color', 7)->default('#98b290'); // Hex color for calendar display
            $table->integer('order')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('website_id');
            $table->index('slug');
            $table->unique(['website_id', 'slug']);
        });

        // Events Table
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('website_id'); // References user_websites in main DB
            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable(); // Short description for listings
            $table->longText('content')->nullable(); // Full event details (HTML from WYSIWYG)
            $table->string('featured_image')->nullable(); // Path to featured image

            // Date and Time
            $table->date('start_date');
            $table->date('end_date')->nullable(); // Null for single-day events
            $table->time('start_time')->nullable(); // Null for all-day events
            $table->time('end_time')->nullable();
            $table->boolean('is_all_day')->default(false);

            // Location
            $table->string('location')->nullable(); // Venue name/address
            $table->string('location_url')->nullable(); // Google Maps or venue website link
            $table->decimal('latitude', 10, 8)->nullable(); // For map integration
            $table->decimal('longitude', 11, 8)->nullable();

            // Online event support
            $table->boolean('is_online')->default(false);
            $table->string('online_url')->nullable(); // Zoom/Teams/etc link

            // Organization
            $table->foreignId('category_id')->nullable()->constrained('event_categories')->onDelete('set null');
            $table->enum('status', ['draft', 'published', 'cancelled'])->default('draft');
            $table->boolean('is_featured')->default(false);

            // Recurring events (future enhancement)
            $table->boolean('is_recurring')->default(false);
            $table->enum('recurrence_type', ['daily', 'weekly', 'monthly', 'yearly'])->nullable();
            $table->integer('recurrence_interval')->nullable(); // Every X days/weeks/months
            $table->date('recurrence_end_date')->nullable();
            $table->unsignedBigInteger('parent_event_id')->nullable(); // For recurring event instances

            // Optional fields
            $table->string('organizer_name')->nullable();
            $table->string('organizer_email')->nullable();
            $table->string('organizer_phone')->nullable();
            $table->string('ticket_url')->nullable(); // External ticketing link
            $table->decimal('price', 10, 2)->nullable(); // Display price (not for transactions)
            $table->string('price_text')->nullable(); // "Free", "$50-$100", "Donation", etc.
            $table->integer('capacity')->nullable(); // Maximum attendees

            // SEO
            $table->json('seo_meta')->nullable(); // {meta_title, meta_description, og_image}

            $table->timestamps();

            // Indexes
            $table->index('website_id');
            $table->index('slug');
            $table->index('status');
            $table->index('start_date');
            $table->index('end_date');
            $table->index('category_id');
            $table->index('is_featured');
            $table->index('parent_event_id');
            $table->unique(['website_id', 'slug']);
        });

        // Event Settings Table (per-website configuration)
        Schema::create('event_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('website_id')->unique();
            $table->integer('events_per_page')->default(10);
            $table->boolean('show_past_events')->default(false);
            $table->boolean('show_location')->default(true);
            $table->boolean('show_time')->default(true);
            $table->boolean('show_category')->default(true);
            $table->boolean('show_description')->default(true);
            $table->boolean('show_featured_image')->default(true);
            $table->boolean('show_organizer')->default(false);
            $table->boolean('show_price')->default(true);
            $table->string('date_format')->default('M d, Y'); // PHP date format
            $table->string('time_format')->default('g:i A'); // PHP time format
            $table->string('default_view')->default('list'); // list, grid, calendar
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
        Schema::dropIfExists('events');
        Schema::dropIfExists('event_categories');
        Schema::dropIfExists('event_settings');
    }
};
