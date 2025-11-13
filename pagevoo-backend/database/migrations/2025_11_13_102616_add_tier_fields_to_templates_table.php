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
            $table->enum('tier_category', ['trial', 'brochure', 'niche', 'pro'])->default('brochure')->after('business_type');
            $table->boolean('uses_trial_features_only')->default(false)->after('tier_category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn(['tier_category', 'uses_trial_features_only']);
        });
    }
};
