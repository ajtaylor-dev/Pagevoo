<?php

namespace App\Services;

use App\Models\UserWebsite;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Website File Service
 *
 * Manages preview and published directories for user websites.
 */
class WebsiteFileService
{
    /**
     * Base path for all websites in storage.
     */
    protected string $basePath;

    public function __construct()
    {
        // Use storage/app/public/websites as base
        $this->basePath = storage_path('app/public/websites');
    }

    /**
     * Generate a unique preview hash for a website.
     *
     * @return string 32-character hash
     */
    public function generatePreviewHash(): string
    {
        do {
            $hash = Str::random(32);
            $path = $this->getPreviewPath($hash);
        } while (File::exists($path));

        return $hash;
    }

    /**
     * Get the full path for a preview directory.
     *
     * @param string $hash
     * @return string
     */
    public function getPreviewPath(string $hash): string
    {
        return $this->basePath . '/preview/' . $hash;
    }

    /**
     * Get the full path for a published directory.
     *
     * @param UserWebsite $website
     * @return string
     */
    public function getPublishedPath(UserWebsite $website): string
    {
        $identifier = $website->custom_domain ?? $website->subdomain;

        if (!$identifier) {
            throw new \Exception('Website has no subdomain or custom domain configured.');
        }

        return $this->basePath . '/published/' . $identifier;
    }

    /**
     * Get the public URL for preview directory.
     *
     * @param string $hash
     * @return string
     */
    public function getPreviewUrl(string $hash): string
    {
        return url('/storage/websites/preview/' . $hash . '/index.html');
    }

    /**
     * Get the public URL for published directory.
     *
     * @param UserWebsite $website
     * @return string
     */
    public function getPublishedUrl(UserWebsite $website): string
    {
        if ($website->custom_domain) {
            return 'https://' . $website->custom_domain;
        }

        if ($website->subdomain) {
            return 'https://' . $website->subdomain . '.pagevoo.com';
        }

        throw new \Exception('Website has no subdomain or custom domain configured.');
    }

    /**
     * Create or update preview directory with website files.
     *
     * @param UserWebsite $website
     * @param array $data Website data (pages, css, images, etc.)
     * @return void
     */
    public function generatePreviewFiles(UserWebsite $website, array $data): void
    {
        // Generate preview hash if not exists
        if (!$website->preview_hash) {
            $website->preview_hash = $this->generatePreviewHash();
            $website->save();
        }

        $previewPath = $this->getPreviewPath($website->preview_hash);

        // Create directory structure
        $this->createDirectoryStructure($previewPath);

        // Generate HTML files for each page
        $this->generateHtmlFiles($previewPath, $data);

        // Generate CSS files
        $this->generateCssFiles($previewPath, $data);

        // Copy images to preview directory
        $this->copyImages($previewPath, $data);

        // Generate JavaScript files if needed
        $this->generateJsFiles($previewPath, $data);
    }

    /**
     * Create or update published directory with website files.
     *
     * @param UserWebsite $website
     * @param array $data Website data
     * @return void
     */
    public function generatePublishedFiles(UserWebsite $website, array $data): void
    {
        $publishedPath = $this->getPublishedPath($website);

        // Create directory structure
        $this->createDirectoryStructure($publishedPath);

        // Generate HTML files for each page
        $this->generateHtmlFiles($publishedPath, $data);

        // Generate CSS files
        $this->generateCssFiles($publishedPath, $data);

        // Copy images to published directory
        $this->copyImages($publishedPath, $data);

        // Generate JavaScript files if needed
        $this->generateJsFiles($publishedPath, $data);

        // Update published timestamp
        $website->last_published_at = now();
        $website->is_published = true;
        $website->save();
    }

    /**
     * Create directory structure for a website.
     *
     * @param string $basePath
     * @return void
     */
    protected function createDirectoryStructure(string $basePath): void
    {
        $directories = [
            $basePath,
            $basePath . '/css',
            $basePath . '/js',
            $basePath . '/images',
            $basePath . '/assets',
        ];

        foreach ($directories as $dir) {
            if (!File::exists($dir)) {
                File::makeDirectory($dir, 0755, true);
            }
        }
    }

    /**
     * Generate HTML files for all pages.
     *
     * @param string $basePath
     * @param array $data
     * @return void
     */
    protected function generateHtmlFiles(string $basePath, array $data): void
    {
        $pages = $data['pages'] ?? [];

        foreach ($pages as $index => $page) {
            // First page is index.html, others use slug
            $filename = $index === 0 ? 'index.html' : ($page['slug'] ?? 'page-' . $index) . '.html';
            $filePath = $basePath . '/' . $filename;

            // Generate HTML content
            $html = $this->buildHtmlPage($page, $data);

            File::put($filePath, $html);
        }
    }

    /**
     * Build complete HTML for a single page.
     *
     * @param array $page
     * @param array $data
     * @return string
     */
    protected function buildHtmlPage(array $page, array $data): string
    {
        $siteCss = $data['site_css'] ?? '';
        $pageCss = $page['page_css'] ?? '';
        $sections = $page['sections'] ?? [];
        $pageTitle = $page['name'] ?? 'Page';

        $html = "<!DOCTYPE html>\n";
        $html .= "<html lang=\"en\">\n";
        $html .= "<head>\n";
        $html .= "    <meta charset=\"UTF-8\">\n";
        $html .= "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
        $html .= "    <title>{$pageTitle}</title>\n";
        $html .= "    <link rel=\"stylesheet\" href=\"/css/style.css\">\n";

        // Inline page-specific CSS
        if ($pageCss) {
            $html .= "    <style>\n{$pageCss}\n    </style>\n";
        }

        $html .= "</head>\n";
        $html .= "<body>\n";

        // Render sections
        foreach ($sections as $section) {
            $html .= $this->renderSection($section);
        }

        $html .= "    <script src=\"/js/script.js\"></script>\n";
        $html .= "</body>\n";
        $html .= "</html>";

        return $html;
    }

    /**
     * Render a single section to HTML.
     *
     * @param array $section
     * @return string
     */
    protected function renderSection(array $section): string
    {
        $type = $section['type'] ?? 'unknown';
        $content = $section['content'] ?? [];
        $sectionId = $section['section_id'] ?? '';
        $sectionCss = $section['section_css'] ?? '';

        $html = "    <section id=\"{$sectionId}\" class=\"section-{$type}\">\n";

        // Add inline section CSS if exists
        if ($sectionCss) {
            $html .= "        <style>\n#{$sectionId} {{$sectionCss}}\n        </style>\n";
        }

        // Render section content based on type
        $html .= $this->renderSectionContent($type, $content);

        $html .= "    </section>\n";

        return $html;
    }

    /**
     * Render section content based on type.
     *
     * @param string $type
     * @param array $content
     * @return string
     */
    protected function renderSectionContent(string $type, array $content): string
    {
        // For now, just output raw HTML from content
        // TODO: Implement proper rendering for each section type
        return $content['html'] ?? '';
    }

    /**
     * Generate CSS files.
     *
     * @param string $basePath
     * @param array $data
     * @return void
     */
    protected function generateCssFiles(string $basePath, array $data): void
    {
        $siteCss = $data['site_css'] ?? '';

        // Main stylesheet
        $cssPath = $basePath . '/css/style.css';
        File::put($cssPath, $siteCss);
    }

    /**
     * Copy images to website directory.
     *
     * @param string $basePath
     * @param array $data
     * @return void
     */
    protected function copyImages(string $basePath, array $data): void
    {
        $images = $data['images'] ?? [];
        $imagesPath = $basePath . '/images';

        foreach ($images as $image) {
            $sourcePath = $image['path'] ?? null;
            $filename = $image['filename'] ?? basename($sourcePath);

            if ($sourcePath && File::exists($sourcePath)) {
                $destinationPath = $imagesPath . '/' . $filename;
                File::copy($sourcePath, $destinationPath);
            }
        }
    }

    /**
     * Generate JavaScript files.
     *
     * @param string $basePath
     * @param array $data
     * @return void
     */
    protected function generateJsFiles(string $basePath, array $data): void
    {
        // Basic JavaScript for navigation dropdowns, mobile menu, etc.
        $js = "// Pagevoo Website JavaScript\n\n";
        $js .= "// Mobile menu toggle\n";
        $js .= "document.addEventListener('DOMContentLoaded', function() {\n";
        $js .= "    // Add any dynamic functionality here\n";
        $js .= "});\n";

        $jsPath = $basePath . '/js/script.js';
        File::put($jsPath, $js);
    }

    /**
     * Delete preview directory for a website.
     *
     * @param UserWebsite $website
     * @return void
     */
    public function deletePreviewDirectory(UserWebsite $website): void
    {
        if ($website->preview_hash) {
            $previewPath = $this->getPreviewPath($website->preview_hash);
            if (File::exists($previewPath)) {
                File::deleteDirectory($previewPath);
            }
        }
    }

    /**
     * Delete published directory for a website.
     *
     * @param UserWebsite $website
     * @return void
     */
    public function deletePublishedDirectory(UserWebsite $website): void
    {
        try {
            $publishedPath = $this->getPublishedPath($website);
            if (File::exists($publishedPath)) {
                File::deleteDirectory($publishedPath);
            }

            $website->is_published = false;
            $website->last_published_at = null;
            $website->save();
        } catch (\Exception $e) {
            // Website has no subdomain/domain configured, nothing to delete
        }
    }

    /**
     * Unpublish a website (delete published directory, keep preview).
     *
     * @param UserWebsite $website
     * @return void
     */
    public function unpublish(UserWebsite $website): void
    {
        $this->deletePublishedDirectory($website);
    }

    /**
     * Copy preview directory to published directory.
     *
     * @param UserWebsite $website
     * @return void
     */
    public function copyPreviewToPublished(UserWebsite $website): void
    {
        $previewPath = $this->getPreviewPath($website->preview_hash);
        $publishedPath = $this->getPublishedPath($website);

        // Delete existing published directory
        if (File::exists($publishedPath)) {
            File::deleteDirectory($publishedPath);
        }

        // Copy preview to published
        File::copyDirectory($previewPath, $publishedPath);

        // Update published status
        $website->is_published = true;
        $website->last_published_at = now();
        $website->save();
    }

    /**
     * Get directory size in MB.
     *
     * @param string $path
     * @return float
     */
    public function getDirectorySize(string $path): float
    {
        if (!File::exists($path)) {
            return 0;
        }

        $size = 0;
        $files = File::allFiles($path);

        foreach ($files as $file) {
            $size += $file->getSize();
        }

        // Convert bytes to MB
        return round($size / 1024 / 1024, 2);
    }

    /**
     * Get storage usage for a user's website.
     *
     * @param UserWebsite $website
     * @return array
     */
    public function getStorageUsage(UserWebsite $website): array
    {
        $previewSize = 0;
        $publishedSize = 0;

        if ($website->preview_hash) {
            $previewPath = $this->getPreviewPath($website->preview_hash);
            $previewSize = $this->getDirectorySize($previewPath);
        }

        if ($website->is_published) {
            try {
                $publishedPath = $this->getPublishedPath($website);
                $publishedSize = $this->getDirectorySize($publishedPath);
            } catch (\Exception $e) {
                // No published directory
            }
        }

        return [
            'preview_mb' => $previewSize,
            'published_mb' => $publishedSize,
            'total_mb' => $previewSize + $publishedSize,
        ];
    }
}
