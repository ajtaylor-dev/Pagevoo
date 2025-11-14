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
        Schema::table('page_library', function (Blueprint $table) {
            $table->boolean('is_pagevoo_official')->default(false)->after('is_public');
            $table->index('is_pagevoo_official');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('page_library', function (Blueprint $table) {
            $table->dropIndex(['is_pagevoo_official']);
            $table->dropColumn('is_pagevoo_official');
        });
    }
};
