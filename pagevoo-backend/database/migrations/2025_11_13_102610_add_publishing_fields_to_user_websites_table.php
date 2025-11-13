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
            $table->string('preview_hash', 32)->unique()->nullable()->after('template_id');
            $table->string('subdomain', 255)->unique()->nullable()->after('preview_hash');
            $table->string('custom_domain', 255)->unique()->nullable()->after('subdomain');
            $table->boolean('is_published')->default(false)->after('custom_domain');
            $table->timestamp('last_published_at')->nullable()->after('is_published');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_websites', function (Blueprint $table) {
            $table->dropColumn(['preview_hash', 'subdomain', 'custom_domain', 'is_published', 'last_published_at']);
        });
    }
};
