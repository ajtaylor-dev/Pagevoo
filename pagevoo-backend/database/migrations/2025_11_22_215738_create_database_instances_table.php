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
        Schema::create('database_instances', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['template', 'website'])->comment('Type of database instance');
            $table->unsignedBigInteger('reference_id')->comment('ID of template or user_website');
            $table->string('database_name')->unique()->comment('Actual database name (e.g., pagevoo_template_123)');
            $table->enum('status', ['active', 'inactive', 'creating', 'copying', 'deleting', 'error'])->default('active');
            $table->bigInteger('size_bytes')->default(0)->comment('Database size in bytes');
            $table->timestamp('last_backup_at')->nullable();
            $table->json('metadata')->nullable()->comment('Additional metadata (installed features, etc.)');
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['type', 'reference_id']);
            $table->index('database_name');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('database_instances');
    }
};
