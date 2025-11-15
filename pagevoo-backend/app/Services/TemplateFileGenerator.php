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
    use SectionRendererTrait;

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

        // Generate JavaScript file
        $this->generateJavaScript($template, $publicPath . '/js/script.js');

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
     * Generate JavaScript file
     */
    protected function generateJavaScript(Template $template, string $outputPath): void
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

        File::put($outputPath, $js);
    }

    /**
     * Build complete stylesheet content
     */
    protected function buildStylesheet(Template $template): string
    {
        $css = "/*\n * Generated Stylesheet for {$template->name}\n * Generated by Pagevoo Template Builder\n */\n\n";

        // Load base styles (grid system, resets, etc.)
        $baseStylesPath = base_path('resources/base-styles.css');
        $baseStyles = File::exists($baseStylesPath) ? File::get($baseStylesPath) : '';

        if ($baseStyles) {
            $css .= "/* Base Styles */\n\n";
            $css .= $baseStyles . "\n\n";
        }

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

        // Add body padding-top if there's a fixed/sticky navbar
        if ($hasFixedNavbar) {
            $css .= "body {\n";
            $css .= "  padding-top: 80px; /* Space for fixed/sticky navbar */\n";
            $css .= "}\n\n";
        }

        // Remove top margin from first element to prevent gap at top of page
        $css .= "body > *:first-child {\n";
        $css .= "  margin-top: 0;\n";
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

            // Remove gap when button styling is enabled (margin controls the spacing)
            $css .= "/* {$section->section_name} - Remove Default Gap */\n";
            $css .= "#{$sectionId} .nav-links {\n";
            $css .= "  gap: 0;\n";
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
     * Build complete PHP page content
     */
    protected function buildPageHTML(Template $template, TemplatePage $page): string
    {
        $pageTitle = $page->name;
        $pageSlug = $page->slug;
        $metaDescription = $page->meta_description ?? '';

        $php = "<?php\n";
        $php .= "/**\n";
        $php .= " * Page: {$pageTitle}\n";
        $php .= " * Generated by Pagevoo Template Builder\n";
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
        $php .= "  <meta charset=\"UTF-8\">\n";
        $php .= "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
        $php .= "  <title><?php echo htmlspecialchars(\$pageTitle); ?></title>\n";
        if ($metaDescription) {
            $php .= "  <meta name=\"description\" content=\"<?php echo htmlspecialchars(\$metaDescription); ?>\">\n";
        }
        $php .= "  <link rel=\"stylesheet\" href=\"public/css/style.css\">\n";
        $php .= "\n  <?php\n";
        $php .= "  // Include additional head scripts (placeholder)\n";
        $php .= "  // include_once(__DIR__ . '/includes/head-scripts.php');\n";
        $php .= "  ?>\n";
        $php .= "</head>\n";
        $php .= "<body data-page=\"<?php echo htmlspecialchars(\$pageSlug); ?>\">\n\n";

        $php .= "  <?php\n";
        $php .= "  // Include header (placeholder for future header component)\n";
        $php .= "  // include_once(__DIR__ . '/includes/header.php');\n";
        $php .= "  ?>\n\n";

        $html = $php;

        // Generate sections
        foreach ($page->sections()->orderBy('order')->get() as $section) {
            $html .= $this->buildSectionHTML($section);
            $html .= "\n\n";
        }

        // External JavaScript
        $html .= "<script src=\"public/js/script.js\"></script>\n\n";

        $html .= "  <?php\n";
        $html .= "  // Include footer (placeholder for future footer component)\n";
        $html .= "  // include_once(__DIR__ . '/includes/footer.php');\n";
        $html .= "  ?>\n\n";

        $html .= "  <?php\n";
        $html .= "  // Include body scripts (placeholder)\n";
        $html .= "  // include_once(__DIR__ . '/includes/body-scripts.php');\n";
        $html .= "  ?>\n\n";

        $html .= "</body>\n";
        $html .= "</html>";

        return $html;
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
