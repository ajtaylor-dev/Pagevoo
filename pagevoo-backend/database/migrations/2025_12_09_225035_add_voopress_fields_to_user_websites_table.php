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
        Schema::table('user_websites', function (Blueprint $table) {
            $table->boolean('is_voopress')->default(false)->after('is_published');
            $table->string('voopress_theme', 50)->nullable()->after('is_voopress');
            $table->json('voopress_config')->nullable()->after('voopress_theme');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_websites', function (Blueprint $table) {
            $table->dropColumn(['is_voopress', 'voopress_theme', 'voopress_config']);
        });
    }
};
