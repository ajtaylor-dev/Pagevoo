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
        Schema::create('tier_permissions', function (Blueprint $table) {
            $table->id();
            $table->enum('tier', ['trial', 'brochure', 'niche', 'pro'])->unique();
            $table->json('permissions'); // Store all permissions for this tier as JSON
            $table->timestamps();
        });

        // Seed with data from config file
        $tiers = ['trial', 'brochure', 'niche', 'pro'];
        foreach ($tiers as $tier) {
            DB::table('tier_permissions')->insert([
                'tier' => $tier,
                'permissions' => json_encode(config("pagevoo_permissions.{$tier}")),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tier_permissions');
    }
};
