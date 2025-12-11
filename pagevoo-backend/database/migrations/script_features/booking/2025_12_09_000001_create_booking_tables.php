<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates all tables needed for the Booking System feature.
     */
    public function up(): void
    {
        // Booking Categories (for organizing services)
        Schema::connection('user_db')->create('booking_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('color', 7)->default('#3B82F6'); // Hex color for calendar display
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Booking Services (what can be booked)
        Schema::connection('user_db')->create('booking_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained('booking_categories')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('featured_image')->nullable();

            // Service type: appointment (1-on-1) or reservation (capacity-based)
            $table->enum('type', ['appointment', 'reservation'])->default('appointment');

            // Duration settings
            $table->integer('duration_minutes')->default(60);
            $table->integer('buffer_before_minutes')->default(0); // Gap before appointment
            $table->integer('buffer_after_minutes')->default(0); // Gap after appointment

            // Capacity (for reservations - e.g., table seats, room capacity)
            $table->integer('capacity')->default(1);
            $table->integer('min_party_size')->default(1);
            $table->integer('max_party_size')->nullable(); // null = same as capacity

            // Pricing
            $table->enum('pricing_type', ['free', 'fixed', 'per_person', 'hourly'])->default('free');
            $table->decimal('price', 10, 2)->default(0);
            $table->string('currency', 3)->default('GBP');

            // Payment options
            $table->boolean('allow_pay_online')->default(false);
            $table->boolean('allow_pay_at_venue')->default(true);
            $table->boolean('require_deposit')->default(false);
            $table->decimal('deposit_amount', 10, 2)->nullable();
            $table->enum('deposit_type', ['fixed', 'percentage'])->nullable();

            // Booking rules
            $table->boolean('require_login')->default(false); // Require UAS login
            $table->integer('min_advance_hours')->default(0); // Minimum hours in advance to book
            $table->integer('max_advance_days')->default(90); // Maximum days in advance to book
            $table->integer('cancellation_hours')->default(24); // Hours before for free cancellation

            // Staff assignment
            $table->boolean('require_staff')->default(false);
            $table->boolean('allow_staff_selection')->default(false); // Customer can choose staff

            // Recurring bookings
            $table->boolean('allow_recurring')->default(false);
            $table->json('recurring_options')->nullable(); // ['weekly', 'biweekly', 'monthly']

            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Booking Staff (people who can be assigned to bookings)
        Schema::connection('user_db')->create('booking_staff', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('uas_user_id')->nullable(); // Link to UAS user if applicable
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('avatar')->nullable();
            $table->text('bio')->nullable();
            $table->string('title')->nullable(); // Job title
            $table->string('color', 7)->default('#10B981'); // Calendar color
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Staff-Service pivot (which staff can provide which services)
        Schema::connection('user_db')->create('booking_staff_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('booking_staff')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('booking_services')->cascadeOnDelete();
            $table->unique(['staff_id', 'service_id']);
        });

        // Business Hours (default availability)
        Schema::connection('user_db')->create('booking_business_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->nullable()->constrained('booking_staff')->cascadeOnDelete();
            // null staff_id = business-wide hours
            $table->tinyInteger('day_of_week'); // 0=Sunday, 1=Monday, etc.
            $table->boolean('is_open')->default(true);
            $table->time('open_time')->nullable();
            $table->time('close_time')->nullable();
            $table->time('break_start')->nullable(); // Optional break period
            $table->time('break_end')->nullable();
            $table->timestamps();

            $table->unique(['staff_id', 'day_of_week']);
        });

        // Custom Availability (overrides for specific dates)
        Schema::connection('user_db')->create('booking_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->nullable()->constrained('booking_staff')->cascadeOnDelete();
            $table->date('date');
            $table->enum('type', ['available', 'unavailable'])->default('available');
            $table->time('start_time')->nullable(); // null = all day
            $table->time('end_time')->nullable();
            $table->string('reason')->nullable(); // e.g., "Holiday", "Training"
            $table->timestamps();

            $table->index(['staff_id', 'date']);
        });

        // Resources (for reservations - tables, rooms, equipment)
        Schema::connection('user_db')->create('booking_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->nullable()->constrained('booking_services')->cascadeOnDelete();
            $table->string('name'); // e.g., "Table 1", "Room A"
            $table->text('description')->nullable();
            $table->integer('capacity')->default(1);
            $table->json('attributes')->nullable(); // Custom attributes like location, amenities
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Bookings (actual appointments/reservations)
        Schema::connection('user_db')->create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_reference')->unique(); // e.g., "BK-ABC123"
            $table->foreignId('service_id')->constrained('booking_services')->cascadeOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('booking_staff')->nullOnDelete();
            $table->foreignId('resource_id')->nullable()->constrained('booking_resources')->nullOnDelete();

            // Customer info (either UAS user or guest)
            $table->unsignedBigInteger('uas_user_id')->nullable();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->text('customer_notes')->nullable(); // Special requests

            // Booking details
            $table->date('booking_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('party_size')->default(1);

            // Recurring
            $table->boolean('is_recurring')->default(false);
            $table->string('recurring_pattern')->nullable(); // weekly, biweekly, monthly
            $table->unsignedBigInteger('recurring_parent_id')->nullable(); // Links to parent booking
            $table->date('recurring_end_date')->nullable();

            // Status
            $table->enum('status', [
                'pending',      // Awaiting confirmation
                'confirmed',    // Confirmed by admin
                'cancelled',    // Cancelled by customer or admin
                'no_show',      // Customer didn't show up
                'completed'     // Successfully completed
            ])->default('pending');
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            // Payment
            $table->decimal('total_price', 10, 2)->default(0);
            $table->decimal('deposit_paid', 10, 2)->default(0);
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->enum('payment_status', [
                'not_required', // Free service
                'pending',      // Payment expected
                'deposit_paid', // Deposit received
                'paid',         // Fully paid
                'refunded',     // Refunded
                'partial_refund'
            ])->default('not_required');
            $table->string('payment_method')->nullable(); // stripe, paypal, cash, card_at_venue
            $table->string('payment_reference')->nullable(); // Transaction ID

            // Admin notes
            $table->text('admin_notes')->nullable();

            // Reminders
            $table->boolean('reminder_sent')->default(false);
            $table->timestamp('reminder_sent_at')->nullable();

            $table->timestamps();

            $table->index(['booking_date', 'status']);
            $table->index(['service_id', 'booking_date']);
            $table->index(['staff_id', 'booking_date']);
            $table->index(['customer_email']);
        });

        // Booking Settings
        Schema::connection('user_db')->create('booking_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Get the connection being used for this migration
        $connection = $this->getConnection() ?? config('database.default');

        // Insert default settings
        $defaultSettings = [
            ['key' => 'booking_type', 'value' => 'appointments'],
            ['key' => 'business_name', 'value' => 'My Business'],
            ['key' => 'business_email', 'value' => null],
            ['key' => 'business_phone', 'value' => null],
            ['key' => 'timezone', 'value' => 'Europe/London'],
            ['key' => 'date_format', 'value' => 'd/m/Y'],
            ['key' => 'time_format', 'value' => 'H:i'],
            ['key' => 'currency', 'value' => 'GBP'],
            ['key' => 'currency_symbol', 'value' => '£'],
            ['key' => 'slot_interval_minutes', 'value' => '15'],
            ['key' => 'min_advance_booking_hours', 'value' => '2'],
            ['key' => 'max_advance_booking_days', 'value' => '60'],
            ['key' => 'default_duration_minutes', 'value' => '60'],
            ['key' => 'default_capacity', 'value' => '1'],
            ['key' => 'allow_waitlist', 'value' => 'false'],
            ['key' => 'auto_confirm_bookings', 'value' => 'false'],
            ['key' => 'send_confirmation_email', 'value' => 'true'],
            ['key' => 'send_reminder_email', 'value' => 'true'],
            ['key' => 'reminder_hours_before', 'value' => '24'],
            ['key' => 'allow_cancellation', 'value' => 'true'],
            ['key' => 'allow_reschedule', 'value' => 'true'],
            ['key' => 'cancellation_hours', 'value' => '24'],
            ['key' => 'cancellation_policy', 'value' => 'Free cancellation up to 24 hours before your booking.'],
            ['key' => 'booking_terms', 'value' => null],
        ];

        foreach ($defaultSettings as $setting) {
            DB::connection($connection)->table('booking_settings')->insert([
                'key' => $setting['key'],
                'value' => $setting['value'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Insert default business hours (Mon-Fri 9am-5pm)
        for ($day = 1; $day <= 5; $day++) {
            DB::connection($connection)->table('booking_business_hours')->insert([
                'staff_id' => null,
                'day_of_week' => $day,
                'is_open' => true,
                'open_time' => '09:00:00',
                'close_time' => '17:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        // Weekends closed by default
        foreach ([0, 6] as $day) {
            DB::connection($connection)->table('booking_business_hours')->insert([
                'staff_id' => null,
                'day_of_week' => $day,
                'is_open' => false,
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
        Schema::connection('user_db')->dropIfExists('booking_settings');
        Schema::connection('user_db')->dropIfExists('bookings');
        Schema::connection('user_db')->dropIfExists('booking_resources');
        Schema::connection('user_db')->dropIfExists('booking_availability');
        Schema::connection('user_db')->dropIfExists('booking_business_hours');
        Schema::connection('user_db')->dropIfExists('booking_staff_services');
        Schema::connection('user_db')->dropIfExists('booking_staff');
        Schema::connection('user_db')->dropIfExists('booking_services');
        Schema::connection('user_db')->dropIfExists('booking_categories');
    }
};
