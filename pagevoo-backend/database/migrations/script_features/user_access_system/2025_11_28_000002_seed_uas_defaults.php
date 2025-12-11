<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Seed default UAS data - groups, security questions, core permissions
     */
    public function up(): void
    {
        $now = now();

        // Default Groups
        DB::connection('user_db')->table('uas_groups')->insert([
            [
                'name' => 'Admins',
                'slug' => 'admins',
                'description' => 'Full administrative access to all features',
                'hierarchy_level' => 1,
                'permissions' => json_encode(['*' => true]), // Wildcard - all permissions
                'is_default' => false,
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Moderators',
                'slug' => 'moderators',
                'description' => 'Can manage content and users with limited access',
                'hierarchy_level' => 2,
                'permissions' => json_encode([
                    'page.view_locked' => true,
                    'user.view' => true,
                ]),
                'is_default' => false,
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Members',
                'slug' => 'members',
                'description' => 'Standard registered users',
                'hierarchy_level' => 3,
                'permissions' => json_encode([
                    'page.view_locked' => true,
                ]),
                'is_default' => true, // New users go here
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Banned',
                'slug' => 'banned',
                'description' => 'Suspended users with no access',
                'hierarchy_level' => 999,
                'permissions' => json_encode([]), // No permissions
                'is_default' => false,
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        // Security Questions
        DB::connection('user_db')->table('uas_security_questions')->insert([
            [
                'question' => 'What is your mother\'s maiden name?',
                'order' => 1,
                'active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'question' => 'What was the name of your first pet?',
                'order' => 2,
                'active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'question' => 'What city were you born in?',
                'order' => 3,
                'active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'question' => 'What was the name of your first school?',
                'order' => 4,
                'active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'question' => 'What is your favorite movie?',
                'order' => 5,
                'active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        // Core Permission Definitions (UAS base permissions)
        DB::connection('user_db')->table('uas_permission_definitions')->insert([
            [
                'key' => 'page.view_locked',
                'name' => 'View Locked Pages',
                'category' => 'pages',
                'description' => 'Can access pages that are locked to members',
                'feature' => null,
                'order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'user.view',
                'name' => 'View Users',
                'category' => 'users',
                'description' => 'Can view other user profiles',
                'feature' => null,
                'order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'user.edit_own',
                'name' => 'Edit Own Profile',
                'category' => 'users',
                'description' => 'Can edit their own profile',
                'feature' => null,
                'order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        // Default Settings
        DB::connection('user_db')->table('uas_settings')->insert([
            [
                'key' => 'registration_enabled',
                'value' => 'true',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'email_verification_required',
                'value' => 'true',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'security_questions_required',
                'value' => 'true',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'session_lifetime_minutes',
                'value' => '120', // 2 hours for normal sessions
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'remember_me_days',
                'value' => '30',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'password_reset_expiry_hours',
                'value' => '24',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'max_login_attempts',
                'value' => '5',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'lockout_duration_minutes',
                'value' => '15',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::connection('user_db')->table('uas_settings')->truncate();
        DB::connection('user_db')->table('uas_permission_definitions')->where('feature', null)->delete();
        DB::connection('user_db')->table('uas_security_questions')->truncate();
        DB::connection('user_db')->table('uas_groups')->where('is_system', true)->delete();
    }
};
