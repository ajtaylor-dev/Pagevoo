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
        Schema::table('templates', function (Blueprint $table) {
            $table->enum('exclusive_to', ['pro', 'niche'])->nullable()->after('is_active');
            $table->json('technologies')->nullable()->after('exclusive_to');
            $table->json('features')->nullable()->after('technologies');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn(['exclusive_to', 'technologies', 'features']);
        });
    }
};
