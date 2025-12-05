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
        Schema::table('user_sections', function (Blueprint $table) {
            $table->boolean('is_locked')->default(false)->after('order');
            $table->string('lock_type')->nullable()->after('is_locked'); // uas_login, uas_register, etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_sections', function (Blueprint $table) {
            $table->dropColumn(['is_locked', 'lock_type']);
        });
    }
};
