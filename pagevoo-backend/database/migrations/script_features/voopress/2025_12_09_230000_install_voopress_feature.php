<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * VooPress Feature Migration
 *
 * VooPress doesn't require its own database tables as it operates on top
 * of existing features (Blog, Events, UAS, etc.). The configuration is stored
 * in the user_websites table (is_voopress, voopress_theme, voopress_config).
 *
 * This migration serves as a placeholder to register VooPress as an installed feature.
 */
return new class extends Migration
{
    public function up(): void
    {
        // VooPress uses existing feature tables (blog, events, etc.)
        // No additional tables needed - configuration is stored in user_websites table
    }

    public function down(): void
    {
        // Nothing to drop
    }
};
