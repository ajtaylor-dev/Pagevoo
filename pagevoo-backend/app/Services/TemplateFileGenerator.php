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
        $css .= "}\n\n";

        $css .= "body {\n";
        $css .= "  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n";
        $css .= "  line-height: 1.6;\n";
        $css .= "}\n\n";

        // Default link styles (can be overridden by site/page/section CSS)
        $css .= "a {\n";
        $css .= "  color: inherit;\n";
        $css .= "  text-decoration: none;\n";
        $css .= "}\n\n";

        // Navigation Base Styles
        $css .= "/* Navigation Base Styles */\n\n";
        $css .= "nav[class*=\"navbar-\"], header[class*=\"header-\"] {\n";
        $css .= "  padding: 1rem;\n";
        $css .= "  background-color: #ffffff;\n";
        $css .= "  border-bottom: 2px solid #e5e7eb;\n";
        $css .= "}\n\n";

        $css .= ".nav-container {\n";
        $css .= "  display: flex;\n";
        $css .= "  align-items: center;\n";
        $css .= "  justify-content: space-between;\n";
        $css .= "  max-width: 1280px;\n";
        $css .= "  margin: 0 auto;\n";
        $css .= "}\n\n";

        $css .= ".logo {\n";
        $css .= "  font-size: 1.25rem;\n";
        $css .= "  font-weight: bold;\n";
        $css .= "}\n\n";

        $css .= ".nav-links {\n";
        $css .= "  display: flex;\n";
        $css .= "  gap: 1.5rem;\n";
        $css .= "  align-items: center;\n";
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
        $css .= ".row h1 {\n";
        $css .= "  font-size: 2em;\n";
        $css .= "  font-weight: bold;\n";
        $css .= "  margin: 0.67em 0;\n";
        $css .= "}\n\n";

        $css .= ".row h2 {\n";
        $css .= "  font-size: 1.5em;\n";
        $css .= "  font-weight: bold;\n";
        $css .= "  margin: 0.75em 0;\n";
        $css .= "}\n\n";

        $css .= ".row h3 {\n";
        $css .= "  font-size: 1.17em;\n";
        $css .= "  font-weight: bold;\n";
        $css .= "  margin: 1em 0;\n";
        $css .= "}\n\n";

        $css .= ".row h4 {\n";
        $css .= "  font-size: 1em;\n";
        $css .= "  font-weight: bold;\n";
        $css .= "  margin: 1.33em 0;\n";
        $css .= "}\n\n";

        $css .= ".row p {\n";
        $css .= "  margin: 1em 0;\n";
        $css .= "}\n\n";

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
        if (str_starts_with($section->type, 'navbar-') || str_starts_with($section->type, 'header-')) {
            $this->addNavigationCSS($css, $section, $sectionId, $content);
        }

        // Grid/Column styling
        if (str_starts_with($section->type, 'grid-')) {
            $this->addGridCSS($css, $section, $sectionId, $content);
        }
    }

    /**
     * Add navigation-specific CSS
     */
    protected function addNavigationCSS(string &$css, TemplateSection $section, string $sectionId, array $content): void
    {
        // Container Style
        if (isset($content['containerStyle'])) {
            $cs = $content['containerStyle'];
            $css .= "/* {$section->section_name} - Container */\n";
            $css .= "#{$sectionId} {\n";
            if (isset($cs['background'])) $css .= "  background: {$cs['background']};\n";
            if (isset($cs['paddingTop'])) $css .= "  padding-top: {$cs['paddingTop']}px;\n";
            if (isset($cs['paddingRight'])) $css .= "  padding-right: {$cs['paddingRight']}px;\n";
            if (isset($cs['paddingBottom'])) $css .= "  padding-bottom: {$cs['paddingBottom']}px;\n";
            if (isset($cs['paddingLeft'])) $css .= "  padding-left: {$cs['paddingLeft']}px;\n";
            if (isset($cs['borderWidth'])) $css .= "  border-width: {$cs['borderWidth']}px;\n";
            if (isset($cs['borderStyle']) && $cs['borderStyle'] !== 'none') $css .= "  border-style: {$cs['borderStyle']};\n";
            if (isset($cs['borderColor'])) $css .= "  border-color: {$cs['borderColor']};\n";
            if (isset($cs['borderRadius'])) $css .= "  border-radius: {$cs['borderRadius']}px;\n";
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
     * Generate HTML file for a page
     */
    protected function generatePageHTML(Template $template, TemplatePage $page, string $templatePath): void
    {
        $filename = $page->is_homepage ? 'index.html' : $page->slug . '.html';
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

        // Add mobile menu toggle script
        $html .= "<script>\n";
        $html .= "function toggleMobileMenu(sectionId) {\n";
        $html .= "  const menu = document.getElementById('mobile-menu-' + sectionId);\n";
        $html .= "  if (menu) {\n";
        $html .= "    menu.classList.toggle('active');\n";
        $html .= "  }\n";
        $html .= "}\n";
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
        if (str_starts_with($section->type, 'navbar-') || str_starts_with($section->type, 'header-')) {
            return $this->buildNavigationHTML($section, $sectionId, $content);
        }

        // Grid sections
        if (str_starts_with($section->type, 'grid-')) {
            return $this->buildGridHTML($section, $sectionId, $content);
        }

        // Default section
        return "<section id=\"{$sectionId}\" class=\"{$section->type}\">\n  <!-- {$section->type} -->\n</section>";
    }

    /**
     * Build navigation/header HTML
     */
    protected function buildNavigationHTML(TemplateSection $section, string $sectionId, array $content): string
    {
        $tag = str_starts_with($section->type, 'navbar-') ? 'nav' : 'header';
        $html = "<{$tag} id=\"{$sectionId}\" class=\"{$section->type}\">\n";
        $html .= "  <div class=\"nav-container\">\n";
        $html .= "    <div class=\"logo\">" . ($content['logo'] ?? 'Logo') . "</div>\n";

        $links = $content['links'] ?? [];
        if (count($links) > 0) {
            // Desktop menu
            $html .= "    <div class=\"nav-links desktop-menu\">\n";
            foreach ($links as $link) {
                $label = is_array($link) ? ($link['label'] ?? 'Link') : $link;
                $href = is_array($link) && isset($link['url']) ? $link['url'] : '#';
                $html .= "      <a href=\"{$href}\">{$label}</a>\n";
            }
            $html .= "    </div>\n";

            // Mobile menu button
            $html .= "    <button class=\"mobile-menu-btn\" onclick=\"toggleMobileMenu('{$sectionId}')\" aria-label=\"Toggle menu\">\n";
            $html .= "      <svg class=\"menu-icon\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n";
            $html .= "        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 6h16M4 12h16M4 18h16\"></path>\n";
            $html .= "      </svg>\n";
            $html .= "    </button>\n";
            $html .= "  </div>\n";

            // Mobile menu panel
            $html .= "  <div class=\"mobile-menu\" id=\"mobile-menu-{$sectionId}\">\n";
            foreach ($links as $link) {
                $label = is_array($link) ? ($link['label'] ?? 'Link') : $link;
                $href = is_array($link) && isset($link['url']) ? $link['url'] : '#';
                $html .= "    <a href=\"{$href}\">{$label}</a>\n";
            }
            $html .= "  </div>\n";
        } else {
            $html .= "  </div>\n";
        }

        $html .= "</{$tag}>";
        return $html;
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
