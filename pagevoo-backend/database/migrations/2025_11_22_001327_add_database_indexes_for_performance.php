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
        // Add indexes for templates table (if not exists)
        Schema::table('templates', function (Blueprint $table) {
            // Check and add indexes only if they don't exist
            if (!$this->indexExists('templates', 'templates_tier_category_index')) {
                $table->index('tier_category');
            }
            if (!$this->indexExists('templates', 'templates_business_type_index')) {
                $table->index('business_type');
            }
            if (!$this->indexExists('templates', 'templates_is_active_tier_category_index')) {
                $table->index(['is_active', 'tier_category']); // Composite index for filtering
            }
        });

        // Add indexes for template_pages table
        Schema::table('template_pages', function (Blueprint $table) {
            if (!$this->indexExists('template_pages', 'template_pages_is_homepage_index')) {
                $table->index('is_homepage');
            }
            if (!$this->indexExists('template_pages', 'template_pages_order_index')) {
                $table->index('order');
            }
        });

        // Add indexes for user_websites table
        Schema::table('user_websites', function (Blueprint $table) {
            if (!$this->indexExists('user_websites', 'user_websites_is_published_index')) {
                $table->index('is_published');
            }
            if (!$this->indexExists('user_websites', 'user_websites_user_id_is_published_index')) {
                $table->index(['user_id', 'is_published']); // Composite index for user's published sites
            }
        });

        // Add indexes for user_pages table
        Schema::table('user_pages', function (Blueprint $table) {
            if (!$this->indexExists('user_pages', 'user_pages_is_homepage_index')) {
                $table->index('is_homepage');
            }
            if (!$this->indexExists('user_pages', 'user_pages_order_index')) {
                $table->index('order');
            }
        });

        // Add indexes for section_library table
        Schema::table('section_library', function (Blueprint $table) {
            if (!$this->indexExists('section_library', 'section_library_user_id_index')) {
                $table->index('user_id');
            }
            if (!$this->indexExists('section_library', 'section_library_section_type_index')) {
                $table->index('section_type');
            }
            if (!$this->indexExists('section_library', 'section_library_is_pagevoo_official_index')) {
                $table->index('is_pagevoo_official');
            }
        });

        // Add indexes for page_library table
        Schema::table('page_library', function (Blueprint $table) {
            if (!$this->indexExists('page_library', 'page_library_user_id_index')) {
                $table->index('user_id');
            }
            if (!$this->indexExists('page_library', 'page_library_is_pagevoo_official_index')) {
                $table->index('is_pagevoo_official');
            }
        });
    }

    /**
     * Check if an index exists on a table
     */
    private function indexExists(string $table, string $index): bool
    {
        $result = Schema::getConnection()->select(
            "SHOW INDEX FROM `{$table}` WHERE Key_name = ?",
            [$index]
        );
        return count($result) > 0;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes from templates table
        Schema::table('templates', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
            $table->dropIndex(['tier_category']);
            $table->dropIndex(['business_type']);
            $table->dropIndex(['is_active', 'tier_category']);
        });

        // Drop indexes from template_pages table
        Schema::table('template_pages', function (Blueprint $table) {
            $table->dropIndex(['template_id']);
            $table->dropIndex(['is_homepage']);
            $table->dropIndex(['order']);
        });

        // Drop indexes from user_websites table
        Schema::table('user_websites', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['template_id']);
            $table->dropIndex(['is_published']);
            $table->dropIndex(['user_id', 'is_published']);
        });

        // Drop indexes from user_pages table
        Schema::table('user_pages', function (Blueprint $table) {
            $table->dropIndex(['is_homepage']);
            $table->dropIndex(['order']);
        });

        // Drop indexes from template_images table
        Schema::table('template_images', function (Blueprint $table) {
            $table->dropIndex(['template_id']);
        });

        // Drop indexes from section_library table
        Schema::table('section_library', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['section_type']);
            $table->dropIndex(['is_pagevoo_official']);
        });

        // Drop indexes from page_library table
        Schema::table('page_library', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['is_pagevoo_official']);
        });
    }
};
