<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\UserWebsite;
use App\Models\DatabaseInstance;
use App\Services\VooPress\ThemeService;
use App\Services\VooPress\VooPressSetupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class VooPressController extends Controller
{
    protected ThemeService $themeService;
    protected VooPressSetupService $setupService;

    public function __construct(ThemeService $themeService, VooPressSetupService $setupService)
    {
        $this->themeService = $themeService;
        $this->setupService = $setupService;
    }

    /**
     * Get all available themes
     */
    public function getThemes(Request $request): JsonResponse
    {
        $user = $request->user();
        $userTier = $user->account_tier ?? 'trial';

        $themes = $this->themeService->getThemes();

        // Mark which themes are accessible
        foreach ($themes as &$theme) {
            $theme['accessible'] = $this->themeService->canAccessTheme($theme['id'], $userTier);
        }

        return response()->json([
            'success' => true,
            'data' => $themes,
        ]);
    }

    /**
     * Get a specific theme
     */
    public function getTheme(Request $request, string $themeId): JsonResponse
    {
        $theme = $this->themeService->getTheme($themeId);

        if (!$theme) {
            return response()->json([
                'success' => false,
                'message' => 'Theme not found',
            ], 404);
        }

        $user = $request->user();
        $theme['accessible'] = $this->themeService->canAccessTheme($themeId, $user->account_tier ?? 'trial');

        return response()->json([
            'success' => true,
            'data' => $theme,
        ]);
    }

    /**
     * Create a new VooPress site or update existing
     */
    public function create(Request $request): JsonResponse
    {
        $request->validate([
            'theme' => 'required|string',
            'site_title' => 'required|string|max:255',
            'tagline' => 'nullable|string|max:500',
            'colors' => 'nullable|array',
            'blog_settings' => 'nullable|array',
            'features' => 'nullable|array',
        ]);

        try {
            $user = $request->user();

            // Check if user already has a VooPress site
            $existingWebsite = UserWebsite::where('user_id', $user->id)
                ->where('is_voopress', true)
                ->first();

            if ($existingWebsite) {
                // Update existing VooPress site instead of creating new
                $website = $this->setupService->updateConfig($existingWebsite, $request->all());

                return response()->json([
                    'success' => true,
                    'message' => 'VooPress site updated successfully',
                    'data' => $website->load('pages'),
                ]);
            }

            $website = $this->setupService->createVooPressSite($user, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'VooPress site created successfully',
                'data' => $website->load('pages'),
            ]);
        } catch (\Exception $e) {
            \Log::error('VooPress create error: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get VooPress site status
     */
    public function getStatus(Request $request): JsonResponse
    {
        $user = $request->user();

        $website = UserWebsite::where('user_id', $user->id)->first();

        if (!$website) {
            return response()->json([
                'success' => true,
                'data' => [
                    'has_website' => false,
                    'is_voopress' => false,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'has_website' => true,
                'is_voopress' => $website->is_voopress,
                'voopress_theme' => $website->voopress_theme,
                'voopress_config' => $website->voopress_config,
                'website_id' => $website->id,
                'website_name' => $website->name,
            ],
        ]);
    }

    /**
     * Update VooPress configuration
     */
    public function updateConfig(Request $request): JsonResponse
    {
        $request->validate([
            'site_title' => 'nullable|string|max:255',
            'tagline' => 'nullable|string|max:500',
            'colors' => 'nullable|array',
            'typography' => 'nullable|array',
            'homepage' => 'nullable|array',
            'sidebar' => 'nullable|array',
            'header' => 'nullable|array',
            'footer' => 'nullable|array',
            'blog_settings' => 'nullable|array',
            'features' => 'nullable|array',
            'sidebar_widgets' => 'nullable|array',
            'menus' => 'nullable|array',
            'permalink_structure' => 'nullable|string',
        ]);

        try {
            $user = $request->user();
            $website = UserWebsite::where('user_id', $user->id)
                ->where('is_voopress', true)
                ->firstOrFail();

            $website = $this->setupService->updateConfig($website, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Configuration updated successfully',
                'data' => $website,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Change VooPress theme
     */
    public function changeTheme(Request $request): JsonResponse
    {
        $request->validate([
            'theme' => 'required|string',
        ]);

        try {
            $user = $request->user();
            $website = UserWebsite::where('user_id', $user->id)
                ->where('is_voopress', true)
                ->firstOrFail();

            $website = $this->setupService->changeTheme($website, $request->theme);

            return response()->json([
                'success' => true,
                'message' => 'Theme changed successfully',
                'data' => $website->load('pages'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get VooPress dashboard stats
     */
    public function getDashboardStats(Request $request): JsonResponse
    {
        $user = $request->user();

        $stats = $this->setupService->getDashboardStats($user);

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Convert existing website to VooPress
     */
    public function convertToVooPress(Request $request): JsonResponse
    {
        $request->validate([
            'theme' => 'required|string',
            'site_title' => 'nullable|string|max:255',
            'tagline' => 'nullable|string|max:500',
        ]);

        try {
            $user = $request->user();
            $website = UserWebsite::where('user_id', $user->id)->first();

            if (!$website) {
                // Create new VooPress site
                $website = $this->setupService->createVooPressSite($user, $request->all());
            } else {
                // Convert existing to VooPress
                $theme = $this->themeService->getTheme($request->theme);
                if (!$theme) {
                    throw new \Exception('Invalid theme selected');
                }

                $defaultConfig = $this->themeService->getDefaultConfig($request->theme);
                $voopressConfig = array_merge($defaultConfig, [
                    'site_title' => $request->site_title ?? $website->name ?? 'My Blog',
                    'tagline' => $request->tagline ?? '',
                ]);

                $website->update([
                    'is_voopress' => true,
                    'voopress_theme' => $request->theme,
                    'voopress_config' => $voopressConfig,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Website converted to VooPress successfully',
                'data' => $website->fresh()->load('pages'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Update sidebar widgets
     */
    public function updateWidgets(Request $request): JsonResponse
    {
        $request->validate([
            'widgets' => 'required|array',
        ]);

        try {
            $user = $request->user();
            $website = UserWebsite::where('user_id', $user->id)
                ->where('is_voopress', true)
                ->firstOrFail();

            $config = $website->voopress_config ?? [];
            $config['sidebar_widgets'] = $request->widgets;

            $website->update(['voopress_config' => $config]);

            return response()->json([
                'success' => true,
                'message' => 'Widgets updated successfully',
                'data' => $website->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Update menus
     */
    public function updateMenus(Request $request): JsonResponse
    {
        $request->validate([
            'menus' => 'required|array',
        ]);

        try {
            $user = $request->user();
            $website = UserWebsite::where('user_id', $user->id)
                ->where('is_voopress', true)
                ->firstOrFail();

            $config = $website->voopress_config ?? [];
            $config['menus'] = $request->menus;

            $website->update(['voopress_config' => $config]);

            return response()->json([
                'success' => true,
                'message' => 'Menus updated successfully',
                'data' => $website->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Connect to user's database and return connection name
     */
    protected function connectToUserDatabase(DatabaseInstance $instance): string
    {
        $connectionName = "voopress_db_{$instance->id}";

        Config::set("database.connections.{$connectionName}", [
            'driver' => 'mysql',
            'host' => config('database.connections.mysql.host'),
            'port' => config('database.connections.mysql.port'),
            'database' => $instance->database_name,
            'username' => config('database.connections.mysql.username'),
            'password' => config('database.connections.mysql.password'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        DB::purge($connectionName);

        return $connectionName;
    }

    /**
     * Get blog posts for VooPress site
     */
    public function getBlogPosts(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $website = UserWebsite::where('user_id', $user->id)->first();

            if (!$website) {
                return response()->json([
                    'success' => true,
                    'data' => ['posts' => []],
                ]);
            }

            // Get database instance - use user_id as reference_id (matches DatabaseManager convention)
            $databaseInstance = DatabaseInstance::where('type', 'website')
                ->where('reference_id', $user->id)
                ->where('status', 'active')
                ->first();

            if (!$databaseInstance) {
                return response()->json([
                    'success' => true,
                    'data' => ['posts' => []],
                ]);
            }

            $connectionName = $this->connectToUserDatabase($databaseInstance);

            // Check if blog_posts table exists
            if (!DB::connection($connectionName)->getSchemaBuilder()->hasTable('blog_posts')) {
                return response()->json([
                    'success' => true,
                    'data' => ['posts' => []],
                ]);
            }

            // Get query params
            $status = $request->query('status', 'published');
            $limit = min($request->query('limit', 10), 100);

            // Build query - filter by website_id (user_id) to match BlogController
            $query = DB::connection($connectionName)->table('blog_posts')
                ->where('website_id', $user->id);

            if ($status !== 'all') {
                $query->where('status', $status);
            }

            $posts = $query->orderBy('published_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();

            // Get categories for each post
            foreach ($posts as $post) {
                if ($post->category_id) {
                    $post->category = DB::connection($connectionName)
                        ->table('blog_categories')
                        ->where('id', $post->category_id)
                        ->first();
                }
            }

            return response()->json([
                'success' => true,
                'data' => ['posts' => $posts],
            ]);
        } catch (\Exception $e) {
            \Log::error('VooPress getBlogPosts error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch blog posts',
            ], 500);
        }
    }

    /**
     * Get blog categories for VooPress site
     */
    public function getBlogCategories(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $website = UserWebsite::where('user_id', $user->id)->first();

            if (!$website) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }

            // Get database instance - use user_id as reference_id (matches DatabaseManager convention)
            $databaseInstance = DatabaseInstance::where('type', 'website')
                ->where('reference_id', $user->id)
                ->where('status', 'active')
                ->first();

            if (!$databaseInstance) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }

            $connectionName = $this->connectToUserDatabase($databaseInstance);

            // Check if blog_categories table exists
            if (!DB::connection($connectionName)->getSchemaBuilder()->hasTable('blog_categories')) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }

            $categories = DB::connection($connectionName)->table('blog_categories')
                ->orderBy('name')
                ->get();

            // Get post count for each category
            foreach ($categories as $category) {
                $category->posts_count = DB::connection($connectionName)
                    ->table('blog_posts')
                    ->where('category_id', $category->id)
                    ->where('status', 'published')
                    ->count();
            }

            return response()->json([
                'success' => true,
                'data' => $categories,
            ]);
        } catch (\Exception $e) {
            \Log::error('VooPress getBlogCategories error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch categories',
            ], 500);
        }
    }
}
