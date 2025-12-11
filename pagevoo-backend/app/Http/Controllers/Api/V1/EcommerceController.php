<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DatabaseInstance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class EcommerceController extends Controller
{
    // ==================== HELPERS ====================

    /**
     * Set up connection to user's database
     */
    private function connectToUserDatabase(string $type, int $referenceId): ?string
    {
        $instance = DatabaseInstance::where('type', $type)
            ->where('reference_id', $referenceId)
            ->where('status', 'active')
            ->first();

        if (!$instance) {
            return null;
        }

        // Configure dynamic database connection
        Config::set('database.connections.user_db', [
            'driver' => 'mysql',
            'host' => Config::get('database.connections.mysql.host'),
            'port' => Config::get('database.connections.mysql.port'),
            'database' => $instance->database_name,
            'username' => Config::get('database.connections.mysql.username'),
            'password' => Config::get('database.connections.mysql.password'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'strict' => true,
        ]);

        // Purge and reconnect
        DB::purge('user_db');
        DB::reconnect('user_db');

        return $instance->database_name;
    }

    /**
     * Check if e-commerce feature is installed (tables exist)
     */
    private function isEcommerceInstalled(): bool
    {
        try {
            $tableExists = DB::connection('user_db')
                ->select("SHOW TABLES LIKE 'ecommerce_products'");
            return !empty($tableExists);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Check if image gallery feature is installed (tables exist)
     */
    private function isImageGalleryInstalled(): bool
    {
        try {
            $tableExists = DB::connection('user_db')
                ->select("SHOW TABLES LIKE 'gallery_albums'");
            return !empty($tableExists);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get settings as array
     */
    private function getSettingsArray(int $referenceId): array
    {
        $settingsRows = DB::connection('user_db')
            ->table('ecommerce_settings')
            ->get();

        $settings = [];
        foreach ($settingsRows as $row) {
            $value = $row->value;
            // Try to decode JSON values
            $decoded = json_decode($value, true);
            $settings[$row->key] = $decoded !== null ? $decoded : $value;
        }

        // Defaults
        return array_merge([
            'store_name' => 'My Store',
            'store_email' => 'store@example.com',
            'store_phone' => '',
            'currency' => 'USD',
            'currency_symbol' => '$',
            'currency_position' => 'before',
            'weight_unit' => 'kg',
            'tax_enabled' => false,
            'tax_rate' => 0,
            'tax_included_in_price' => false,
            'shipping_enabled' => true,
            'free_shipping_threshold' => 0,
            'checkout_mode' => 'guest_and_account',
            'stock_management_enabled' => true,
            'low_stock_notifications' => true,
            'order_number_prefix' => 'ORD-',
            'order_number_suffix' => '',
            'order_confirmation_email' => true,
            'shipping_notification_email' => true,
            'payment_stripe_enabled' => false,
            'payment_stripe_test_mode' => true,
            'payment_paypal_enabled' => false,
            'payment_paypal_test_mode' => true,
        ], $settings);
    }

    // ==================== DASHBOARD & ANALYTICS ====================

    /**
     * Get dashboard stats
     */
    public function dashboard(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        // Check if e-commerce feature is installed
        if (!$this->isEcommerceInstalled()) {
            return response()->json(['success' => true, 'data' => [
                'total_products' => 0,
                'active_products' => 0,
                'total_orders' => 0,
                'pending_orders' => 0,
                'total_revenue' => 0,
                'low_stock_products' => 0,
            ]]);
        }

        try {
            $stats = [
                'total_products' => DB::connection('user_db')
                    ->table('ecommerce_products')
                    ->count(),
                'active_products' => DB::connection('user_db')
                    ->table('ecommerce_products')
                    ->where('is_active', true)
                    ->count(),
                'total_orders' => DB::connection('user_db')
                    ->table('ecommerce_orders')
                    ->count(),
                'pending_orders' => DB::connection('user_db')
                    ->table('ecommerce_orders')
                    ->where('status', 'pending')
                    ->count(),
                'total_revenue' => DB::connection('user_db')
                    ->table('ecommerce_orders')
                    ->where('payment_status', 'paid')
                    ->sum('total_amount'),
                'low_stock_products' => DB::connection('user_db')
                    ->table('ecommerce_products')
                    ->whereRaw('stock_quantity <= low_stock_threshold')
                    ->where('track_inventory', true)
                    ->count(),
            ];

            return response()->json(['success' => true, 'data' => $stats]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch dashboard stats: ' . $e->getMessage()], 500);
        }
    }

    // ==================== PRODUCTS CRUD ====================

    /**
     * Get all products
     */
    public function getProducts(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        // Check if e-commerce feature is installed
        if (!$this->isEcommerceInstalled()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        try {
            $query = DB::connection('user_db')
                ->table('ecommerce_products')
                ->leftJoin('ecommerce_marketplaces', 'ecommerce_products.marketplace_id', '=', 'ecommerce_marketplaces.id')
                ->select('ecommerce_products.*', 'ecommerce_marketplaces.name as marketplace_name');

            // Filter by marketplace
            if ($request->has('marketplace_id') && $request->marketplace_id) {
                $query->where('ecommerce_products.marketplace_id', $request->marketplace_id);
            }

            // Filter by status
            if ($request->has('is_active')) {
                $query->where('ecommerce_products.is_active', $request->is_active);
            }

            // Filter by product type (physical/digital) - use 'product_type' to avoid conflict with 'type' (database type)
            if ($request->has('product_type') && $request->product_type) {
                $query->where('ecommerce_products.type', $request->product_type);
            }

            // Search
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('ecommerce_products.name', 'like', "%{$search}%")
                        ->orWhere('ecommerce_products.sku', 'like', "%{$search}%")
                        ->orWhere('ecommerce_products.description', 'like', "%{$search}%");
                });
            }

            $products = $query->orderBy('ecommerce_products.order')->orderBy('ecommerce_products.created_at', 'desc')->get();

            // Attach variants count
            foreach ($products as $product) {
                $product->variants_count = DB::connection('user_db')
                    ->table('ecommerce_product_variants')
                    ->where('product_id', $product->id)
                    ->count();

                $product->marketplace = $product->marketplace_name ? (object) [
                    'id' => $product->marketplace_id,
                    'name' => $product->marketplace_name,
                ] : null;
            }

            return response()->json(['success' => true, 'data' => $products]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch products: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get single product
     */
    public function getProduct(Request $request, int $id): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        if (!$this->isEcommerceInstalled()) {
            return response()->json(['error' => 'E-commerce feature not installed'], 404);
        }

        try {
            $product = DB::connection('user_db')
                ->table('ecommerce_products')
                ->leftJoin('ecommerce_marketplaces', 'ecommerce_products.marketplace_id', '=', 'ecommerce_marketplaces.id')
                ->where('ecommerce_products.id', $id)
                ->select('ecommerce_products.*', 'ecommerce_marketplaces.name as marketplace_name')
                ->first();

            if (!$product) {
                return response()->json(['error' => 'Product not found'], 404);
            }

            // Get variants
            $product->variants = DB::connection('user_db')
                ->table('ecommerce_product_variants')
                ->where('product_id', $id)
                ->orderBy('order')
                ->get();

            $product->marketplace = $product->marketplace_name ? (object) [
                'id' => $product->marketplace_id,
                'name' => $product->marketplace_name,
            ] : null;

            return response()->json(['success' => true, 'data' => $product]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch product: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create product
     */
    public function storeProduct(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|integer',
            'description' => 'nullable|string',
            'product_type' => 'required|in:physical,digital',
            'price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        if (!$this->isEcommerceInstalled()) {
            return response()->json(['error' => 'E-commerce feature is not installed'], 400);
        }

        try {
            // Generate unique slug
            $slug = Str::slug($request->name);
            $baseSlug = $slug;
            $counter = 1;
            while (DB::connection('user_db')->table('ecommerce_products')->where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }

            // Get max order
            $maxOrder = DB::connection('user_db')
                ->table('ecommerce_products')
                ->max('order') ?? -1;

            $productId = DB::connection('user_db')
                ->table('ecommerce_products')
                ->insertGetId([
                    'name' => $request->name,
                    'slug' => $slug,
                    'marketplace_id' => $request->marketplace_id,
                    'description' => $request->description,
                    'long_description' => $request->long_description,
                    'type' => $request->product_type,
                    'featured_image' => $request->featured_image,
                    'gallery_images' => $request->gallery_images ? json_encode($request->gallery_images) : null,
                    'sku' => $request->sku,
                    'has_variants' => $request->has_variants ?? false,
                    'price' => $request->price,
                    'compare_at_price' => $request->compare_at_price,
                    'cost_price' => $request->cost_price,
                    'track_inventory' => $request->track_inventory ?? true,
                    'stock_quantity' => $request->stock_quantity ?? 0,
                    'low_stock_threshold' => $request->low_stock_threshold ?? 5,
                    'weight' => $request->weight,
                    'weight_unit' => $request->weight_unit ?? 'kg',
                    'dimensions' => $request->dimensions ? json_encode($request->dimensions) : null,
                    'requires_shipping' => $request->requires_shipping ?? ($request->product_type === 'physical'),
                    'is_featured' => $request->is_featured ?? false,
                    'is_active' => $request->is_active ?? true,
                    'order' => $maxOrder + 1,
                    'meta_title' => $request->meta_title,
                    'meta_description' => $request->meta_description,
                    'meta_keywords' => $request->meta_keywords,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            $product = DB::connection('user_db')
                ->table('ecommerce_products')
                ->where('id', $productId)
                ->first();

            return response()->json(['success' => true, 'data' => $product, 'message' => 'Product created successfully'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create product: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update product
     */
    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $product = DB::connection('user_db')
                ->table('ecommerce_products')
                ->where('id', $id)
                ->first();

            if (!$product) {
                return response()->json(['error' => 'Product not found'], 404);
            }

            $updateData = ['updated_at' => now()];

            // Update slug if name changed
            if ($request->has('name') && $request->name !== $product->name) {
                $slug = Str::slug($request->name);
                $baseSlug = $slug;
                $counter = 1;
                while (DB::connection('user_db')->table('ecommerce_products')->where('slug', $slug)->where('id', '!=', $id)->exists()) {
                    $slug = $baseSlug . '-' . $counter++;
                }
                $updateData['slug'] = $slug;
            }

            $fields = ['name', 'marketplace_id', 'description', 'long_description', 'featured_image',
                'gallery_images', 'sku', 'has_variants', 'price', 'compare_at_price', 'cost_price',
                'track_inventory', 'stock_quantity', 'low_stock_threshold', 'weight', 'weight_unit',
                'dimensions', 'requires_shipping', 'is_featured', 'is_active', 'order',
                'meta_title', 'meta_description', 'meta_keywords'];

            foreach ($fields as $field) {
                if ($request->has($field)) {
                    $value = $request->$field;
                    if (in_array($field, ['gallery_images', 'dimensions']) && is_array($value)) {
                        $value = json_encode($value);
                    }
                    $updateData[$field] = $value;
                }
            }

            // Handle product_type separately (maps to 'type' column)
            if ($request->has('product_type')) {
                $updateData['type'] = $request->product_type;
            }

            DB::connection('user_db')
                ->table('ecommerce_products')
                ->where('id', $id)
                ->update($updateData);

            $product = DB::connection('user_db')
                ->table('ecommerce_products')
                ->where('id', $id)
                ->first();

            return response()->json(['success' => true, 'data' => $product, 'message' => 'Product updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update product: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete product
     */
    public function destroyProduct(Request $request, int $id): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $deleted = DB::connection('user_db')
                ->table('ecommerce_products')
                ->where('id', $id)
                ->delete();

            if (!$deleted) {
                return response()->json(['error' => 'Product not found'], 404);
            }

            return response()->json(['success' => true, 'message' => 'Product deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete product: ' . $e->getMessage()], 500);
        }
    }

    // ==================== MARKETPLACES CRUD ====================

    /**
     * Get all marketplaces
     */
    public function getMarketplaces(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        // Check if e-commerce feature is installed
        if (!$this->isEcommerceInstalled()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        try {
            $marketplaces = DB::connection('user_db')
                ->table('ecommerce_marketplaces')
                ->orderBy('order')
                ->get();

            // Add products count and sub-market count
            foreach ($marketplaces as $marketplace) {
                $marketplace->products_count = DB::connection('user_db')
                    ->table('ecommerce_products')
                    ->where('marketplace_id', $marketplace->id)
                    ->count();
                $marketplace->submarkets_count = DB::connection('user_db')
                    ->table('ecommerce_marketplaces')
                    ->where('parent_id', $marketplace->id)
                    ->count();
            }

            return response()->json(['success' => true, 'data' => $marketplaces]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch marketplaces: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create marketplace
     */
    public function storeMarketplace(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        if (!$this->isEcommerceInstalled()) {
            return response()->json(['error' => 'E-commerce feature is not installed'], 400);
        }

        try {
            // Generate unique slug
            $slug = Str::slug($request->name);
            $baseSlug = $slug;
            $counter = 1;
            while (DB::connection('user_db')->table('ecommerce_marketplaces')->where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }

            // Get max order
            $maxOrder = DB::connection('user_db')
                ->table('ecommerce_marketplaces')
                ->max('order') ?? -1;

            // Auto-create a gallery album for this marketplace (if image_gallery is installed)
            $galleryAlbumId = null;
            if ($this->isImageGalleryInstalled()) {
                $galleryAlbumId = (string) Str::uuid();
                $albumOrder = DB::connection('user_db')
                    ->table('gallery_albums')
                    ->max('order') ?? -1;

                DB::connection('user_db')
                    ->table('gallery_albums')
                    ->insert([
                        'id' => $galleryAlbumId,
                        'website_id' => $request->reference_id,
                        'name' => 'Products: ' . $request->name,
                        'description' => 'Product images for marketplace: ' . $request->name,
                        'image_count' => 0,
                        'order' => $albumOrder + 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
            }

            $marketplaceId = DB::connection('user_db')
                ->table('ecommerce_marketplaces')
                ->insertGetId([
                    'parent_id' => $request->parent_id,
                    'gallery_album_id' => $galleryAlbumId,
                    'name' => $request->name,
                    'slug' => $slug,
                    'description' => $request->description,
                    'image' => $request->image,
                    'meta_title' => $request->meta_title,
                    'meta_description' => $request->meta_description,
                    'order' => $maxOrder + 1,
                    'is_active' => $request->is_active ?? true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            $marketplace = DB::connection('user_db')
                ->table('ecommerce_marketplaces')
                ->where('id', $marketplaceId)
                ->first();

            return response()->json(['success' => true, 'data' => $marketplace, 'message' => 'Marketplace created successfully'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create marketplace: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update marketplace
     */
    public function updateMarketplace(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $marketplace = DB::connection('user_db')
                ->table('ecommerce_marketplaces')
                ->where('id', $id)
                ->first();

            if (!$marketplace) {
                return response()->json(['error' => 'Marketplace not found'], 404);
            }

            $updateData = ['updated_at' => now()];

            // Update slug if name changed
            if ($request->has('name') && $request->name !== $marketplace->name) {
                $slug = Str::slug($request->name);
                $baseSlug = $slug;
                $counter = 1;
                while (DB::connection('user_db')->table('ecommerce_marketplaces')->where('slug', $slug)->where('id', '!=', $id)->exists()) {
                    $slug = $baseSlug . '-' . $counter++;
                }
                $updateData['slug'] = $slug;
            }

            $fields = ['parent_id', 'name', 'description', 'image', 'meta_title', 'meta_description', 'order', 'is_active'];

            foreach ($fields as $field) {
                if ($request->has($field)) {
                    $updateData[$field] = $request->$field;
                }
            }

            DB::connection('user_db')
                ->table('ecommerce_marketplaces')
                ->where('id', $id)
                ->update($updateData);

            $marketplace = DB::connection('user_db')
                ->table('ecommerce_marketplaces')
                ->where('id', $id)
                ->first();

            return response()->json(['success' => true, 'data' => $marketplace, 'message' => 'Marketplace updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update marketplace: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete marketplace
     */
    public function destroyMarketplace(Request $request, int $id): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            // Get marketplace first to retrieve gallery_album_id
            $marketplace = DB::connection('user_db')
                ->table('ecommerce_marketplaces')
                ->where('id', $id)
                ->first();

            if (!$marketplace) {
                return response()->json(['error' => 'Marketplace not found'], 404);
            }

            // Orphan products instead of deleting them
            DB::connection('user_db')
                ->table('ecommerce_products')
                ->where('marketplace_id', $id)
                ->update(['marketplace_id' => null, 'updated_at' => now()]);

            // Move sub-markets to parent or orphan them
            DB::connection('user_db')
                ->table('ecommerce_marketplaces')
                ->where('parent_id', $id)
                ->update(['parent_id' => $marketplace->parent_id, 'updated_at' => now()]);

            // Delete associated gallery album if it exists
            if ($marketplace->gallery_album_id && $this->isImageGalleryInstalled()) {
                // First delete all images in the album
                DB::connection('user_db')
                    ->table('gallery_images')
                    ->where('album_id', $marketplace->gallery_album_id)
                    ->delete();

                // Then delete the album
                DB::connection('user_db')
                    ->table('gallery_albums')
                    ->where('id', $marketplace->gallery_album_id)
                    ->delete();
            }

            DB::connection('user_db')
                ->table('ecommerce_marketplaces')
                ->where('id', $id)
                ->delete();

            return response()->json(['success' => true, 'message' => 'Marketplace deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete marketplace: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get gallery images for a marketplace
     */
    public function getMarketplaceGalleryImages(Request $request, int $marketplaceId): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        if (!$this->isImageGalleryInstalled()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        try {
            // Get marketplace to find the album_id
            $marketplace = DB::connection('user_db')
                ->table('ecommerce_marketplaces')
                ->where('id', $marketplaceId)
                ->first();

            if (!$marketplace || !$marketplace->gallery_album_id) {
                return response()->json(['success' => true, 'data' => []]);
            }

            // Get images from the album
            $images = DB::connection('user_db')
                ->table('gallery_images')
                ->where('album_id', $marketplace->gallery_album_id)
                ->orderBy('order')
                ->get();

            return response()->json(['success' => true, 'data' => $images]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to get gallery images: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get all gallery images (for product image picker)
     */
    public function getAllGalleryImages(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        if (!$this->isImageGalleryInstalled()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        try {
            // Get all images, grouped by album
            $images = DB::connection('user_db')
                ->table('gallery_images')
                ->leftJoin('gallery_albums', 'gallery_images.album_id', '=', 'gallery_albums.id')
                ->select('gallery_images.*', 'gallery_albums.name as album_name')
                ->orderBy('gallery_albums.name')
                ->orderBy('gallery_images.order')
                ->get();

            return response()->json(['success' => true, 'data' => $images]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to get gallery images: ' . $e->getMessage()], 500);
        }
    }

    // ==================== SETTINGS ====================

    /**
     * Get all settings
     */
    public function getSettings(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            // Check if ecommerce_settings table exists first
            $tableExists = DB::connection('user_db')
                ->select("SHOW TABLES LIKE 'ecommerce_settings'");

            if (empty($tableExists)) {
                \Log::info('E-commerce settings table does not exist for reference_id: ' . $referenceId);
                return response()->json(['success' => true, 'data' => $this->getSettingsArray($referenceId)]);
            }

            $settings = $this->getSettingsArray($referenceId);
            return response()->json(['success' => true, 'data' => $settings]);
        } catch (\Exception $e) {
            \Log::error('E-commerce settings error: ' . $e->getMessage(), [
                'reference_id' => $referenceId,
                'type' => $type,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to fetch settings: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $settingsToUpdate = $request->except(['type', 'reference_id']);

            foreach ($settingsToUpdate as $key => $value) {
                DB::connection('user_db')
                    ->table('ecommerce_settings')
                    ->updateOrInsert(
                        ['key' => $key],
                        [
                            'value' => is_array($value) ? json_encode($value) : $value,
                            'updated_at' => now(),
                        ]
                    );
            }

            $settings = $this->getSettingsArray($request->reference_id);
            return response()->json(['success' => true, 'data' => $settings, 'message' => 'Settings updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update settings: ' . $e->getMessage()], 500);
        }
    }

    // ==================== PRODUCT VARIANTS ====================

    /**
     * Get variants for a product
     */
    public function getVariants(Request $request, int $productId): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        if (!$this->isEcommerceInstalled()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        try {
            $variants = DB::connection('user_db')
                ->table('ecommerce_product_variants')
                ->where('product_id', $productId)
                ->orderBy('order')
                ->get();

            return response()->json(['success' => true, 'data' => $variants]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch variants: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create variant
     */
    public function storeVariant(Request $request, int $productId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:ecommerce_product_variants,sku',
            'price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $maxOrder = DB::connection('user_db')
                ->table('ecommerce_product_variants')
                ->where('product_id', $productId)
                ->max('order') ?? -1;

            $variantId = DB::connection('user_db')
                ->table('ecommerce_product_variants')
                ->insertGetId([
                    'product_id' => $productId,
                    'name' => $request->name,
                    'sku' => $request->sku,
                    'price' => $request->price,
                    'compare_at_price' => $request->compare_at_price,
                    'cost_price' => $request->cost_price,
                    'image' => $request->image,
                    'stock_quantity' => $request->stock_quantity ?? 0,
                    'weight' => $request->weight,
                    'barcode' => $request->barcode,
                    'option1_name' => $request->option1_name,
                    'option1_value' => $request->option1_value,
                    'option2_name' => $request->option2_name,
                    'option2_value' => $request->option2_value,
                    'option3_name' => $request->option3_name,
                    'option3_value' => $request->option3_value,
                    'order' => $maxOrder + 1,
                    'is_active' => $request->is_active ?? true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            $variant = DB::connection('user_db')
                ->table('ecommerce_product_variants')
                ->where('id', $variantId)
                ->first();

            return response()->json(['success' => true, 'data' => $variant, 'message' => 'Variant created successfully'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create variant: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete variant
     */
    public function destroyVariant(Request $request, int $productId, int $variantId): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $deleted = DB::connection('user_db')
                ->table('ecommerce_product_variants')
                ->where('id', $variantId)
                ->where('product_id', $productId)
                ->delete();

            if (!$deleted) {
                return response()->json(['error' => 'Variant not found'], 404);
            }

            return response()->json(['success' => true, 'message' => 'Variant deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete variant: ' . $e->getMessage()], 500);
        }
    }

    // ==================== ORDERS ====================

    /**
     * Get all orders
     */
    public function getOrders(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        if (!$this->isEcommerceInstalled()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        try {
            $query = DB::connection('user_db')
                ->table('ecommerce_orders');

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            // Filter by payment status
            if ($request->has('payment_status') && $request->payment_status) {
                $query->where('payment_status', $request->payment_status);
            }

            // Search
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('order_number', 'like', "%{$search}%")
                        ->orWhere('customer_email', 'like', "%{$search}%")
                        ->orWhere('customer_first_name', 'like', "%{$search}%")
                        ->orWhere('customer_last_name', 'like', "%{$search}%");
                });
            }

            $orders = $query->orderBy('created_at', 'desc')->get();

            // Attach items count
            foreach ($orders as $order) {
                $order->items_count = DB::connection('user_db')
                    ->table('ecommerce_order_items')
                    ->where('order_id', $order->id)
                    ->sum('quantity');
            }

            return response()->json(['success' => true, 'data' => $orders]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch orders: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get single order
     */
    public function getOrder(Request $request, int $id): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        if (!$this->isEcommerceInstalled()) {
            return response()->json(['error' => 'E-commerce feature not installed'], 404);
        }

        try {
            $order = DB::connection('user_db')
                ->table('ecommerce_orders')
                ->where('id', $id)
                ->first();

            if (!$order) {
                return response()->json(['error' => 'Order not found'], 404);
            }

            // Get order items
            $order->items = DB::connection('user_db')
                ->table('ecommerce_order_items')
                ->where('order_id', $id)
                ->get();

            return response()->json(['success' => true, 'data' => $order]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch order: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update order status
     */
    public function updateOrderStatus(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'status' => 'required|in:pending,processing,completed,cancelled,refunded',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $updateData = [
                'status' => $request->status,
                'updated_at' => now(),
            ];

            if ($request->status === 'completed') {
                $updateData['completed_at'] = now();
            }

            if ($request->status === 'cancelled') {
                $updateData['cancelled_at'] = now();
            }

            DB::connection('user_db')
                ->table('ecommerce_orders')
                ->where('id', $id)
                ->update($updateData);

            $order = DB::connection('user_db')
                ->table('ecommerce_orders')
                ->where('id', $id)
                ->first();

            return response()->json(['success' => true, 'data' => $order, 'message' => 'Order status updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update order status: ' . $e->getMessage()], 500);
        }
    }

    // ==================== CUSTOMERS ====================

    /**
     * Get all customers
     */
    public function getCustomers(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        if (!$this->isEcommerceInstalled()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        try {
            $customers = DB::connection('user_db')
                ->table('ecommerce_customers')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json(['success' => true, 'data' => $customers]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch customers: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get low stock products
     */
    public function getLowStockProducts(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        if (!$this->isEcommerceInstalled()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        try {
            $products = DB::connection('user_db')
                ->table('ecommerce_products')
                ->whereRaw('stock_quantity <= low_stock_threshold')
                ->where('track_inventory', true)
                ->where('is_active', true)
                ->get();

            return response()->json(['success' => true, 'data' => $products]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch low stock products: ' . $e->getMessage()], 500);
        }
    }
}
