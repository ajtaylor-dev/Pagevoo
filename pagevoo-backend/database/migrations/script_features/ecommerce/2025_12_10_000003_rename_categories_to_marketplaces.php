<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Renames ecommerce_categories to ecommerce_marketplaces and updates products table
     */
    public function up(): void
    {
        // Rename ecommerce_categories to ecommerce_marketplaces
        Schema::connection('user_db')->rename('ecommerce_categories', 'ecommerce_marketplaces');

        // Drop old foreign key and column from products, add new marketplace_id
        Schema::connection('user_db')->table('ecommerce_products', function (Blueprint $table) {
            // Drop old foreign key constraint first
            $table->dropForeign(['category_id']);
            // Rename the column
            $table->renameColumn('category_id', 'marketplace_id');
        });

        // Update the foreign key reference
        Schema::connection('user_db')->table('ecommerce_products', function (Blueprint $table) {
            $table->foreign('marketplace_id')
                  ->references('id')
                  ->on('ecommerce_marketplaces')
                  ->nullOnDelete();
        });

        // Update self-referencing foreign key in marketplaces table
        Schema::connection('user_db')->table('ecommerce_marketplaces', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
        });

        Schema::connection('user_db')->table('ecommerce_marketplaces', function (Blueprint $table) {
            $table->foreign('parent_id')
                  ->references('id')
                  ->on('ecommerce_marketplaces')
                  ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse: rename marketplaces back to categories
        Schema::connection('user_db')->table('ecommerce_marketplaces', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
        });

        Schema::connection('user_db')->table('ecommerce_products', function (Blueprint $table) {
            $table->dropForeign(['marketplace_id']);
            $table->renameColumn('marketplace_id', 'category_id');
        });

        Schema::connection('user_db')->rename('ecommerce_marketplaces', 'ecommerce_categories');

        Schema::connection('user_db')->table('ecommerce_products', function (Blueprint $table) {
            $table->foreign('category_id')
                  ->references('id')
                  ->on('ecommerce_categories')
                  ->nullOnDelete();
        });

        Schema::connection('user_db')->table('ecommerce_categories', function (Blueprint $table) {
            $table->foreign('parent_id')
                  ->references('id')
                  ->on('ecommerce_categories')
                  ->nullOnDelete();
        });
    }
};
