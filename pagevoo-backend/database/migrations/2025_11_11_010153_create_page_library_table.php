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
        Schema::create('page_library', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('preview_image')->nullable(); // Screenshot of full page
            $table->text('meta_description')->nullable();
            $table->string('meta_keywords', 500)->nullable();
            $table->json('page_data'); // Full page object with sections
            $table->longText('site_css')->nullable(); // Site-wide CSS that was active
            $table->json('tags')->nullable(); // ['landing', 'contact', 'about', etc.]
            $table->boolean('is_public')->default(false);
            $table->timestamps();

            // Indexes for better query performance
            $table->index('user_id');
            $table->index('is_public');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('page_library');
    }
};
