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
            $table->text('site_css')->nullable()->after('name');
            $table->string('default_title')->nullable()->after('site_css');
            $table->text('default_description')->nullable()->after('default_title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_websites', function (Blueprint $table) {
            $table->dropColumn(['site_css', 'default_title', 'default_description']);
        });
    }
};
