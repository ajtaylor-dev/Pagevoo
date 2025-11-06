<?php

namespace App\Services;

use App\Models\Template;
use App\Models\TemplatePage;
use App\Models\TemplateSection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TemplateFileGenerator
{
    protected string $baseDirectory;

    public function __construct()
    {
        $this->baseDirectory = public_path('template_directory');

        // Ensure base directory exists
        if (!File::exists($this->baseDirectory)) {
            File::makeDirectory($this->baseDirectory, 0755, true);
        }

        // Ensure image_galleries directory exists
        $imageGalleriesDir = public_path('image_galleries');
        if (!File::exists($imageGalleriesDir)) {
            File::makeDirectory($imageGalleriesDir, 0755, true);
        }
    }

    /**
     * Generate or regenerate all files for a template
     */
    public function generateTemplateFiles(Template $template): string
    {
        // Ensure template has a slug
        if (!$template->template_slug) {
            $template->template_slug = $this->generateSlug($template);
            $template->save();
        }

        $templatePath = $this->getTemplatePath($template);

        // Create template directory
        if (!File::exists($templatePath)) {
            File::makeDirectory($templatePath, 0755, true);
        }

        // Create public/assets directories
        $publicPath = $templatePath . '/public';
        File::ensureDirectoryExists($publicPath . '/css', 0755, true);
        File::ensureDirectoryExists($publicPath . '/js', 0755, true);
        File::ensureDirectoryExists($publicPath . '/images', 0755, true);

        // Move images from temporary gallery to template folder
        $this->copyTemplateImages($template, $publicPath . '/images');

        // Generate CSS file
        $this->generateStylesheet($template, $publicPath . '/css/style.css');

        // Generate HTML files for each page
        foreach ($template->pages as $page) {
            $this->generatePageHTML($template, $page, $templatePath);
        }

        return $templatePath;
    }

    /**
     * Generate a slug for the template
     */
    protected function generateSlug(Template $template): string
    {
        if ($template->is_active) {
            // Published template: use clean name-based slug
            $baseSlug = Str::slug($template->name);
            $slug = $baseSlug;
            $counter = 1;

            // Ensure uniqueness
            while (Template::where('template_slug', $slug)->where('id', '!=', $template->id)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }

            return $slug;
        } else {
            // Unpublished template: use random string
            return Str::random(10);
        }
    }

    /**
     * Get the full path to template directory
     */
    public function getTemplatePath(Template $template): string
    {
        return $this->baseDirectory . '/' . $template->template_slug;
    }

    /**
     * Get the URL to template directory
     */
    public function getTemplateUrl(Template $template): string
    {
        return url('template_directory/' . $template->template_slug);
    }

    /**
     * Move template images from image_galleries to template assets folder
     * Also updates image paths in database and deletes temporary gallery folder
     */
    protected function copyTemplateImages(Template $template, string $targetPath): void
    {
        if (!$template->images || !is_array($template->images)) {
            return;
        }

        File::ensureDirectoryExists($targetPath, 0755, true);

        $updatedImages = [];
        $hasChanges = false;

        foreach ($template->images as $image) {
            $sourcePath = public_path($image['path'] ?? '');

            if (File::exists($sourcePath)) {
                $filename = basename($sourcePath);
                $newPath = $targetPath . '/' . $filename;

                // Check if image is still in image_galleries (needs to be moved)
                if (str_contains($image['path'], 'image_galleries/')) {
                    // Move the file
                    File::move($sourcePath, $newPath);

                    // Update path in database
                    $image['path'] = "template_directory/{$template->template_slug}/public/images/{$filename}";
                    $hasChanges = true;
                } else {
                    // Image already in template directory, just copy
                    File::copy($sourcePath, $newPath);
                }
            }

            $updatedImages[] = $image;
        }

        // Update template with new image paths if changes were made
        if ($hasChanges) {
            $template->update(['images' => $updatedImages]);

            // Also update CSS references and HTML img src in all sections
            $this->updateCssImagePaths($template);
            $this->updateHtmlImagePaths($template);
        }

        // Delete temporary image_galleries folder after moving all images
        $tempGalleryPath = public_path("image_galleries/template_{$template->id}");
        if (File::exists($tempGalleryPath)) {
            File::deleteDirectory($tempGalleryPath);
            \Log::info("Deleted temporary gallery folder: {$tempGalleryPath}");
        }
    }

    /**
     * Update CSS references from image_galleries to template directory
     */
    protected function updateCssImagePaths(Template $template): void
    {
        $oldUrlPattern = url("image_galleries/template_{$template->id}/");
        $newUrlPattern = url("template_directory/{$template->template_slug}/public/images/");

        $hasUpdates = false;

        // Update custom_css at template level
        if ($template->custom_css) {
            $updatedCss = str_replace($oldUrlPattern, $newUrlPattern, $template->custom_css);
            if ($updatedCss !== $template->custom_css) {
                $template->custom_css = $updatedCss;
                $hasUpdates = true;
            }
        }

        // Update CSS in all pages
        foreach ($template->pages as $page) {
            $pageUpdated = false;

            // Update page-level CSS
            if ($page->css) {
                $updatedCss = str_replace($oldUrlPattern, $newUrlPattern, $page->css);
                if ($updatedCss !== $page->css) {
                    $page->css = $updatedCss;
                    $pageUpdated = true;
                }
            }

            // Update section-level CSS
            foreach ($page->sections as $section) {
                $sectionUpdated = false;

                // Update css column if it exists
                if ($section->css) {
                    $updatedCss = str_replace($oldUrlPattern, $newUrlPattern, $section->css);
                    if ($updatedCss !== $section->css) {
                        $section->css = $updatedCss;
                        $sectionUpdated = true;
                    }
                }

                // Update CSS in content JSON (section.content.css, section.content.content_css, etc.)
                $content = $section->content;
                if (is_array($content)) {
                    $contentUpdated = false;

                    // Check section.content.css
                    if (isset($content['css']) && is_string($content['css']) && str_contains($content['css'], 'image_galleries')) {
                        $content['css'] = str_replace($oldUrlPattern, $newUrlPattern, $content['css']);
                        $contentUpdated = true;
                    }

                    // Check section.content.content_css (row and column CSS)
                    if (isset($content['content_css']) && is_array($content['content_css'])) {
                        foreach ($content['content_css'] as $key => $cssValue) {
                            if (is_string($cssValue) && str_contains($cssValue, 'image_galleries')) {
                                $content['content_css'][$key] = str_replace($oldUrlPattern, $newUrlPattern, $cssValue);
                                $contentUpdated = true;
                            }
                        }
                    }

                    if ($contentUpdated) {
                        $section->content = $content;
                        $sectionUpdated = true;
                    }
                }

                if ($sectionUpdated) {
                    $section->save();
                    $pageUpdated = true;
                }
            }

            if ($pageUpdated) {
                $page->save();
                $hasUpdates = true;
            }
        }

        if ($hasUpdates) {
            $template->save();
            \Log::info("Updated CSS image paths from image_galleries to template directory");
        }
    }

    /**
     * Update HTML img src references from image_galleries to template directory
     */
    protected function updateHtmlImagePaths(Template $template): void
    {
        $oldUrlPattern = url("image_galleries/template_{$template->id}/");
        $newUrlPattern = url("template_directory/{$template->template_slug}/public/images/");

        $hasUpdates = false;

        // Update HTML content in all pages and sections
        foreach ($template->pages as $page) {
            $pageUpdated = false;

            foreach ($page->sections as $section) {
                $content = $section->content;

                if (!is_array($content)) {
                    continue;
                }

                $sectionUpdated = false;

                // Update all string fields in content (title, subtitle, heading, etc.)
                foreach ($content as $key => $value) {
                    if (is_string($value) && str_contains($value, 'image_galleries')) {
                        $updatedValue = str_replace($oldUrlPattern, $newUrlPattern, $value);
                        if ($updatedValue !== $value) {
                            $content[$key] = $updatedValue;
                            $sectionUpdated = true;
                        }
                    }
                }

                // Update columns array if it exists (for grid sections)
                if (isset($content['columns']) && is_array($content['columns'])) {
                    foreach ($content['columns'] as $colIndex => $column) {
                        if (isset($column['content']) && is_string($column['content']) && str_contains($column['content'], 'image_galleries')) {
                            $updatedContent = str_replace($oldUrlPattern, $newUrlPattern, $column['content']);
                            if ($updatedContent !== $column['content']) {
                                $content['columns'][$colIndex]['content'] = $updatedContent;
                                $sectionUpdated = true;
                            }
                        }
                    }
                }

                if ($sectionUpdated) {
                    $section->content = $content;
                    $section->save();
                    $pageUpdated = true;
                }
            }

            if ($pageUpdated) {
                $hasUpdates = true;
            }
        }

        if ($hasUpdates) {
            \Log::info("Updated HTML image paths from image_galleries to template directory");
        }
    }

    /**
     * Generate stylesheet (CSS) file
     */
    protected function generateStylesheet(Template $template, string $outputPath): void
    {
        $css = $this->buildStylesheet($template);
        File::put($outputPath, $css);
    }

    /**
     * Build complete stylesheet content
     */
    protected function buildStylesheet(Template $template): string
    {
        $css = "/*\n * Generated Stylesheet for {$template->name}\n * Generated by Pagevoo Template Builder\n */\n\n";

        // Base Reset and Box Sizing
        $css .= "/* Base Reset */\n\n";
        $css .= "*, *::after, *::before {\n";
        $css .= "  box-sizing: border-box;\n";
        $css .= "  margin: 0;\n";
        $css .= "  padding: 0;\n";
        $css .= "  border-radius: 0;\n";
        $css .= "}\n\n";

        // Check if first section of any page is a fixed/sticky navbar
        $hasFixedNavbar = false;
        foreach ($template->pages as $page) {
            $firstSection = $page->sections()->orderBy('order')->first();
            if ($firstSection &&
                ($firstSection->type === 'navbar' || str_starts_with($firstSection->type, 'navbar-')) &&
                isset($firstSection->content['position']) &&
                ($firstSection->content['position'] === 'fixed' || $firstSection->content['position'] === 'sticky')) {
                $hasFixedNavbar = true;
                break;
            }
        }

        $css .= "body {\n";
        $css .= "  margin: 0;\n";
        $css .= "  padding: 0;\n";
        $css .= "  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n";
        $css .= "  line-height: 1.6;\n";
        // Add padding-top if there's a fixed/sticky navbar
        if ($hasFixedNavbar) {
            $css .= "  padding-top: 80px; /* Space for fixed/sticky navbar */\n";
        }
        $css .= "}\n\n";

        // Remove top margin from first element to prevent gap at top of page
        $css .= "body > *:first-child {\n";
        $css .= "  margin-top: 0;\n";
        $css .= "}\n\n";

        // Default link styles (can be overridden by site/page/section CSS)
        $css .= "a {\n";
        $css .= "  color: inherit;\n";
        $css .= "  text-decoration: none;\n";
        $css .= "}\n\n";

        // Navigation Base Styles
        $css .= "/* Navigation Base Styles */\n\n";
        $css .= "nav.navbar, nav[class*=\"navbar-\"], header[class*=\"header-\"] {\n";
        $css .= "  padding: 16px 0;\n";
        $css .= "  background-color: #ffffff;\n";
        $css .= "  border-bottom: 2px solid #e5e7eb;\n";
        $css .= "  border-radius: 0;\n";
        $css .= "  position: relative;\n";
        $css .= "}\n\n";

        $css .= ".nav-container {\n";
        $css .= "  display: flex;\n";
        $css .= "  align-items: center;\n";
        $css .= "  justify-content: space-between;\n";
        $css .= "  flex-wrap: wrap;\n";
        $css .= "  gap: 8px;\n";
        $css .= "  width: 100%;\n";
        $css .= "  padding: 0 16px;\n";
        $css .= "}\n\n";

        $css .= ".nav-logo, .logo {\n";
        $css .= "  font-size: 1.25rem;\n";
        $css .= "  font-weight: bold;\n";
        $css .= "  min-width: 120px;\n";
        $css .= "}\n\n";

        $css .= ".nav-links {\n";
        $css .= "  display: flex;\n";
        $css .= "  gap: 1.5rem;\n";
        $css .= "  align-items: center;\n";
        $css .= "  flex-wrap: wrap;\n";
        $css .= "  flex: 1;\n";
        $css .= "}\n\n";

        $css .= ".nav-link {\n";
        $css .= "  text-decoration: none;\n";
        $css .= "  color: inherit;\n";
        $css .= "  transition: opacity 0.2s;\n";
        $css .= "}\n\n";

        $css .= ".nav-link:hover {\n";
        $css .= "  opacity: 0.75;\n";
        $css .= "}\n\n";

        $css .= ".nav-dropdown {\n";
        $css .= "  position: relative;\n";
        $css .= "}\n\n";

        $css .= ".dropdown-toggle {\n";
        $css .= "  cursor: pointer;\n";
        $css .= "  display: flex;\n";
        $css .= "  align-items: center;\n";
        $css .= "  gap: 0.25rem;\n";
        $css .= "}\n\n";

        $css .= ".dropdown-menu {\n";
        $css .= "  display: none;\n";
        $css .= "  position: absolute;\n";
        $css .= "  top: 100%;\n";
        $css .= "  left: 0;\n";
        $css .= "  margin-top: 0.25rem;\n";
        $css .= "  background-color: #ffffff;\n";
        $css .= "  border: 1px solid #e5e7eb;\n";
        $css .= "  border-radius: 0.25rem;\n";
        $css .= "  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n";
        $css .= "  padding: 0.5rem;\n";
        $css .= "  min-width: 150px;\n";
        $css .= "  z-index: 10;\n";
        $css .= "}\n\n";

        $css .= ".nav-dropdown[data-trigger=\"hover\"]:hover .dropdown-menu {\n";
        $css .= "  display: block;\n";
        $css .= "}\n\n";

        $css .= ".nav-dropdown[data-trigger=\"click\"].active .dropdown-menu {\n";
        $css .= "  display: block;\n";
        $css .= "}\n\n";

        $css .= ".dropdown-item {\n";
        $css .= "  display: block;\n";
        $css .= "  padding: 0.5rem 0.75rem;\n";
        $css .= "  text-decoration: none;\n";
        $css .= "  color: inherit;\n";
        $css .= "  border-radius: 0.25rem;\n";
        $css .= "  transition: background-color 0.2s;\n";
        $css .= "}\n\n";

        $css .= ".dropdown-item:hover {\n";
        $css .= "  background-color: #f3f4f6;\n";
        $css .= "}\n\n";

        $css .= ".mobile-menu-btn {\n";
        $css .= "  display: none;\n";
        $css .= "  background: none;\n";
        $css .= "  border: none;\n";
        $css .= "  cursor: pointer;\n";
        $css .= "  padding: 0.5rem;\n";
        $css .= "}\n\n";

        $css .= ".menu-icon {\n";
        $css .= "  width: 1.5rem;\n";
        $css .= "  height: 1.5rem;\n";
        $css .= "  color: #374151;\n";
        $css .= "}\n\n";

        $css .= ".mobile-menu {\n";
        $css .= "  display: none;\n";
        $css .= "  width: 100%;\n";
        $css .= "  background-color: #ffffff;\n";
        $css .= "  border-top: 1px solid #e5e7eb;\n";
        $css .= "  padding: 1rem;\n";
        $css .= "}\n\n";

        $css .= ".mobile-menu.active {\n";
        $css .= "  display: block;\n";
        $css .= "}\n\n";

        $css .= ".mobile-menu a {\n";
        $css .= "  display: block;\n";
        $css .= "  padding: 0.75rem;\n";
        $css .= "  border-radius: 0.375rem;\n";
        $css .= "}\n\n";

        $css .= ".mobile-menu a:hover {\n";
        $css .= "  background-color: #f3f4f6;\n";
        $css .= "}\n\n";

        // Dropdown menu styles for desktop navigation
        $css .= "/* Dropdown Menu Styles */\n\n";
        $css .= ".dropdown {\n";
        $css .= "  position: relative;\n";
        $css .= "  display: inline-block;\n";
        $css .= "}\n\n";

        $css .= ".dropdown-toggle {\n";
        $css .= "  display: inline-flex;\n";
        $css .= "  align-items: center;\n";
        $css .= "  gap: 0.25rem;\n";
        $css .= "  cursor: pointer;\n";
        $css .= "}\n\n";

        $css .= ".dropdown-menu {\n";
        $css .= "  position: absolute;\n";
        $css .= "  top: 100%;\n";
        $css .= "  left: 0;\n";
        $css .= "  display: none;\n";
        $css .= "  min-width: 200px;\n";
        $css .= "  background-color: #ffffff;\n";
        $css .= "  border: 1px solid #e5e7eb;\n";
        $css .= "  border-radius: 0.375rem;\n";
        $css .= "  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n";
        $css .= "  padding: 0.5rem 0;\n";
        $css .= "  margin-top: 0.25rem;\n";
        $css .= "  z-index: 1000;\n";
        $css .= "}\n\n";

        // Add a pseudo-element to bridge the gap between toggle and menu (hover only)
        $css .= ".dropdown[data-trigger='hover']::after {\n";
        $css .= "  content: '';\n";
        $css .= "  position: absolute;\n";
        $css .= "  top: 100%;\n";
        $css .= "  left: 0;\n";
        $css .= "  right: 0;\n";
        $css .= "  height: 0.25rem;\n";
        $css .= "  display: none;\n";
        $css .= "}\n\n";

        $css .= ".dropdown[data-trigger='hover']:hover::after {\n";
        $css .= "  display: block;\n";
        $css .= "}\n\n";

        $css .= ".dropdown[data-trigger='hover']:hover .dropdown-menu {\n";
        $css .= "  display: block;\n";
        $css .= "}\n\n";

        // For click-based dropdowns, show when active
        $css .= ".dropdown[data-trigger='click'].active .dropdown-menu,\n";
        $css .= ".dropdown[data-trigger='hybrid'].active .dropdown-menu {\n";
        $css .= "  display: block;\n";
        $css .= "}\n\n";

        $css .= ".dropdown-menu a {\n";
        $css .= "  display: block;\n";
        $css .= "  padding: 0.75rem 1rem;\n";
        $css .= "  color: #374151;\n";
        $css .= "  transition: background-color 0.2s ease;\n";
        $css .= "  white-space: nowrap;\n";
        $css .= "}\n\n";

        $css .= ".dropdown-menu a:hover {\n";
        $css .= "  background-color: #f3f4f6;\n";
        $css .= "}\n\n";

        // Mobile dropdown styles
        $css .= ".mobile-dropdown {\n";
        $css .= "  display: block;\n";
        $css .= "}\n\n";

        $css .= ".mobile-dropdown-toggle {\n";
        $css .= "  display: flex;\n";
        $css .= "  align-items: center;\n";
        $css .= "  justify-content: space-between;\n";
        $css .= "}\n\n";

        $css .= ".mobile-dropdown-toggle a {\n";
        $css .= "  flex: 1;\n";
        $css .= "}\n\n";

        $css .= ".mobile-expand-btn {\n";
        $css .= "  background: none;\n";
        $css .= "  border: none;\n";
        $css .= "  padding: 0.5rem;\n";
        $css .= "  cursor: pointer;\n";
        $css .= "  display: flex;\n";
        $css .= "  align-items: center;\n";
        $css .= "  justify-content: center;\n";
        $css .= "  color: #6b7280;\n";
        $css .= "  transition: transform 0.2s ease;\n";
        $css .= "}\n\n";

        $css .= ".mobile-expand-icon {\n";
        $css .= "  width: 1rem;\n";
        $css .= "  height: 1rem;\n";
        $css .= "}\n\n";

        $css .= ".mobile-dropdown.expanded .mobile-expand-btn {\n";
        $css .= "  transform: rotate(180deg);\n";
        $css .= "}\n\n";

        $css .= ".mobile-submenu {\n";
        $css .= "  display: none;\n";
        $css .= "  padding-left: 0.5rem;\n";
        $css .= "}\n\n";

        $css .= ".mobile-dropdown.expanded .mobile-submenu {\n";
        $css .= "  display: block;\n";
        $css .= "}\n\n";

        // Mobile sub-link indentation
        $css .= ".mobile-sub-link {\n";
        $css .= "  padding-left: 2rem !important;\n";
        $css .= "  font-size: 0.9rem;\n";
        $css .= "  color: #6b7280;\n";
        $css .= "}\n\n";

        // Responsive styles for mobile
        $css .= "/* Mobile Navigation */\n\n";
        $css .= "@media (max-width: 767px) {\n";
        $css .= "  .desktop-menu {\n";
        $css .= "    display: none;\n";
        $css .= "  }\n\n";
        $css .= "  .mobile-menu-btn {\n";
        $css .= "    display: block;\n";
        $css .= "  }\n";
        $css .= "}\n\n";

        // Responsive Grid System
        $css .= "/* Responsive Grid System */\n\n";
        $css .= "[class*=\"col-\"] {\n";
        $css .= "  float: left;\n";
        $css .= "  width: 100%;\n";
        $css .= "}\n\n";

        $css .= ".row::after {\n";
        $css .= "  content: \"\";\n";
        $css .= "  clear: both;\n";
        $css .= "  display: table;\n";
        $css .= "}\n\n";

        // Text content styling within rows
        $css .= "/* Text Content Styles */\n\n";

        // Extract H1-H4 styles from Site CSS if they exist (custom header settings)
        $hasCustomHeaders = false;
        if ($template->custom_css) {
            // Extract H1 styles
            if (preg_match('/(?:\.row\s+)?h1\s*\{([^}]+)\}/i', $template->custom_css, $h1Match)) {
                // Extract the selector from the match
                if (preg_match('/^[^{]+/', $h1Match[0], $selectorMatch)) {
                    $css .= trim($selectorMatch[0]) . " {\n";
                    $css .= $h1Match[1] . "\n";
                    $css .= "}\n\n";
                    $hasCustomHeaders = true;
                }
            }

            // Extract H2 styles
            if (preg_match('/(?:\.row\s+)?h2\s*\{([^}]+)\}/i', $template->custom_css, $h2Match)) {
                if (preg_match('/^[^{]+/', $h2Match[0], $selectorMatch)) {
                    $css .= trim($selectorMatch[0]) . " {\n";
                    $css .= $h2Match[1] . "\n";
                    $css .= "}\n\n";
                    $hasCustomHeaders = true;
                }
            }

            // Extract H3 styles
            if (preg_match('/(?:\.row\s+)?h3\s*\{([^}]+)\}/i', $template->custom_css, $h3Match)) {
                if (preg_match('/^[^{]+/', $h3Match[0], $selectorMatch)) {
                    $css .= trim($selectorMatch[0]) . " {\n";
                    $css .= $h3Match[1] . "\n";
                    $css .= "}\n\n";
                    $hasCustomHeaders = true;
                }
            }

            // Extract H4 styles
            if (preg_match('/(?:\.row\s+)?h4\s*\{([^}]+)\}/i', $template->custom_css, $h4Match)) {
                if (preg_match('/^[^{]+/', $h4Match[0], $selectorMatch)) {
                    $css .= trim($selectorMatch[0]) . " {\n";
                    $css .= $h4Match[1] . "\n";
                    $css .= "}\n\n";
                    $hasCustomHeaders = true;
                }
            }
        }

        // If no custom header styles, use browser defaults (no hardcoded styles)
        // This allows the browser's natural heading hierarchy to work
        if (!$hasCustomHeaders) {
            // Only add margin for spacing, let browser handle font-size and font-weight
            $css .= ".row h1, .row h2, .row h3, .row h4 {\n";
            $css .= "  margin: 0.67em 0;\n";
            $css .= "}\n\n";
        }

        // Extract Paragraph styles from Site CSS if they exist (custom paragraph settings)
        $hasCustomParagraph = false;
        if ($template->custom_css) {
            if (preg_match('/(?:\.row\s+)?p\s*\{([^}]+)\}/i', $template->custom_css, $pMatch)) {
                if (preg_match('/^[^{]+/', $pMatch[0], $selectorMatch)) {
                    $css .= trim($selectorMatch[0]) . " {\n";
                    $css .= $pMatch[1] . "\n";
                    $css .= "}\n\n";
                    $hasCustomParagraph = true;
                }
            }
        }

        // If no custom paragraph styles, use default margin
        if (!$hasCustomParagraph) {
            $css .= ".row p {\n";
            $css .= "  margin: 1em 0;\n";
            $css .= "}\n\n";
        }

        // Extract Link styles from Site CSS if they exist (custom hyperlink settings)
        if ($template->custom_css) {
            // Extract .row a { } styles
            if (preg_match('/(?:\.row\s+)?a\s*\{([^}]+)\}/i', $template->custom_css, $aMatch)) {
                if (preg_match('/^[^{]+/', $aMatch[0], $selectorMatch)) {
                    $css .= trim($selectorMatch[0]) . " {\n";
                    $css .= $aMatch[1] . "\n";
                    $css .= "}\n\n";
                }
            }

            // Extract .row a:hover { } styles
            if (preg_match('/(?:\.row\s+)?a:hover\s*\{([^}]+)\}/i', $template->custom_css, $aHoverMatch)) {
                if (preg_match('/^[^{]+/', $aHoverMatch[0], $selectorMatch)) {
                    $css .= trim($selectorMatch[0]) . " {\n";
                    $css .= $aHoverMatch[1] . "\n";
                    $css .= "}\n\n";
                }
            }

            // Extract .row a:visited { } styles
            if (preg_match('/(?:\.row\s+)?a:visited\s*\{([^}]+)\}/i', $template->custom_css, $aVisitedMatch)) {
                if (preg_match('/^[^{]+/', $aVisitedMatch[0], $selectorMatch)) {
                    $css .= trim($selectorMatch[0]) . " {\n";
                    $css .= $aVisitedMatch[1] . "\n";
                    $css .= "}\n\n";
                }
            }

            // Extract .row a:active { } styles
            if (preg_match('/(?:\.row\s+)?a:active\s*\{([^}]+)\}/i', $template->custom_css, $aActiveMatch)) {
                if (preg_match('/^[^{]+/', $aActiveMatch[0], $selectorMatch)) {
                    $css .= trim($selectorMatch[0]) . " {\n";
                    $css .= $aActiveMatch[1] . "\n";
                    $css .= "}\n\n";
                }
            }
        }

        $css .= ".row ul, .row ol {\n";
        $css .= "  margin: 1em 0;\n";
        $css .= "  padding-left: 2.5em;\n";
        $css .= "  list-style-position: outside;\n";
        $css .= "}\n\n";

        $css .= ".row ul {\n";
        $css .= "  list-style-type: disc;\n";
        $css .= "}\n\n";

        $css .= ".row ol {\n";
        $css .= "  list-style-type: decimal;\n";
        $css .= "}\n\n";

        $css .= ".row li {\n";
        $css .= "  margin: 0.5em 0;\n";
        $css .= "  display: list-item;\n";
        $css .= "}\n\n";

        // Site-wide CSS
        if ($template->custom_css) {
            $css .= "/* Site-Wide Styles */\n\n";
            $css .= $template->custom_css . "\n\n";
        }

        // Page-specific and section CSS
        foreach ($template->pages as $page) {
            if ($page->page_css) {
                $css .= "/* Page: {$page->name} */\n\n";
                $css .= $page->page_css . "\n\n";
            }

            foreach ($page->sections as $section) {
                $this->addSectionCSS($css, $section);
            }
        }

        // Responsive breakpoints
        $css .= "/* Responsive Breakpoints */\n\n";
        $css .= "@media (min-width: 768px) {\n";
        for ($i = 1; $i <= 12; $i++) {
            $width = round(($i / 12) * 100, 2);
            $css .= "  .col-{$i} { width: {$width}%; }\n";
        }
        $css .= "}\n\n";

        $css .= "@media (min-width: 1025px) {\n";
        for ($i = 1; $i <= 12; $i++) {
            $width = round(($i / 12) * 100, 2);
            $css .= "  .col-{$i} { width: {$width}%; }\n";
        }
        $css .= "}\n";

        return $css;
    }

    /**
     * Add section-specific CSS
     */
    protected function addSectionCSS(string &$css, TemplateSection $section): void
    {
        $sectionId = $section->section_id ?? "section-{$section->id}";
        $content = $section->content ?? [];

        // Section CSS
        if (isset($content['section_css'])) {
            $css .= "/* Section: {$section->section_name} */\n";
            $css .= "#{$sectionId} {\n";
            $css .= "  " . trim($content['section_css']) . "\n";
            $css .= "}\n\n";
        }

        // Navigation/Header styling
        if ($section->type === 'navbar' || str_starts_with($section->type, 'navbar-') || str_starts_with($section->type, 'header-')) {
            $this->addNavigationCSS($css, $section, $sectionId, $content);
        }

        // Grid/Column styling
        if (str_starts_with($section->type, 'grid-')) {
            $this->addGridCSS($css, $section, $sectionId, $content);
        }

        // Footer styling
        if (str_starts_with($section->type, 'footer-')) {
            $this->addFooterCSS($css, $section, $sectionId, $content);
        }
    }

    /**
     * Add navigation-specific CSS
     */
    protected function addNavigationCSS(string &$css, TemplateSection $section, string $sectionId, array $content): void
    {
        // Container Style (including position)
        if (isset($content['containerStyle']) || isset($content['position'])) {
            $cs = $content['containerStyle'] ?? [];
            $navPosition = $content['position'] ?? 'static';

            $css .= "/* {$section->section_name} - Container */\n";
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
            $css .= "}\n\n";
        }

        // Link Styling
        if (isset($content['linkStyling'])) {
            $ls = $content['linkStyling'];
            $css .= "/* {$section->section_name} - Links */\n";
            $css .= "#{$sectionId} a {\n";
            if (isset($ls['textColor'])) $css .= "  color: {$ls['textColor']};\n";
            if (isset($ls['bgColor'])) $css .= "  background-color: {$ls['bgColor']};\n";
            if (isset($ls['fontSize'])) $css .= "  font-size: {$ls['fontSize']}px;\n";
            $css .= "  text-decoration: none;\n";
            $css .= "}\n\n";

            $css .= "#{$sectionId} a:hover {\n";
            if (isset($ls['textColorHover'])) $css .= "  color: {$ls['textColorHover']};\n";
            if (isset($ls['bgColorHover'])) $css .= "  background-color: {$ls['bgColorHover']};\n";
            $css .= "}\n\n";
        }

        // Button-styled links hover states (global)
        if (isset($content['buttonStyling']) && ($content['buttonStyling']['enabled'] ?? false)) {
            $btnStyle = $content['buttonStyling'];
            $css .= "/* {$section->section_name} - Button Links Hover */\n";
            $css .= "#{$sectionId} .nav-link-button:hover,\n";
            $css .= "#{$sectionId} .dropdown-item-button:hover {\n";
            $css .= "  background-color: " . ($btnStyle['hoverBackgroundColor'] ?? '#2563eb') . " !important;\n";
            $css .= "  color: " . ($btnStyle['hoverTextColor'] ?? '#ffffff') . " !important;\n";
            $css .= "  transition: all 0.2s;\n";
            $css .= "}\n\n";
        }
    }

    /**
     * Add grid/column-specific CSS
     */
    protected function addGridCSS(string &$css, TemplateSection $section, string $sectionId, array $content): void
    {
        $contentCSS = $content['content_css'] ?? null;
        if (!$contentCSS) return;

        $columns = $content['columns'] ?? [];

        // Row CSS
        if (isset($contentCSS['row'])) {
            $css .= "/* {$section->section_name} - Row */\n";
            $css .= "#{$sectionId} .row {\n";
            $css .= "  " . trim($contentCSS['row']) . "\n";
            $css .= "}\n\n";
        }

        // Column CSS - for each column
        if (isset($contentCSS['columns']) && is_array($contentCSS['columns'])) {
            foreach ($contentCSS['columns'] as $colIdx => $colCSS) {
                if ($colCSS) {
                    $colWidth = $columns[$colIdx]['colWidth'] ?? 12;
                    $css .= "/* {$section->section_name} - Column " . ($colIdx + 1) . " */\n";
                    $css .= "#{$sectionId} .col-{$colWidth}:nth-of-type(" . ($colIdx + 1) . ") {\n";
                    $css .= "  " . trim($colCSS) . "\n";
                    $css .= "}\n\n";
                }
            }
        }
    }

    /**
     * Add footer-specific CSS
     */
    protected function addFooterCSS(string &$css, TemplateSection $section, string $sectionId, array $content): void
    {
        if ($section->type === 'footer-simple') {
            $sectionStyle = $content['sectionStyle'] ?? [];
            $css .= "/* {$section->section_name} - Footer Simple */\n";
            $css .= "#{$sectionId} {\n";
            $css .= "  background-color: " . ($sectionStyle['background'] ?? '#1f2937') . ";\n";
            $css .= "  color: " . ($sectionStyle['textColor'] ?? 'white') . ";\n";
            $css .= "  padding: " . ($sectionStyle['padding'] ?? '32px') . ";\n";
            $css .= "  text-align: " . ($sectionStyle['textAlign'] ?? 'center') . ";\n";
            $css .= "}\n\n";

            $css .= "#{$sectionId} p {\n";
            $css .= "  font-size: " . ($sectionStyle['fontSize'] ?? '0.875rem') . ";\n";
            $css .= "}\n\n";
        }

        if ($section->type === 'footer-columns') {
            $sectionStyle = $content['sectionStyle'] ?? [];
            $copyrightStyle = $content['copyrightStyle'] ?? [];

            $css .= "/* {$section->section_name} - Footer Columns */\n";
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
            $css .= "}\n\n";
        }
    }

    /**
     * Generate PHP file for a page
     */
    protected function generatePageHTML(Template $template, TemplatePage $page, string $templatePath): void
    {
        $filename = $page->is_homepage ? 'index.php' : $page->slug . '.php';
        $html = $this->buildPageHTML($template, $page);
        File::put($templatePath . '/' . $filename, $html);
    }

    /**
     * Build complete HTML content for a page
     */
    protected function buildPageHTML(Template $template, TemplatePage $page): string
    {
        $html = "<!DOCTYPE html>\n";
        $html .= "<html lang=\"en\">\n";
        $html .= "<head>\n";
        $html .= "  <meta charset=\"UTF-8\">\n";
        $html .= "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
        $html .= "  <title>{$page->name}</title>\n";
        if ($page->meta_description) {
            $html .= "  <meta name=\"description\" content=\"{$page->meta_description}\">\n";
        }
        $html .= "  <link rel=\"stylesheet\" href=\"public/css/style.css\">\n";
        $html .= "</head>\n";
        $html .= "<body>\n\n";

        // Generate sections
        foreach ($page->sections()->orderBy('order')->get() as $section) {
            $html .= $this->buildSectionHTML($section);
            $html .= "\n\n";
        }

        // Add mobile menu toggle and dropdown click handler scripts
        $html .= "<script>\n";
        $html .= "function toggleMobileMenu(sectionId) {\n";
        $html .= "  const menu = document.getElementById('mobile-menu-' + sectionId);\n";
        $html .= "  if (menu) {\n";
        $html .= "    menu.classList.toggle('active');\n";
        $html .= "  }\n";
        $html .= "}\n\n";

        $html .= "function toggleMobileDropdown(button) {\n";
        $html .= "  const dropdown = button.closest('.mobile-dropdown');\n";
        $html .= "  if (dropdown) {\n";
        $html .= "    dropdown.classList.toggle('expanded');\n";
        $html .= "  }\n";
        $html .= "}\n\n";

        $html .= "// Reset mobile menu on resize to desktop\n";
        $html .= "let resizeTimer;\n";
        $html .= "window.addEventListener('resize', function() {\n";
        $html .= "  clearTimeout(resizeTimer);\n";
        $html .= "  resizeTimer = setTimeout(function() {\n";
        $html .= "    if (window.innerWidth >= 768) {\n";
        $html .= "      const mobileMenus = document.querySelectorAll('.mobile-menu.active');\n";
        $html .= "      mobileMenus.forEach(function(menu) {\n";
        $html .= "        menu.classList.remove('active');\n";
        $html .= "      });\n";
        $html .= "    }\n";
        $html .= "  }, 100);\n";
        $html .= "});\n\n";

        $html .= "// Handle click-based dropdown menus\n";
        $html .= "document.addEventListener('DOMContentLoaded', function() {\n";
        $html .= "  const dropdowns = document.querySelectorAll('.nav-dropdown[data-trigger=\"click\"]');\n";
        $html .= "  \n";
        $html .= "  dropdowns.forEach(function(dropdown) {\n";
        $html .= "    const toggle = dropdown.querySelector('.dropdown-toggle');\n";
        $html .= "    if (!toggle) return;\n";
        $html .= "    \n";
        $html .= "    toggle.addEventListener('click', function(e) {\n";
        $html .= "      e.preventDefault();\n";
        $html .= "      \n";
        $html .= "      // Close other dropdowns\n";
        $html .= "      dropdowns.forEach(function(otherDropdown) {\n";
        $html .= "        if (otherDropdown !== dropdown) {\n";
        $html .= "          otherDropdown.classList.remove('active');\n";
        $html .= "        }\n";
        $html .= "      });\n";
        $html .= "      \n";
        $html .= "      // Toggle current dropdown\n";
        $html .= "      dropdown.classList.toggle('active');\n";
        $html .= "    });\n";
        $html .= "  });\n";
        $html .= "  \n";
        $html .= "  // Close dropdowns when clicking outside\n";
        $html .= "  document.addEventListener('click', function(e) {\n";
        $html .= "    if (!e.target.closest('.nav-dropdown')) {\n";
        $html .= "      dropdowns.forEach(function(dropdown) {\n";
        $html .= "        dropdown.classList.remove('active');\n";
        $html .= "      });\n";
        $html .= "    }\n";
        $html .= "  });\n";
        $html .= "});\n";
        $html .= "</script>\n\n";

        $html .= "</body>\n";
        $html .= "</html>";

        return $html;
    }

    /**
     * Build HTML for a single section
     */
    protected function buildSectionHTML(TemplateSection $section): string
    {
        $sectionId = $section->section_id ?? "section-{$section->id}";
        $content = $section->content ?? [];

        // Navigation/Header sections
        if ($section->type === 'navbar' || str_starts_with($section->type, 'navbar-') || str_starts_with($section->type, 'header-')) {
            return $this->buildNavigationHTML($section, $sectionId, $content);
        }

        // Grid sections
        if (str_starts_with($section->type, 'grid-')) {
            return $this->buildGridHTML($section, $sectionId, $content);
        }

        // Footer sections
        if (str_starts_with($section->type, 'footer-')) {
            return $this->buildFooterHTML($section, $sectionId, $content);
        }

        // Default section
        return "<section id=\"{$sectionId}\" class=\"{$section->type}\">\n  <!-- {$section->type} -->\n</section>";
    }

    /**
     * Build navigation/header HTML
     */
    protected function buildNavigationHTML(TemplateSection $section, string $sectionId, array $content): string
    {
        $tag = ($section->type === 'navbar' || str_starts_with($section->type, 'navbar-')) ? 'nav' : 'header';
        $dropdownConfig = $content['dropdownConfig'] ?? [];
        $trigger = $dropdownConfig['trigger'] ?? 'hover';

        // Get layout configuration
        $layoutConfig = $content['layoutConfig'] ?? [];
        $logoPosition = $layoutConfig['logoPosition'] ?? 'left';
        $linksPosition = $layoutConfig['linksPosition'] ?? 'right';
        $logoWidth = $layoutConfig['logoWidth'] ?? ($content['logoWidth'] ?? 25);

        $html = "<{$tag} id=\"{$sectionId}\" class=\"{$section->type}\">\n";
        $html .= "  <div class=\"nav-container\">\n";

        // Generate logo HTML
        $logoTextAlign = $logoPosition === 'center' ? 'center' : ($logoPosition === 'right' ? 'right' : 'left');
        $logoWidthStyle = $logoPosition === 'center' ? '100%' : $logoWidth . '%';
        $logoHTML = "    <div class=\"nav-logo\" style=\"width: {$logoWidthStyle}; text-align: {$logoTextAlign};\">" . ($content['logo'] ?? 'Logo') . "</div>\n";

        // Generate links HTML
        $linksHTML = '';
        $links = $content['links'] ?? [];

        // Check for global button styling
        $hasButtonStyle = isset($content['buttonStyling']) && ($content['buttonStyling']['enabled'] ?? false);
        $btnStyle = $hasButtonStyle ? $content['buttonStyling'] : [];

        if (count($links) > 0) {
            $linksJustify = $linksPosition === 'center' ? 'center' : ($linksPosition === 'left' ? 'flex-start' : 'flex-end');
            $linksHTML .= "    <div class=\"nav-links desktop-menu\" style=\"justify-content: {$linksJustify};\">\n";
            foreach ($links as $linkIndex => $link) {
                $label = is_array($link) ? ($link['label'] ?? 'Link') : $link;
                $href = $this->getLinkHref($link, $section);
                $hasSubItems = is_array($link) && isset($link['subItems']) && count($link['subItems']) > 0;

                if ($hasSubItems) {
                    // Dropdown menu item
                    $linkClass = $hasButtonStyle ? "nav-link nav-link-button dropdown-toggle" : "nav-link dropdown-toggle";
                    $buttonStyles = $hasButtonStyle ? sprintf(
                        ' style="background-color: %s; color: %s; border: %spx %s %s; border-radius: %spx; padding: %spx %spx %spx %spx; font-size: %spx; font-weight: %s; margin: %spx %spx %spx %spx; text-decoration: none; display: inline-block;"',
                        $btnStyle['backgroundColor'] ?? '#3b82f6',
                        $btnStyle['textColor'] ?? '#ffffff',
                        $btnStyle['borderWidth'] ?? 0,
                        $btnStyle['borderStyle'] ?? 'solid',
                        $btnStyle['borderColor'] ?? '#3b82f6',
                        $btnStyle['borderRadius'] ?? 0,
                        $btnStyle['paddingTop'] ?? 8,
                        $btnStyle['paddingRight'] ?? 16,
                        $btnStyle['paddingBottom'] ?? 8,
                        $btnStyle['paddingLeft'] ?? 16,
                        $btnStyle['fontSize'] ?? 14,
                        $btnStyle['fontWeight'] ?? '500',
                        $btnStyle['marginTop'] ?? 0,
                        $btnStyle['marginRight'] ?? 0,
                        $btnStyle['marginBottom'] ?? 0,
                        $btnStyle['marginLeft'] ?? 0
                    ) : '';

                    $linksHTML .= "      <div class=\"nav-dropdown\" data-trigger=\"{$trigger}\">\n";
                    $linksHTML .= "        <a href=\"{$href}\" class=\"{$linkClass}\"{$buttonStyles}>{$label} ▼</a>\n";
                    $linksHTML .= "        <div class=\"dropdown-menu\">\n";
                    foreach ($link['subItems'] as $subIdx => $subLink) {
                        $subLabel = is_array($subLink) ? ($subLink['label'] ?? 'Sub Link') : $subLink;
                        $subHref = $this->getLinkHref($subLink, $section);

                        // Use global button styling for sub-items
                        $subLinkClass = $hasButtonStyle ? "dropdown-item dropdown-item-button" : "dropdown-item";

                        $linksHTML .= "          <a href=\"{$subHref}\" class=\"{$subLinkClass}\"{$buttonStyles}>{$subLabel}</a>\n";
                    }
                    $linksHTML .= "        </div>\n";
                    $linksHTML .= "      </div>\n";
                } else {
                    // Regular link
                    $linkClass = $hasButtonStyle ? "nav-link nav-link-button" : "nav-link";
                    $buttonStyles = $hasButtonStyle ? sprintf(
                        ' style="background-color: %s; color: %s; border: %spx %s %s; border-radius: %spx; padding: %spx %spx %spx %spx; font-size: %spx; font-weight: %s; margin: %spx %spx %spx %spx; text-decoration: none; display: inline-block;"',
                        $btnStyle['backgroundColor'] ?? '#3b82f6',
                        $btnStyle['textColor'] ?? '#ffffff',
                        $btnStyle['borderWidth'] ?? 0,
                        $btnStyle['borderStyle'] ?? 'solid',
                        $btnStyle['borderColor'] ?? '#3b82f6',
                        $btnStyle['borderRadius'] ?? 0,
                        $btnStyle['paddingTop'] ?? 8,
                        $btnStyle['paddingRight'] ?? 16,
                        $btnStyle['paddingBottom'] ?? 8,
                        $btnStyle['paddingLeft'] ?? 16,
                        $btnStyle['fontSize'] ?? 14,
                        $btnStyle['fontWeight'] ?? '500',
                        $btnStyle['marginTop'] ?? 0,
                        $btnStyle['marginRight'] ?? 0,
                        $btnStyle['marginBottom'] ?? 0,
                        $btnStyle['marginLeft'] ?? 0
                    ) : '';

                    $linksHTML .= "      <a href=\"{$href}\" class=\"{$linkClass}\"{$buttonStyles}>{$label}</a>\n";
                }
            }
            $linksHTML .= "    </div>\n";

            // Arrange logo and links based on position
            if ($logoPosition === 'left' || $logoPosition === 'center') {
                $html .= $logoHTML;
                $html .= $linksHTML;
            } else {
                // Logo on right
                $html .= $linksHTML;
                $html .= $logoHTML;
            }

            // Mobile menu button
            $html .= "    <button class=\"mobile-menu-btn\" onclick=\"toggleMobileMenu('{$sectionId}')\" aria-label=\"Toggle menu\">\n";
            $html .= "      <svg class=\"menu-icon\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n";
            $html .= "        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 6h16M4 12h16M4 18h16\"></path>\n";
            $html .= "      </svg>\n";
            $html .= "    </button>\n";
            $html .= "  </div>\n";

            // Mobile menu panel (uses global button styling)
            $html .= "  <div class=\"mobile-menu\" id=\"mobile-menu-{$sectionId}\">\n";
            $mobileButtonStyles = $hasButtonStyle ? sprintf(
                ' style="background-color: %s; color: %s; border: %spx %s %s; border-radius: %spx; padding: %spx %spx %spx %spx; font-size: %spx; font-weight: %s; margin: %spx %spx %spx %spx; text-decoration: none; display: inline-block; text-align: center;"',
                $btnStyle['backgroundColor'] ?? '#3b82f6',
                $btnStyle['textColor'] ?? '#ffffff',
                $btnStyle['borderWidth'] ?? 0,
                $btnStyle['borderStyle'] ?? 'solid',
                $btnStyle['borderColor'] ?? '#3b82f6',
                $btnStyle['borderRadius'] ?? 0,
                $btnStyle['paddingTop'] ?? 8,
                $btnStyle['paddingRight'] ?? 16,
                $btnStyle['paddingBottom'] ?? 8,
                $btnStyle['paddingLeft'] ?? 16,
                $btnStyle['fontSize'] ?? 14,
                $btnStyle['fontWeight'] ?? '500',
                $btnStyle['marginTop'] ?? 0,
                $btnStyle['marginRight'] ?? 0,
                $btnStyle['marginBottom'] ?? 0,
                $btnStyle['marginLeft'] ?? 0
            ) : '';

            foreach ($links as $linkIndex => $link) {
                $label = is_array($link) ? ($link['label'] ?? 'Link') : $link;
                $href = $this->getLinkHref($link, $section);
                $hasSubItems = is_array($link) && isset($link['subItems']) && count($link['subItems']) > 0;

                if ($hasSubItems) {
                    // Parent item with toggle button
                    $html .= "    <div class=\"mobile-dropdown\">\n";
                    $html .= "      <div class=\"mobile-dropdown-toggle\">\n";
                    $html .= "        <a href=\"{$href}\"{$mobileButtonStyles}>{$label}</a>\n";
                    $html .= "        <button class=\"mobile-expand-btn\" onclick=\"toggleMobileDropdown(this)\" aria-label=\"Expand\">\n";
                    $html .= "          <svg class=\"mobile-expand-icon\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n";
                    $html .= "            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M19 9l-7 7-7-7\"></path>\n";
                    $html .= "          </svg>\n";
                    $html .= "        </button>\n";
                    $html .= "      </div>\n";
                    $html .= "      <div class=\"mobile-submenu\">\n";
                    foreach ($link['subItems'] as $subLink) {
                        $subLabel = is_array($subLink) ? ($subLink['label'] ?? 'Sub Link') : $subLink;
                        $subHref = $this->getLinkHref($subLink, $section);

                        // Use global button styling for mobile sub-items
                        $html .= "        <a href=\"{$subHref}\" class=\"mobile-sub-link\"{$mobileButtonStyles}>→ {$subLabel}</a>\n";
                    }
                    $html .= "      </div>\n";
                    $html .= "    </div>\n";
                } else {
                    // Regular link
                    $html .= "    <a href=\"{$href}\"{$mobileButtonStyles}>{$label}</a>\n";
                }
            }
            $html .= "  </div>\n";
        } else {
            // No links, just show logo
            $html .= $logoHTML;
            $html .= "  </div>\n";
        }

        $html .= "</{$tag}>";
        return $html;
    }

    /**
     * Get the proper href for a navigation link
     */
    protected function getLinkHref($link, TemplateSection $section): string
    {
        if (!is_array($link)) {
            return '#';
        }

        // Check if it's a page link or external URL
        $linkType = $link['linkType'] ?? 'url';

        if ($linkType === 'page' && isset($link['pageId'])) {
            // Find the page by ID
            $page = $section->templatePage->template->pages->firstWhere('id', $link['pageId']);

            if ($page) {
                // Homepage links to root
                if ($page->is_homepage) {
                    return '/';
                }
                // Other pages link to {slug}.php
                return $page->slug . '.php';
            }
        }

        // External URL or fallback
        return $link['url'] ?? '#';
    }

    /**
     * Build grid section HTML
     */
    protected function buildGridHTML(TemplateSection $section, string $sectionId, array $content): string
    {
        $html = "<section id=\"{$sectionId}\">\n";
        $html .= "  <div class=\"row\">\n";

        $columns = $content['columns'] ?? [];
        foreach ($columns as $col) {
            $colWidth = $col['colWidth'] ?? 12;
            $colContent = $col['content'] ?? '';
            $html .= "    <div class=\"col-{$colWidth}\">\n";
            $html .= "      {$colContent}\n";
            $html .= "    </div>\n";
        }

        $html .= "  </div>\n";
        $html .= "</section>";
        return $html;
    }

    /**
     * Build footer section HTML
     */
    protected function buildFooterHTML(TemplateSection $section, string $sectionId, array $content): string
    {
        if ($section->type === 'footer-simple') {
            $text = $content['text'] ?? '© 2025 Company Name. All rights reserved.';
            return "<footer id=\"{$sectionId}\" class=\"footer-simple\">\n  <p>{$text}</p>\n</footer>";
        }

        if ($section->type === 'footer-columns') {
            $columns = $content['columns'] ?? [];
            $html = "<footer id=\"{$sectionId}\" class=\"footer-columns\">\n";
            $html .= "  <div class=\"footer-grid\">\n";

            foreach ($columns as $col) {
                $colContent = $col['content'] ?? '<p>Column content</p>';
                $html .= "    <div class=\"footer-column\">\n";
                $html .= "      {$colContent}\n";
                $html .= "    </div>\n";
            }

            $html .= "  </div>\n";

            $copyrightText = $content['copyrightText'] ?? '© 2025 Company Name. All rights reserved.';
            $html .= "  <div class=\"footer-copyright\">\n";
            $html .= "    <p>{$copyrightText}</p>\n";
            $html .= "  </div>\n";
            $html .= "</footer>";

            return $html;
        }

        // Default footer
        return "<footer id=\"{$sectionId}\" class=\"{$section->type}\">\n  <!-- {$section->type} -->\n</footer>";
    }

    /**
     * Delete template directory
     */
    public function deleteTemplateFiles(Template $template): bool
    {
        $deleted = false;

        // Delete template directory
        if ($template->template_slug) {
            $templatePath = $this->getTemplatePath($template);
            if (File::exists($templatePath)) {
                File::deleteDirectory($templatePath);
                $deleted = true;
            }
        }

        // Delete temporary image gallery if it exists
        $tempGalleryPath = public_path("image_galleries/template_{$template->id}");
        if (File::exists($tempGalleryPath)) {
            File::deleteDirectory($tempGalleryPath);
            $deleted = true;
        }

        return $deleted;
    }

    /**
     * Regenerate slug when template is published/unpublished
     */
    public function updateSlugOnPublish(Template $template, bool $isNowPublished): void
    {
        $oldPath = $this->getTemplatePath($template);

        // Generate new slug based on published status
        $template->template_slug = $this->generateSlug($template);
        $template->save();

        $newPath = $this->getTemplatePath($template);

        // Move directory if it exists
        if (File::exists($oldPath) && $oldPath !== $newPath) {
            File::move($oldPath, $newPath);
        } else {
            // Generate fresh files
            $this->generateTemplateFiles($template);
        }
    }
}
