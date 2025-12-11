<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates all tables needed for the E-commerce feature.
     */
    public function up(): void
    {
        // E-commerce Categories (for organizing products)
        Schema::connection('user_db')->create('ecommerce_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('ecommerce_categories')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // E-commerce Products
        Schema::connection('user_db')->create('ecommerce_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained('ecommerce_categories')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->longText('long_description')->nullable();

            // Product type
            $table->enum('type', ['physical', 'digital'])->default('physical');

            // Images
            $table->string('featured_image')->nullable();
            $table->json('gallery_images')->nullable(); // Array of image URLs

            // SKU and variants
            $table->string('sku')->nullable()->index(); // Nullable if product has variants
            $table->boolean('has_variants')->default(false);

            // Pricing
            $table->decimal('price', 10, 2)->default(0); // Base price if no variants
            $table->decimal('compare_at_price', 10, 2)->nullable(); // Original price for discount display
            $table->decimal('cost_price', 10, 2)->nullable(); // Cost for profit tracking

            // Inventory
            $table->boolean('track_inventory')->default(true);
            $table->integer('stock_quantity')->default(0); // If no variants
            $table->integer('low_stock_threshold')->default(5);

            // Shipping
            $table->decimal('weight', 10, 2)->nullable();
            $table->string('weight_unit', 10)->default('kg'); // kg, lb, oz, g
            $table->json('dimensions')->nullable(); // {length, width, height}
            $table->boolean('requires_shipping')->default(true); // False for digital products

            // Display
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('order')->default(0);

            // SEO
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('meta_keywords')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['category_id', 'is_active']);
        });

        // Product Variants (sizes, colors, etc.)
        Schema::connection('user_db')->create('ecommerce_product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('ecommerce_products')->cascadeOnDelete();
            $table->string('name'); // e.g., "Small / Red"
            $table->string('sku')->unique();

            // Pricing
            $table->decimal('price', 10, 2);
            $table->decimal('compare_at_price', 10, 2)->nullable();
            $table->decimal('cost_price', 10, 2)->nullable();

            // Image override
            $table->string('image')->nullable();

            // Inventory
            $table->integer('stock_quantity')->default(0);

            // Shipping
            $table->decimal('weight', 10, 2)->nullable();
            $table->string('barcode')->nullable();

            // Variant options (up to 3 option types)
            $table->string('option1_name')->nullable(); // e.g., "Size"
            $table->string('option1_value')->nullable(); // e.g., "Small"
            $table->string('option2_name')->nullable(); // e.g., "Color"
            $table->string('option2_value')->nullable(); // e.g., "Red"
            $table->string('option3_name')->nullable();
            $table->string('option3_value')->nullable();

            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('product_id');
        });

        // Digital Files (for digital products)
        Schema::connection('user_db')->create('ecommerce_digital_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('ecommerce_products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('ecommerce_product_variants')->cascadeOnDelete();
            $table->string('name');
            $table->string('file_path');
            $table->bigInteger('file_size')->nullable(); // in bytes
            $table->integer('download_limit')->nullable(); // null = unlimited
            $table->timestamps();
        });

        // Customers
        Schema::connection('user_db')->create('ecommerce_customers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('uas_user_id')->nullable()->index(); // Link to UAS
            $table->string('email')->index();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone')->nullable();

            // Stats
            $table->integer('total_orders')->default(0);
            $table->decimal('total_spent', 10, 2)->default(0);

            $table->timestamps();
        });

        // Customer Addresses
        Schema::connection('user_db')->create('ecommerce_customer_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('ecommerce_customers')->cascadeOnDelete();
            $table->enum('type', ['billing', 'shipping']);
            $table->boolean('is_default')->default(false);

            $table->string('first_name');
            $table->string('last_name');
            $table->string('company')->nullable();
            $table->string('address_line1');
            $table->string('address_line2')->nullable();
            $table->string('city');
            $table->string('state')->nullable();
            $table->string('postal_code');
            $table->string('country', 2); // ISO 2-letter code
            $table->string('phone')->nullable();

            $table->timestamps();

            $table->index(['customer_id', 'is_default']);
        });

        // Orders
        Schema::connection('user_db')->create('ecommerce_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique(); // e.g., "ORD-123456"

            // Customer info
            $table->foreignId('customer_id')->nullable()->constrained('ecommerce_customers')->nullOnDelete();
            $table->unsignedBigInteger('uas_user_id')->nullable();
            $table->string('customer_email');
            $table->string('customer_first_name');
            $table->string('customer_last_name');

            // Addresses
            $table->foreignId('billing_address_id')->nullable()->constrained('ecommerce_customer_addresses')->nullOnDelete();
            $table->foreignId('shipping_address_id')->nullable()->constrained('ecommerce_customer_addresses')->nullOnDelete();

            // Status tracking
            $table->enum('status', ['pending', 'processing', 'completed', 'cancelled', 'refunded'])->default('pending');
            $table->enum('payment_status', ['pending', 'paid', 'partially_paid', 'refunded', 'failed'])->default('pending');
            $table->enum('fulfillment_status', ['unfulfilled', 'partially_fulfilled', 'fulfilled'])->nullable();

            // Pricing
            $table->decimal('subtotal', 10, 2);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('shipping_amount', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);

            // Currency
            $table->string('currency', 3)->default('USD');
            $table->string('currency_symbol', 10)->default('$');

            // Payment
            $table->string('payment_method')->nullable(); // stripe, paypal, manual
            $table->string('payment_reference')->nullable(); // Transaction ID

            // Notes
            $table->text('notes')->nullable(); // Customer notes
            $table->text('admin_notes')->nullable();

            // Metadata
            $table->string('ip_address', 45)->nullable();

            $table->timestamps();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            // Indexes
            $table->index('customer_id');
            $table->index('status');
            $table->index('created_at');
        });

        // Order Items
        Schema::connection('user_db')->create('ecommerce_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('ecommerce_orders')->cascadeOnDelete();

            // Product info (denormalized for historical accuracy)
            $table->foreignId('product_id')->nullable()->constrained('ecommerce_products')->nullOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('ecommerce_product_variants')->nullOnDelete();
            $table->string('product_name');
            $table->string('variant_name')->nullable();
            $table->string('sku')->nullable();

            // Pricing
            $table->integer('quantity');
            $table->decimal('price', 10, 2); // Unit price at time of purchase
            $table->decimal('total', 10, 2); // quantity * price

            // Digital product delivery
            $table->boolean('is_digital')->default(false);
            $table->text('download_link')->nullable();
            $table->integer('download_count')->default(0);
            $table->integer('download_limit')->nullable();

            $table->timestamps();

            $table->index('order_id');
        });

        // Shopping Carts
        Schema::connection('user_db')->create('ecommerce_carts', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->unique(); // For guest carts
            $table->unsignedBigInteger('uas_user_id')->nullable()->index(); // For logged-in users
            $table->string('customer_email')->nullable();
            $table->timestamp('expires_at')->nullable(); // Auto-cleanup old carts
            $table->timestamps();
        });

        // Cart Items
        Schema::connection('user_db')->create('ecommerce_cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained('ecommerce_carts')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('ecommerce_products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('ecommerce_product_variants')->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->timestamps();

            $table->index('cart_id');
        });

        // Settings (key-value storage)
        Schema::connection('user_db')->create('ecommerce_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        $defaultSettings = [
            // Store info
            ['key' => 'store_name', 'value' => 'My Store'],
            ['key' => 'store_email', 'value' => 'store@example.com'],
            ['key' => 'store_phone', 'value' => ''],

            // Currency
            ['key' => 'currency', 'value' => 'USD'],
            ['key' => 'currency_symbol', 'value' => '$'],
            ['key' => 'currency_position', 'value' => 'before'], // before or after

            // Units
            ['key' => 'weight_unit', 'value' => 'kg'], // kg, lb, oz, g

            // Tax
            ['key' => 'tax_enabled', 'value' => 'false'],
            ['key' => 'tax_rate', 'value' => '0'],
            ['key' => 'tax_included_in_price', 'value' => 'false'],

            // Shipping
            ['key' => 'shipping_enabled', 'value' => 'true'],
            ['key' => 'free_shipping_threshold', 'value' => '0'],

            // Checkout
            ['key' => 'checkout_mode', 'value' => 'guest_and_account'], // guest_and_account or account_only

            // Inventory
            ['key' => 'stock_management_enabled', 'value' => 'true'],
            ['key' => 'low_stock_notifications', 'value' => 'true'],

            // Orders
            ['key' => 'order_number_prefix', 'value' => 'ORD-'],
            ['key' => 'order_number_suffix', 'value' => ''],

            // Notifications
            ['key' => 'order_confirmation_email', 'value' => 'true'],
            ['key' => 'shipping_notification_email', 'value' => 'true'],

            // Payment - Stripe
            ['key' => 'payment_stripe_enabled', 'value' => 'false'],
            ['key' => 'payment_stripe_publishable_key', 'value' => ''],
            ['key' => 'payment_stripe_secret_key', 'value' => ''],
            ['key' => 'payment_stripe_test_mode', 'value' => 'true'],

            // Payment - PayPal
            ['key' => 'payment_paypal_enabled', 'value' => 'false'],
            ['key' => 'payment_paypal_client_id', 'value' => ''],
            ['key' => 'payment_paypal_secret', 'value' => ''],
            ['key' => 'payment_paypal_test_mode', 'value' => 'true'],

            // Legal
            ['key' => 'terms_and_conditions', 'value' => ''],
            ['key' => 'privacy_policy', 'value' => ''],
        ];

        foreach ($defaultSettings as $setting) {
            DB::connection('user_db')->table('ecommerce_settings')->insert(array_merge($setting, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('user_db')->dropIfExists('ecommerce_cart_items');
        Schema::connection('user_db')->dropIfExists('ecommerce_carts');
        Schema::connection('user_db')->dropIfExists('ecommerce_order_items');
        Schema::connection('user_db')->dropIfExists('ecommerce_orders');
        Schema::connection('user_db')->dropIfExists('ecommerce_customer_addresses');
        Schema::connection('user_db')->dropIfExists('ecommerce_customers');
        Schema::connection('user_db')->dropIfExists('ecommerce_digital_files');
        Schema::connection('user_db')->dropIfExists('ecommerce_product_variants');
        Schema::connection('user_db')->dropIfExists('ecommerce_products');
        Schema::connection('user_db')->dropIfExists('ecommerce_categories');
        Schema::connection('user_db')->dropIfExists('ecommerce_settings');
    }
};
