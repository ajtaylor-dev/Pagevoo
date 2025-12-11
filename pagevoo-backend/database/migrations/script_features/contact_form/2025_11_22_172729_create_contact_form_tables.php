<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates tables for Contact Form script feature in per-user database.
     * This migration is run when Contact Form feature is installed.
     */
    public function up(): void
    {
        // Contact Forms Configuration Table
        Schema::connection('user_db')->create('contact_forms', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('website_id'); // References user_websites in main DB
            $table->string('name'); // Admin reference name
            $table->enum('form_type', ['general', 'support', 'mass_mailer'])->default('general');
            $table->string('recipient_email');
            $table->json('spam_protection')->nullable(); // {honeypot: bool, recaptcha_type: string}
            $table->json('storage_options'); // {database: bool, email: bool}
            $table->json('auto_responder')->nullable(); // {enabled: bool, subject: string, message: text}
            $table->boolean('allow_attachments')->default(false);
            $table->json('allowed_file_types')->nullable(); // Array of allowed types
            $table->json('styling')->nullable(); // CSS properties
            $table->timestamps();

            // Indexes
            $table->index('website_id');
            $table->index('form_type');
        });

        // Form Submissions Table
        Schema::connection('user_db')->create('form_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_form_id')->constrained('contact_forms')->onDelete('cascade');
            $table->json('data'); // Submitted field values
            $table->json('attachments')->nullable(); // File paths if applicable
            $table->string('ip_address', 45); // Support IPv6
            $table->string('user_agent')->nullable();
            $table->enum('status', ['new', 'read', 'archived', 'spam'])->default('new');
            $table->timestamps();

            // Indexes
            $table->index('contact_form_id');
            $table->index('status');
            $table->index('created_at'); // For date filtering
        });

        // Support Tickets Table (extends form_submissions)
        Schema::connection('user_db')->create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_submission_id')->constrained('form_submissions')->onDelete('cascade');
            $table->string('ticket_number', 50)->unique(); // TICK-YYYYMMDD-XXXX format
            $table->string('category')->nullable();
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open');
            $table->unsignedBigInteger('assigned_to')->nullable(); // user_id from main DB
            $table->timestamps();

            // Indexes
            $table->index('ticket_number');
            $table->index('status');
            $table->index('priority');
            $table->index('assigned_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('user_db')->dropIfExists('support_tickets');
        Schema::connection('user_db')->dropIfExists('form_submissions');
        Schema::connection('user_db')->dropIfExists('contact_forms');
    }
};
