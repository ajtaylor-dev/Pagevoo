<?php

namespace App\Services\VooPress;

use Illuminate\Support\Facades\File;

class ThemeService
{
    protected string $themesPath;

    public function __construct()
    {
        $this->themesPath = storage_path('voopress/themes');
    }

    /**
     * Get all available themes
     */
    public function getThemes(): array
    {
        $themes = [];
        $files = File::glob($this->themesPath . '/*.json');

        foreach ($files as $file) {
            $theme = json_decode(File::get($file), true);
            if ($theme) {
                $themes[] = [
                    'id' => $theme['id'],
                    'name' => $theme['name'],
                    'description' => $theme['description'],
                    'preview_image' => $theme['preview_image'] ?? null,
                    'tier_required' => $theme['tier_required'] ?? 'brochure',
                    'colors' => $theme['colors'] ?? [],
                    'layout' => $theme['layout'] ?? [],
                ];
            }
        }

        return $themes;
    }

    /**
     * Get a specific theme by ID
     */
    public function getTheme(string $themeId): ?array
    {
        $themePath = $this->themesPath . '/' . $themeId . '.json';

        if (!File::exists($themePath)) {
            return null;
        }

        return json_decode(File::get($themePath), true);
    }

    /**
     * Check if user tier can access theme
     */
    public function canAccessTheme(string $themeId, string $userTier): bool
    {
        $theme = $this->getTheme($themeId);
        if (!$theme) {
            return false;
        }

        $tierHierarchy = [
            'trial' => 0,
            'brochure' => 1,
            'niche' => 2,
            'pro' => 3,
        ];

        $requiredTier = $theme['tier_required'] ?? 'brochure';
        $userTierLevel = $tierHierarchy[$userTier] ?? 0;
        $requiredTierLevel = $tierHierarchy[$requiredTier] ?? 1;

        return $userTierLevel >= $requiredTierLevel;
    }

    /**
     * Get available themes for a user tier
     */
    public function getThemesForTier(string $userTier): array
    {
        $allThemes = $this->getThemes();

        return array_filter($allThemes, function ($theme) use ($userTier) {
            return $this->canAccessTheme($theme['id'], $userTier);
        });
    }

    /**
     * Get theme pages configuration
     */
    public function getThemePages(string $themeId): array
    {
        $theme = $this->getTheme($themeId);
        if (!$theme) {
            return [];
        }

        return $theme['pages'] ?? [];
    }

    /**
     * Get theme sidebar widgets
     */
    public function getThemeSidebarWidgets(string $themeId): array
    {
        $theme = $this->getTheme($themeId);
        if (!$theme) {
            return [];
        }

        return $theme['sidebar']['widgets'] ?? [];
    }

    /**
     * Get default VooPress config from theme
     */
    public function getDefaultConfig(string $themeId): array
    {
        $theme = $this->getTheme($themeId);
        if (!$theme) {
            return [];
        }

        return [
            'site_title' => '',
            'tagline' => '',
            'logo' => null,
            'favicon' => null,
            'colors' => $theme['colors'] ?? [],
            'typography' => $theme['typography'] ?? [],
            'homepage' => $theme['homepage'] ?? [],
            'sidebar' => $theme['sidebar'] ?? [],
            'header' => $theme['header'] ?? [],
            'footer' => $theme['footer'] ?? [],
            'blog_settings' => [
                'blog_name' => 'Blog',
                'posts_per_page' => $theme['homepage']['posts_per_page'] ?? 10,
                'show_excerpts' => true,
                'excerpt_length' => $theme['homepage']['excerpt_length'] ?? 200,
                'date_format' => 'F j, Y',
                'time_format' => 'g:i a',
            ],
            'features' => [
                'comments_enabled' => true,
                'multi_author' => false,
                'categories_enabled' => true,
                'tags_enabled' => true,
                'featured_images' => true,
                'social_sharing' => false,
            ],
            'sidebar_widgets' => $theme['sidebar']['widgets'] ?? [],
            'menus' => [
                'primary' => [],
                'footer' => [],
            ],
            'permalink_structure' => '/blog/{slug}',
        ];
    }
}
