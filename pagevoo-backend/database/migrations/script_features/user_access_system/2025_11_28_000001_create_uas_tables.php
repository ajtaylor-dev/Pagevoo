<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * User Access System (UAS) - Complete user management with groups and permissions
     */
    public function up(): void
    {
        // Groups table - hierarchical user groups
        Schema::connection('user_db')->create('uas_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Admins, Moderators, Members, Banned
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->integer('hierarchy_level')->default(100); // Lower = more power (1=Admin, 100=default)
            $table->json('permissions')->nullable(); // JSON object of permission:boolean pairs
            $table->boolean('is_default')->default(false); // New users assigned to this group
            $table->boolean('is_system')->default(false); // System groups can't be deleted
            $table->timestamps();
        });

        // Users table - site visitors who register
        Schema::connection('user_db')->create('uas_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('uas_groups')->onDelete('restrict');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('display_name')->nullable();
            $table->string('avatar')->nullable();
            $table->text('bio')->nullable();
            $table->boolean('email_verified')->default(false);
            $table->timestamp('email_verified_at')->nullable();
            $table->json('permission_overrides')->nullable(); // Individual overrides for group permissions
            $table->string('status')->default('pending'); // pending, active, suspended
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Email verification tokens
        Schema::connection('user_db')->create('uas_email_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('token', 64)->unique();
            $table->json('registration_data'); // Store form data until verified
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // Security questions - predefined questions
        Schema::connection('user_db')->create('uas_security_questions', function (Blueprint $table) {
            $table->id();
            $table->string('question');
            $table->integer('order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // User security answers - each user answers 3 questions
        Schema::connection('user_db')->create('uas_user_security_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('uas_users')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('uas_security_questions')->onDelete('cascade');
            $table->string('answer_hash'); // Hashed answer for security
            $table->timestamps();

            $table->unique(['user_id', 'question_id']);
        });

        // Password reset tokens
        Schema::connection('user_db')->create('uas_password_resets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('uas_users')->onDelete('cascade');
            $table->string('token', 64)->unique();
            $table->boolean('email_verified')->default(false);
            $table->boolean('questions_verified')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // User sessions for "remember me" functionality
        Schema::connection('user_db')->create('uas_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('uas_users')->onDelete('cascade');
            $table->string('token', 64)->unique();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->boolean('remember_me')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_activity_at')->useCurrent();
            $table->timestamps();
        });

        // Page access control - which pages are locked
        Schema::connection('user_db')->create('uas_page_access', function (Blueprint $table) {
            $table->id();
            $table->string('page_id'); // References page in website JSON
            $table->string('page_name'); // For display in manager
            $table->boolean('is_locked')->default(false);
            $table->json('allowed_groups')->nullable(); // Array of group IDs that can access
            $table->json('allowed_users')->nullable(); // Array of user IDs with direct access
            $table->json('denied_users')->nullable(); // Array of user IDs explicitly denied
            $table->string('redirect_to')->default('login'); // Where to redirect unauthorized: login, home, custom
            $table->string('custom_redirect_url')->nullable();
            $table->timestamps();

            $table->unique('page_id');
        });

        // Permission definitions - expandable as features are installed
        Schema::connection('user_db')->create('uas_permission_definitions', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., 'page.view', 'booking.create', 'shop.purchase'
            $table->string('name'); // Human readable name
            $table->string('category'); // pages, booking, shop, etc.
            $table->text('description')->nullable();
            $table->string('feature')->nullable(); // Which feature this belongs to (null = core UAS)
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        // UAS Settings
        Schema::connection('user_db')->create('uas_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Activity log for auditing
        Schema::connection('user_db')->create('uas_activity_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('uas_users')->onDelete('set null');
            $table->string('action'); // login, logout, register, password_reset, etc.
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->json('details')->nullable(); // Additional context
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('user_db')->dropIfExists('uas_activity_log');
        Schema::connection('user_db')->dropIfExists('uas_settings');
        Schema::connection('user_db')->dropIfExists('uas_permission_definitions');
        Schema::connection('user_db')->dropIfExists('uas_page_access');
        Schema::connection('user_db')->dropIfExists('uas_sessions');
        Schema::connection('user_db')->dropIfExists('uas_password_resets');
        Schema::connection('user_db')->dropIfExists('uas_user_security_answers');
        Schema::connection('user_db')->dropIfExists('uas_security_questions');
        Schema::connection('user_db')->dropIfExists('uas_email_verifications');
        Schema::connection('user_db')->dropIfExists('uas_users');
        Schema::connection('user_db')->dropIfExists('uas_groups');
    }
};
