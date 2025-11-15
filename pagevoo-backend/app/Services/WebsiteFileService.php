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
    use SectionRendererTrait;
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
        return url('/storage/websites/preview/' . $hash . '/index.php');
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
     * Generate PHP files for all pages.
     *
     * @param string $basePath
     * @param array $data
     * @return void
     */
    protected function generateHtmlFiles(string $basePath, array $data): void
    {
        $pages = $data['pages'] ?? [];

        foreach ($pages as $index => $page) {
            // First page is index.php, others use slug
            $filename = $index === 0 ? 'index.php' : ($page['slug'] ?? 'page-' . $index) . '.php';
            $filePath = $basePath . '/' . $filename;

            // Generate PHP content
            $phpContent = $this->buildPhpPage($page, $data);

            File::put($filePath, $phpContent);
        }
    }

    /**
     * Build complete PHP page with dynamic capabilities.
     *
     * @param array $page
     * @param array $data
     * @return string
     */
    protected function buildPhpPage(array $page, array $data): string
    {
        $siteCss = $data['site_css'] ?? '';
        $pageCss = $page['page_css'] ?? '';
        $sections = $page['sections'] ?? [];
        $pageTitle = $page['name'] ?? 'Page';
        $pageSlug = $page['slug'] ?? 'page';
        $metaDescription = $page['meta_description'] ?? '';

        $php = "<?php\n";
        $php .= "/**\n";
        $php .= " * Page: {$pageTitle}\n";
        $php .= " * Generated by Pagevoo\n";
        $php .= " * @package Pagevoo\n";
        $php .= " */\n\n";

        $php .= "// Page configuration\n";
        $php .= "\$pageTitle = " . var_export($pageTitle, true) . ";\n";
        $php .= "\$pageSlug = " . var_export($pageSlug, true) . ";\n";
        $php .= "\$metaDescription = " . var_export($metaDescription, true) . ";\n\n";

        $php .= "// Include header scripts (placeholder for future functionality)\n";
        $php .= "// include_once(__DIR__ . '/includes/header-scripts.php');\n\n";

        $php .= "// Custom page scripts (placeholder for future functionality)\n";
        $php .= "// \$customScripts = [];\n";
        $php .= "// include_once(__DIR__ . '/includes/custom-scripts.php');\n";
        $php .= "?>\n";

        $php .= "<!DOCTYPE html>\n";
        $php .= "<html lang=\"en\">\n";
        $php .= "<head>\n";
        $php .= "    <meta charset=\"UTF-8\">\n";
        $php .= "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
        $php .= "    <title><?php echo htmlspecialchars(\$pageTitle); ?></title>\n";

        if ($metaDescription) {
            $php .= "    <meta name=\"description\" content=\"<?php echo htmlspecialchars(\$metaDescription); ?>\">\n";
        }

        $php .= "    <link rel=\"stylesheet\" href=\"css/style.css\">\n";

        // Inline page-specific CSS
        if ($pageCss) {
            $php .= "    <style>\n" . $this->escapeCss($pageCss) . "\n    </style>\n";
        }

        $php .= "\n    <?php\n";
        $php .= "    // Include additional head scripts (placeholder)\n";
        $php .= "    // include_once(__DIR__ . '/includes/head-scripts.php');\n";
        $php .= "    ?>\n";
        $php .= "</head>\n";
        $php .= "<body data-page=\"<?php echo htmlspecialchars(\$pageSlug); ?>\">\n";

        $php .= "    <?php\n";
        $php .= "    // Include header (placeholder for future header component)\n";
        $php .= "    // include_once(__DIR__ . '/includes/header.php');\n";
        $php .= "    ?>\n\n";

        // Render sections
        foreach ($sections as $section) {
            $php .= $this->renderSection($section);
        }

        $php .= "\n    <?php\n";
        $php .= "    // Include footer (placeholder for future footer component)\n";
        $php .= "    // include_once(__DIR__ . '/includes/footer.php');\n";
        $php .= "    ?>\n\n";

        $php .= "    <script src=\"js/script.js\"></script>\n";

        $php .= "\n    <?php\n";
        $php .= "    // Include body scripts (placeholder)\n";
        $php .= "    // include_once(__DIR__ . '/includes/body-scripts.php');\n";
        $php .= "    ?>\n";

        $php .= "</body>\n";
        $php .= "</html>";

        return $php;
    }

    /**
     * Escape CSS content for safe inclusion in PHP files.
     *
     * @param string $css
     * @return string
     */
    protected function escapeCss(string $css): string
    {
        // Escape any PHP tags in CSS to prevent code injection
        return str_replace(['<?', '?>'], ['&lt;?', '?&gt;'], $css);
    }

    /**
     * Render a single section to HTML.
     *
     * @param array $section
     * @return string
     */
    protected function renderSection(array $section): string
    {
        // Use the trait's buildSectionHTML method
        return "    " . str_replace("\n", "\n    ", trim($this->buildSectionHTML($section))) . "\n";
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

        // Load base styles (grid system, resets, etc.)
        $baseStylesPath = base_path('resources/base-styles.css');
        $baseStyles = File::exists($baseStylesPath) ? File::get($baseStylesPath) : '';

        // Combine: Base styles + Custom CSS
        $fullCss = $baseStyles;

        if (!empty($siteCss)) {
            $fullCss .= "\n\n/* Custom Site Styles */\n";
            $fullCss .= $siteCss;
        }

        // Add page-specific and section-specific CSS
        $pages = $data['pages'] ?? [];
        foreach ($pages as $page) {
            // Page CSS
            if (!empty($page['page_css'])) {
                $fullCss .= "\n\n/* Page: {$page['name']} */\n";
                $fullCss .= $page['page_css'];
            }

            // Section CSS
            $sections = $page['sections'] ?? [];
            foreach ($sections as $section) {
                $this->addSectionCSS($fullCss, $section);
            }
        }

        // Main stylesheet
        $cssPath = $basePath . '/css/style.css';
        File::put($cssPath, $fullCss);

        \Log::info('Generated CSS file', [
            'base_styles_length' => strlen($baseStyles),
            'custom_css_length' => strlen($siteCss),
            'total_length' => strlen($fullCss)
        ]);
    }

    /**
     * Add section-specific CSS (similar to TemplateFileGenerator)
     */
    protected function addSectionCSS(string &$css, array $section): void
    {
        $sectionId = $section['section_id'] ?? 'section-' . ($section['id'] ?? uniqid());
        $content = $section['content'] ?? [];

        // Decode content if it's a JSON string
        if (is_string($content)) {
            $content = json_decode($content, true) ?? [];
        }

        // Section CSS
        if (isset($content['section_css'])) {
            $css .= "\n\n/* Section: {$section['section_name']} */\n";
            $css .= "#{$sectionId} {\n";
            $css .= "  " . trim($content['section_css']) . "\n";
            $css .= "}\n";
        }

        $type = $section['type'] ?? 'unknown';

        // Navigation/Header styling
        if ($type === 'navbar' || str_starts_with($type, 'navbar-') || str_starts_with($type, 'header-')) {
            $this->addNavigationCSS($css, $section, $sectionId, $content);
        }

        // Grid/Column styling
        if (str_starts_with($type, 'grid-')) {
            $this->addGridCSS($css, $section, $sectionId, $content);
        }

        // Footer styling
        if (str_starts_with($type, 'footer-')) {
            $this->addFooterCSS($css, $section, $sectionId, $content);
        }
    }

    /**
     * Add navigation-specific CSS
     */
    protected function addNavigationCSS(string &$css, array $section, string $sectionId, array $content): void
    {
        // Container Style (including position)
        if (isset($content['containerStyle']) || isset($content['position'])) {
            $cs = $content['containerStyle'] ?? [];
            $navPosition = $content['position'] ?? 'static';

            $css .= "\n\n/* {$section['section_name']} - Container */\n";
            $css .= "#{$sectionId} {\n";
            if (isset($cs['background'])) $css .= "  background: {$cs['background']};\n";
            if (isset($cs['paddingTop'])) $css .= "  padding-top: {$cs['paddingTop']};\n";
            if (isset($cs['paddingRight'])) $css .= "  padding-right: {$cs['paddingRight']};\n";
            if (isset($cs['paddingBottom'])) $css .= "  padding-bottom: {$cs['paddingBottom']};\n";
            if (isset($cs['paddingLeft'])) $css .= "  padding-left: {$cs['paddingLeft']};\n";
            if (isset($cs['marginTop'])) $css .= "  margin-top: {$cs['marginTop']};\n";
            if (isset($cs['marginRight'])) $css .= "  margin-right: {$cs['marginRight']};\n";
            if (isset($cs['marginBottom'])) $css .= "  margin-bottom: {$cs['marginBottom']};\n";
            if (isset($cs['marginLeft'])) $css .= "  margin-left: {$cs['marginLeft']};\n";
            if (isset($cs['width'])) $css .= "  width: {$cs['width']};\n";
            if (isset($cs['height'])) $css .= "  height: {$cs['height']};\n";
            if (isset($cs['borderWidth'])) $css .= "  border-width: {$cs['borderWidth']}px;\n";
            if (isset($cs['borderStyle']) && $cs['borderStyle'] !== 'none') $css .= "  border-style: {$cs['borderStyle']};\n";
            if (isset($cs['borderColor'])) $css .= "  border-color: {$cs['borderColor']};\n";
            if (isset($cs['borderRadius'])) $css .= "  border-radius: {$cs['borderRadius']}px;\n";
            // Add position property
            if ($navPosition && $navPosition !== 'static') {
                $css .= "  position: {$navPosition};\n";
                if ($navPosition === 'fixed' || $navPosition === 'sticky') {
                    $css .= "  top: 0;\n";
                    $css .= "  left: 0;\n";
                    $css .= "  right: 0;\n";
                    $css .= "  z-index: 1000;\n";
                }
            }
            $css .= "}\n";
        }

        // Link Styling
        if (isset($content['linkStyling'])) {
            $ls = $content['linkStyling'];
            $css .= "\n/* {$section['section_name']} - Links */\n";
            $css .= "#{$sectionId} a {\n";
            if (isset($ls['textColor'])) $css .= "  color: {$ls['textColor']};\n";
            if (isset($ls['bgColor'])) $css .= "  background-color: {$ls['bgColor']};\n";
            if (isset($ls['fontSize'])) $css .= "  font-size: {$ls['fontSize']}px;\n";
            $css .= "  text-decoration: none;\n";
            $css .= "}\n\n";

            $css .= "#{$sectionId} a:hover {\n";
            if (isset($ls['textColorHover'])) $css .= "  color: {$ls['textColorHover']};\n";
            if (isset($ls['bgColorHover'])) $css .= "  background-color: {$ls['bgColorHover']};\n";
            $css .= "}\n";
        }
    }

    /**
     * Add grid/column-specific CSS
     */
    protected function addGridCSS(string &$css, array $section, string $sectionId, array $content): void
    {
        $contentCSS = $content['content_css'] ?? null;
        if (!$contentCSS) return;

        $columns = $content['columns'] ?? [];

        // Row CSS
        if (isset($contentCSS['row'])) {
            $css .= "\n\n/* {$section['section_name']} - Row */\n";
            $css .= "#{$sectionId} .row {\n";
            $css .= "  " . trim($contentCSS['row']) . "\n";
            $css .= "}\n";
        }

        // Column CSS - for each column
        if (isset($contentCSS['columns']) && is_array($contentCSS['columns'])) {
            foreach ($contentCSS['columns'] as $colIdx => $colCSS) {
                if ($colCSS) {
                    $colWidth = $columns[$colIdx]['colWidth'] ?? 12;
                    $css .= "\n/* {$section['section_name']} - Column " . ($colIdx + 1) . " */\n";
                    $css .= "#{$sectionId} .col-{$colWidth}:nth-of-type(" . ($colIdx + 1) . ") {\n";
                    $css .= "  " . trim($colCSS) . "\n";
                    $css .= "}\n";
                }
            }
        }
    }

    /**
     * Add footer-specific CSS
     */
    protected function addFooterCSS(string &$css, array $section, string $sectionId, array $content): void
    {
        $type = $section['type'] ?? 'unknown';

        if ($type === 'footer-simple') {
            $sectionStyle = $content['sectionStyle'] ?? [];
            $css .= "\n\n/* {$section['section_name']} - Footer Simple */\n";
            $css .= "#{$sectionId} {\n";
            $css .= "  background-color: " . ($sectionStyle['background'] ?? '#1f2937') . ";\n";
            $css .= "  color: " . ($sectionStyle['textColor'] ?? 'white') . ";\n";
            $css .= "  padding: " . ($sectionStyle['padding'] ?? '32px') . ";\n";
            $css .= "  text-align: " . ($sectionStyle['textAlign'] ?? 'center') . ";\n";
            $css .= "}\n\n";

            $css .= "#{$sectionId} p {\n";
            $css .= "  font-size: " . ($sectionStyle['fontSize'] ?? '0.875rem') . ";\n";
            $css .= "}\n";
        }

        if ($type === 'footer-columns') {
            $sectionStyle = $content['sectionStyle'] ?? [];
            $copyrightStyle = $content['copyrightStyle'] ?? [];

            $css .= "\n\n/* {$section['section_name']} - Footer Columns */\n";
            $css .= "#{$sectionId} {\n";
            $css .= "  background-color: " . ($sectionStyle['background'] ?? '#172554') . ";\n";
            $css .= "  color: " . ($sectionStyle['textColor'] ?? 'white') . ";\n";
            $css .= "}\n\n";

            $css .= "#{$sectionId} .footer-grid {\n";
            $css .= "  display: grid;\n";
            $css .= "  grid-template-columns: repeat(3, 1fr);\n";
            $css .= "  gap: 32px;\n";
            $css .= "  padding: 48px;\n";
            $css .= "  max-width: 1280px;\n";
            $css .= "  margin: 0 auto;\n";
            $css .= "}\n\n";

            $css .= "#{$sectionId} .footer-column {\n";
            $css .= "  min-height: 150px;\n";
            $css .= "  text-align: center;\n";
            $css .= "}\n\n";

            $css .= "#{$sectionId} .footer-copyright {\n";
            $css .= "  background-color: " . ($copyrightStyle['background'] ?? '#171717') . ";\n";
            $css .= "  padding: " . ($copyrightStyle['padding'] ?? '24px') . ";\n";
            $css .= "  border-top: " . ($copyrightStyle['borderTop'] ?? '1px solid #374151') . ";\n";
            $css .= "}\n\n";

            $css .= "#{$sectionId} .footer-copyright p {\n";
            $css .= "  font-size: " . ($copyrightStyle['fontSize'] ?? '0.875rem') . ";\n";
            $css .= "  text-align: center;\n";
            $css .= "  max-width: 1280px;\n";
            $css .= "  margin: 0 auto;\n";
            $css .= "  padding: 0 48px;\n";
            $css .= "}\n";
        }
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
        // JavaScript for navigation dropdowns, mobile menu, etc.
        $js = "// Pagevoo Website JavaScript\n\n";
        $js .= "function toggleMobileMenu(sectionId) {\n";
        $js .= "  const menu = document.getElementById('mobile-menu-' + sectionId);\n";
        $js .= "  if (menu) {\n";
        $js .= "    menu.classList.toggle('active');\n";
        $js .= "  }\n";
        $js .= "}\n\n";

        $js .= "function toggleMobileDropdown(button) {\n";
        $js .= "  const dropdown = button.closest('.mobile-dropdown');\n";
        $js .= "  if (dropdown) {\n";
        $js .= "    dropdown.classList.toggle('expanded');\n";
        $js .= "  }\n";
        $js .= "}\n\n";

        $js .= "// Reset mobile menu on resize to desktop\n";
        $js .= "let resizeTimer;\n";
        $js .= "window.addEventListener('resize', function() {\n";
        $js .= "  clearTimeout(resizeTimer);\n";
        $js .= "  resizeTimer = setTimeout(function() {\n";
        $js .= "    if (window.innerWidth >= 768) {\n";
        $js .= "      const mobileMenus = document.querySelectorAll('.mobile-menu.active');\n";
        $js .= "      mobileMenus.forEach(function(menu) {\n";
        $js .= "        menu.classList.remove('active');\n";
        $js .= "      });\n";
        $js .= "    }\n";
        $js .= "  }, 100);\n";
        $js .= "});\n\n";

        $js .= "// Handle dropdown menus with click behavior\n";
        $js .= "document.addEventListener('DOMContentLoaded', function() {\n";
        $js .= "  const dropdowns = document.querySelectorAll('.nav-dropdown');\n";
        $js .= "  \n";
        $js .= "  dropdowns.forEach(function(dropdown) {\n";
        $js .= "    const toggle = dropdown.querySelector('.dropdown-toggle');\n";
        $js .= "    if (!toggle) return;\n";
        $js .= "    \n";
        $js .= "    toggle.addEventListener('click', function(e) {\n";
        $js .= "      e.preventDefault();\n";
        $js .= "      \n";
        $js .= "      // Close other dropdowns\n";
        $js .= "      dropdowns.forEach(function(otherDropdown) {\n";
        $js .= "        if (otherDropdown !== dropdown) {\n";
        $js .= "          otherDropdown.classList.remove('active');\n";
        $js .= "        }\n";
        $js .= "      });\n";
        $js .= "      \n";
        $js .= "      // Toggle current dropdown\n";
        $js .= "      dropdown.classList.toggle('active');\n";
        $js .= "    });\n";
        $js .= "  });\n";
        $js .= "  \n";
        $js .= "  // Close dropdowns when clicking outside\n";
        $js .= "  document.addEventListener('click', function(e) {\n";
        $js .= "    if (!e.target.closest('.nav-dropdown')) {\n";
        $js .= "      dropdowns.forEach(function(dropdown) {\n";
        $js .= "        dropdown.classList.remove('active');\n";
        $js .= "      });\n";
        $js .= "    }\n";
        $js .= "  });\n";
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
