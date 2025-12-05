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
        Schema::table('user_pages', function (Blueprint $table) {
            $table->boolean('is_system')->default(false)->after('order');
            $table->string('system_type')->nullable()->after('is_system'); // login, register, dashboard, etc.
            $table->string('feature_type')->nullable()->after('system_type'); // user_access_system, booking, etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_pages', function (Blueprint $table) {
            $table->dropColumn(['is_system', 'system_type', 'feature_type']);
        });
    }
};
