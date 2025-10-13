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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, integer, boolean, json
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insert default upload settings
        DB::table('settings')->insert([
            [
                'key' => 'upload_max_gallery_image_size',
                'value' => '2048',
                'type' => 'integer',
                'description' => 'Maximum file size for gallery images in KB',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'upload_max_preview_image_size',
                'value' => '5120',
                'type' => 'integer',
                'description' => 'Maximum file size for preview images in KB',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'upload_allowed_gallery_formats',
                'value' => 'jpeg,png,jpg,gif,svg,webp',
                'type' => 'string',
                'description' => 'Allowed file formats for gallery images (comma-separated)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'upload_allowed_preview_formats',
                'value' => 'jpeg,png,jpg,gif,webp',
                'type' => 'string',
                'description' => 'Allowed file formats for preview images (comma-separated)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
