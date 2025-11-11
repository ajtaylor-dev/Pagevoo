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
        Schema::create('section_library', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('preview_image')->nullable();
            $table->string('section_type', 100); // hero-simple, navbar, grid, etc.
            $table->json('section_data'); // Full section object with content, CSS, etc.
            $table->json('tags')->nullable(); // ['hero', 'banner', 'CTA', etc.]
            $table->boolean('is_public')->default(false);
            $table->timestamps();

            // Indexes for better query performance
            $table->index(['user_id', 'section_type']);
            $table->index('is_public');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('section_library');
    }
};
