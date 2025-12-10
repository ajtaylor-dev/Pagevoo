<?php

namespace App\Services\VooPress;

use App\Models\User;
use App\Models\UserWebsite;
use App\Models\UserPage;
use App\Models\DatabaseInstance;
use App\Services\DatabaseManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;

class VooPressSetupService
{
    protected ThemeService $themeService;
    protected DatabaseManager $databaseManager;

    public function __construct(ThemeService $themeService, DatabaseManager $databaseManager)
    {
        $this->themeService = $themeService;
        $this->databaseManager = $databaseManager;
    }

    /**
     * Create a new VooPress site
     */
    public function createVooPressSite(User $user, array $config): UserWebsite
    {
        $themeId = $config['theme'] ?? 'classic';
        $theme = $this->themeService->getTheme($themeId);

        if (!$theme) {
            throw new \Exception('Invalid theme selected');
        }

        // Check tier access
        $userTier = $user->account_tier ?? 'trial';
        if (!$this->themeService->canAccessTheme($themeId, $userTier)) {
            throw new \Exception('Your subscription tier does not have access to this theme');
        }

        // Merge user config with theme defaults
        $defaultConfig = $this->themeService->getDefaultConfig($themeId);
        $voopressConfig = array_merge($defaultConfig, [
            'site_title' => $config['site_title'] ?? 'My Blog',
            'tagline' => $config['tagline'] ?? 'Just another VooPress site',
            'colors' => array_merge($defaultConfig['colors'], $config['colors'] ?? []),
            'blog_settings' => array_merge($defaultConfig['blog_settings'], $config['blog_settings'] ?? []),
            'features' => array_merge($defaultConfig['features'], $config['features'] ?? []),
        ]);

        DB::beginTransaction();
        try {
            // Create or update website
            $website = UserWebsite::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => $config['site_title'] ?? 'My VooPress Site',
                    'is_voopress' => true,
                    'voopress_theme' => $themeId,
                    'voopress_config' => $voopressConfig,
                    'default_title' => $config['site_title'] ?? 'My Blog',
                    'default_description' => $config['tagline'] ?? '',
                ]
            );

            // Create pages from theme
            $this->createThemePages($website, $theme, $user);

            // Install required features
            $this->installRequiredFeatures($user, $voopressConfig);

            // Create sample blog post
            $this->createSampleContent($user, $voopressConfig);

            DB::commit();

            return $website->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Create pages from theme configuration
     */
    protected function createThemePages(UserWebsite $website, array $theme, User $user): void
    {
        // Delete existing VooPress pages (keep other system pages like UAS pages)
        // Delete both from website and user-level
        UserPage::where('user_id', $user->id)
            ->where('feature_type', 'voopress')
            ->delete();

        $pages = $theme['pages'] ?? [];

        // Get max order from existing pages to append VooPress pages after them
        $maxOrder = UserPage::where('user_id', $user->id)->max('order') ?? -1;
        $order = $maxOrder + 1;

        foreach ($pages as $pageKey => $pageConfig) {
            // Create the page - use empty string for homepage, regular slug for others
            $slug = $pageConfig['slug'];
            $isHomepage = $slug === '';

            // Determine system_type based on page key/slug
            $systemType = 'voopress_' . ($pageKey ?: 'home');

            $page = UserPage::create([
                'user_id' => $user->id,
                'user_website_id' => $website->id,
                'name' => $pageConfig['title'],
                'slug' => $isHomepage ? '' : $slug,
                'page_id' => 'page_' . Str::random(8),
                'is_homepage' => $isHomepage,
                'order' => $order++,
                'is_system' => true,
                'system_type' => $systemType,
                'feature_type' => 'voopress',
            ]);

            // Create sections for this page
            $sectionOrder = 0;
            foreach ($pageConfig['sections'] ?? [] as $sectionConfig) {
                $sectionData = $this->buildSection($sectionConfig, $theme);

                // Generate a readable section name
                $sectionName = ucwords(str_replace(['voopress-', '-'], ['', ' '], $sectionData['type']));

                \App\Models\UserSection::create([
                    'user_page_id' => $page->id,
                    'section_id' => $sectionData['id'],
                    'section_name' => $sectionName,
                    'type' => $sectionData['type'],
                    'content' => $sectionData['config'],
                    'order' => $sectionOrder++,
                    'is_locked' => false,  // VooPress sections are editable on canvas
                    'lock_type' => null,
                ]);
            }
        }
    }

    /**
     * Build a section from theme config
     */
    protected function buildSection(array $sectionConfig, array $theme): array
    {
        $sectionType = $sectionConfig['type'];
        $config = $sectionConfig['config'] ?? [];

        // Map VooPress section types to actual section data
        return [
            'id' => Str::uuid()->toString(),
            'type' => $sectionType,
            'config' => array_merge($config, [
                'theme_colors' => $theme['colors'] ?? [],
                'theme_typography' => $theme['typography'] ?? [],
            ]),
        ];
    }

    /**
     * Install required features for VooPress
     */
    protected function installRequiredFeatures(User $user, array $config): void
    {
        // Get database instance for user's website
        $databaseInstance = $this->databaseManager->getWebsiteDatabaseInstance($user->id);

        if (!$databaseInstance) {
            // No database exists yet - features can't be installed without one
            \Log::info("No database instance for user {$user->id}, skipping feature installation");
            return;
        }

        // Features to install (VooPress requires Blog)
        $installedFeatures = $databaseInstance->getInstalledFeatures();
        $installedTypes = array_column($installedFeatures, 'type');

        // Blog is required for VooPress - install it if not already installed
        if (!in_array('blog', $installedTypes)) {
            \Log::info("Installing Blog feature for VooPress user {$user->id}");
            try {
                $this->databaseManager->installFeature($databaseInstance, 'blog');
            } catch (\Exception $e) {
                \Log::error("Failed to install blog feature for user {$user->id}: " . $e->getMessage());
                throw new \Exception("VooPress requires the Blog feature to be installed. Error: " . $e->getMessage());
            }
        }

        // Events feature for VooPress calendar functionality
        if (!in_array('events', $installedTypes)) {
            try {
                $this->databaseManager->installFeature($databaseInstance, 'events');
            } catch (\Exception $e) {
                \Log::warning("Could not install events feature: " . $e->getMessage());
            }
        }

        // Add contact form if not installed
        if (!in_array('contact_form', $installedTypes)) {
            try {
                $this->databaseManager->installFeature($databaseInstance, 'contact_form');
            } catch (\Exception $e) {
                \Log::warning("Could not install contact_form feature: " . $e->getMessage());
            }
        }

        // Add UAS if multi-author enabled and not installed
        if (($config['features']['multi_author'] ?? false) && !in_array('user_access_system', $installedTypes)) {
            try {
                $this->databaseManager->installFeature($databaseInstance, 'user_access_system');
            } catch (\Exception $e) {
                \Log::warning("Could not install user_access_system feature: " . $e->getMessage());
            }
        }
    }

    /**
     * Create sample blog post and categories
     */
    protected function createSampleContent(User $user, array $config): void
    {
        try {
            $databaseInstance = $this->databaseManager->getWebsiteDatabaseInstance($user->id);

            if (!$databaseInstance) {
                \Log::info("No database instance for user {$user->id}, skipping sample content creation");
                return;
            }

            $connectionName = $this->connectToUserDatabase($databaseInstance);

            // Check if blog_posts table exists
            if (!DB::connection($connectionName)->getSchemaBuilder()->hasTable('blog_posts')) {
                return;
            }

            // Check if sample post already exists
            $existingPost = DB::connection($connectionName)->table('blog_posts')
                ->where('slug', 'welcome-to-voopress')
                ->first();

            if ($existingPost) {
                return;
            }

            // Create default category
            $categoryId = null;
            if (DB::connection($connectionName)->getSchemaBuilder()->hasTable('blog_categories')) {
                $existingCategory = DB::connection($connectionName)->table('blog_categories')
                    ->where('slug', 'uncategorized')
                    ->first();

                if (!$existingCategory) {
                    $categoryId = DB::connection($connectionName)->table('blog_categories')->insertGetId([
                        'name' => 'Uncategorized',
                        'slug' => 'uncategorized',
                        'description' => 'Default category for posts',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $categoryId = $existingCategory->id;
                }
            }

            // Create sample post with Lorem Ipsum content
            // website_id is set to user_id to match BlogController convention
            DB::connection($connectionName)->table('blog_posts')->insert([
                'website_id' => $user->id,
                'title' => 'The Art of Modern Web Design: A Journey Through Digital Aesthetics',
                'slug' => 'art-of-modern-web-design',
                'content' => $this->getSamplePostContent(),
                'excerpt' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Discover how modern design principles shape the digital landscape.',
                'category_id' => $categoryId,
                'status' => 'published',
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

        } catch (\Exception $e) {
            \Log::warning("Could not create sample content: " . $e->getMessage());
        }
    }

    /**
     * Connect to user's database and return connection name
     */
    protected function connectToUserDatabase(DatabaseInstance $instance): string
    {
        $connectionName = "voopress_user_db_{$instance->id}";

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
     * Get sample post content with Lorem Ipsum style
     */
    protected function getSamplePostContent(): string
    {
        return <<<HTML
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>

<h2>The Foundation of Good Design</h2>

<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

<blockquote>
<p>"Design is not just what it looks like and feels like. Design is how it works." - Steve Jobs</p>
</blockquote>

<p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

<h2>Key Principles to Consider</h2>

<p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt:</p>

<ul>
    <li><strong>Simplicity</strong> - Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet</li>
    <li><strong>Consistency</strong> - Consectetur, adipisci velit, sed quia non numquam eius modi</li>
    <li><strong>User Focus</strong> - Tempora incidunt ut labore et dolore magnam aliquam quaerat</li>
    <li><strong>Accessibility</strong> - Ut enim ad minima veniam, quis nostrum exercitationem</li>
</ul>

<h2>Moving Forward</h2>

<p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.</p>

<p>Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.</p>
HTML;
    }

    /**
     * Update VooPress configuration
     */
    public function updateConfig(UserWebsite $website, array $config): UserWebsite
    {
        $currentConfig = $website->voopress_config ?? [];
        $newConfig = array_merge($currentConfig, $config);

        $website->update([
            'voopress_config' => $newConfig,
            'name' => $config['site_title'] ?? $website->name,
            'default_title' => $config['site_title'] ?? $website->default_title,
            'default_description' => $config['tagline'] ?? $website->default_description,
        ]);

        return $website->fresh();
    }

    /**
     * Change VooPress theme
     */
    public function changeTheme(UserWebsite $website, string $themeId): UserWebsite
    {
        $theme = $this->themeService->getTheme($themeId);
        if (!$theme) {
            throw new \Exception('Invalid theme selected');
        }

        // Check tier access
        $userTier = $website->user->account_tier ?? 'trial';
        if (!$this->themeService->canAccessTheme($themeId, $userTier)) {
            throw new \Exception('Your subscription tier does not have access to this theme');
        }

        // Get current config and merge with new theme defaults
        $currentConfig = $website->voopress_config ?? [];
        $themeDefaults = $this->themeService->getDefaultConfig($themeId);

        // Preserve user customizations but apply theme layout/structure
        $newConfig = array_merge($themeDefaults, [
            'site_title' => $currentConfig['site_title'] ?? $themeDefaults['site_title'],
            'tagline' => $currentConfig['tagline'] ?? $themeDefaults['tagline'],
            'logo' => $currentConfig['logo'] ?? null,
            'favicon' => $currentConfig['favicon'] ?? null,
            'blog_settings' => $currentConfig['blog_settings'] ?? $themeDefaults['blog_settings'],
            'features' => $currentConfig['features'] ?? $themeDefaults['features'],
            'menus' => $currentConfig['menus'] ?? $themeDefaults['menus'],
        ]);

        DB::beginTransaction();
        try {
            $website->update([
                'voopress_theme' => $themeId,
                'voopress_config' => $newConfig,
            ]);

            // Recreate pages with new theme
            $this->createThemePages($website, $theme, $website->user);

            DB::commit();
            return $website->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get VooPress dashboard stats
     */
    public function getDashboardStats(User $user): array
    {
        $stats = [
            'posts_count' => 0,
            'pages_count' => 0,
            'comments_count' => 0,
            'users_count' => 1,
        ];

        try {
            $databaseInstance = $this->databaseManager->getWebsiteDatabaseInstance($user->id);

            if (!$databaseInstance) {
                return $stats;
            }

            $connectionName = $this->connectToUserDatabase($databaseInstance);

            // Get posts count - filter by website_id (user_id) to match BlogController convention
            if (DB::connection($connectionName)->getSchemaBuilder()->hasTable('blog_posts')) {
                $stats['posts_count'] = DB::connection($connectionName)->table('blog_posts')
                    ->where('website_id', $user->id)
                    ->count();
            }

            // Get VooPress pages count (only pages with feature_type='voopress')
            $stats['pages_count'] = UserPage::where('user_id', $user->id)
                ->where('feature_type', 'voopress')
                ->count();

            // Get comments count if table exists
            if (DB::connection($connectionName)->getSchemaBuilder()->hasTable('blog_comments')) {
                $stats['comments_count'] = DB::connection($connectionName)->table('blog_comments')->count();
            }

            // Get users count if UAS is enabled
            if (DB::connection($connectionName)->getSchemaBuilder()->hasTable('uas_users')) {
                $stats['users_count'] = DB::connection($connectionName)->table('uas_users')->count();
            }

            return $stats;
        } catch (\Exception $e) {
            return [
                'posts_count' => 0,
                'pages_count' => 0,
                'comments_count' => 0,
                'users_count' => 1,
            ];
        }
    }
}
