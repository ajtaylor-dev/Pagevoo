<?php

namespace App\Services;

/**
 * Trait for rendering sections to HTML
 * Shared between TemplateFileGenerator and WebsiteFileService
 */
trait SectionRendererTrait
{
    /**
     * Build HTML for a single section based on type
     */
    protected function buildSectionHTML($section, ?string $sectionId = null, ?array $content = null): string
    {
        // Handle both TemplateSection objects and arrays
        if (is_array($section)) {
            $sectionId = $sectionId ?? ($section['section_id'] ?? "section-" . ($section['id'] ?? uniqid()));
            $rawContent = $content ?? ($section['content'] ?? []);
            $type = $section['type'] ?? 'unknown';
        } else {
            $sectionId = $sectionId ?? ($section->section_id ?? "section-{$section->id}");
            $rawContent = $content ?? ($section->content ?? []);
            $type = $section->type ?? 'unknown';
        }

        // Ensure content is an array (decode JSON if string)
        if (is_string($rawContent)) {
            $content = json_decode($rawContent, true) ?? [];
        } else {
            $content = $rawContent ?? [];
        }

        // Navigation/Header sections
        if ($type === 'navbar' || str_starts_with($type, 'navbar-') || str_starts_with($type, 'header-')) {
            return $this->buildNavigationHTML($type, $sectionId, $content);
        }

        // Grid sections
        if (str_starts_with($type, 'grid-')) {
            return $this->buildGridHTML($type, $sectionId, $content);
        }

        // Footer sections
        if (str_starts_with($type, 'footer-')) {
            return $this->buildFooterHTML($type, $sectionId, $content);
        }

        // Default section
        return "<section id=\"{$sectionId}\" class=\"{$type}\">\n  <!-- {$type} -->\n</section>";
    }

    /**
     * Build navigation/header HTML - minimal inline styles, use CSS for styling
     */
    protected function buildNavigationHTML(string $type, string $sectionId, $content): string
    {
        // Ensure content is an array
        if (!is_array($content)) {
            $content = is_string($content) ? (json_decode($content, true) ?? []) : [];
        }

        \Log::info("Building navigation HTML for {$sectionId}", ['content' => $content]);

        $logo = $content['logo'] ?? 'Logo';
        $links = $content['links'] ?? [];

        $html = "<nav id=\"{$sectionId}\" class=\"navbar\">\n";
        $html .= "  <div class=\"nav-container\">\n";
        $html .= "    <div class=\"nav-logo\">{$logo}</div>\n";
        $html .= "    <div class=\"nav-links desktop-menu\">\n";

        foreach ($links as $link) {
            $linkLabel = is_string($link) ? $link : ($link['label'] ?? 'Link');
            $linkUrl = is_string($link) ? '#' : ($link['url'] ?? '#');
            $hasSubItems = is_array($link) && isset($link['subItems']) && !empty($link['subItems']);

            if ($hasSubItems) {
                // Dropdown link
                $html .= "      <div class=\"nav-dropdown\">\n";
                $html .= "        <a href=\"{$linkUrl}\" class=\"dropdown-toggle\">{$linkLabel}</a>\n";
                $html .= "        <div class=\"dropdown-menu\">\n";
                foreach ($link['subItems'] as $subItem) {
                    $subLabel = is_string($subItem) ? $subItem : ($subItem['label'] ?? 'Link');
                    $subUrl = is_string($subItem) ? '#' : ($subItem['url'] ?? '#');
                    $html .= "          <a href=\"{$subUrl}\" class=\"dropdown-item\">{$subLabel}</a>\n";
                }
                $html .= "        </div>\n";
                $html .= "      </div>\n";
            } else {
                // Regular link
                $html .= "      <a href=\"{$linkUrl}\" class=\"nav-link\">{$linkLabel}</a>\n";
            }
        }

        $html .= "    </div>\n";

        // Mobile menu button
        $html .= "    <button class=\"mobile-menu-btn\" onclick=\"toggleMobileMenu('{$sectionId}')\" aria-label=\"Toggle menu\">\n";
        $html .= "      <svg class=\"menu-icon\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n";
        $html .= "        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 6h16M4 12h16M4 18h16\" />\n";
        $html .= "      </svg>\n";
        $html .= "    </button>\n";
        $html .= "  </div>\n";

        // Mobile menu (hidden by default)
        $html .= "  <div class=\"mobile-menu\" id=\"mobile-menu-{$sectionId}\">\n";
        foreach ($links as $link) {
            $linkLabel = is_string($link) ? $link : ($link['label'] ?? 'Link');
            $linkUrl = is_string($link) ? '#' : ($link['url'] ?? '#');
            $hasSubItems = is_array($link) && isset($link['subItems']) && !empty($link['subItems']);

            if ($hasSubItems) {
                $html .= "    <div class=\"mobile-dropdown\">\n";
                $html .= "      <button class=\"mobile-dropdown-toggle\" onclick=\"toggleMobileDropdown(this)\">{$linkLabel}</button>\n";
                $html .= "      <div class=\"mobile-dropdown-menu\">\n";
                foreach ($link['subItems'] as $subItem) {
                    $subLabel = is_string($subItem) ? $subItem : ($subItem['label'] ?? 'Link');
                    $subUrl = is_string($subItem) ? '#' : ($subItem['url'] ?? '#');
                    $html .= "        <a href=\"{$subUrl}\">{$subLabel}</a>\n";
                }
                $html .= "      </div>\n";
                $html .= "    </div>\n";
            } else {
                $html .= "    <a href=\"{$linkUrl}\">{$linkLabel}</a>\n";
            }
        }
        $html .= "  </div>\n";
        $html .= "</nav>";

        return $html;
    }

    /**
     * Build grid section HTML - matches React GridSection output exactly
     */
    protected function buildGridHTML(string $type, string $sectionId, $content): string
    {
        // Ensure content is an array
        if (!is_array($content)) {
            $content = is_string($content) ? (json_decode($content, true) ?? []) : [];
        }

        // Match React GridSection structure exactly
        $html = "<div id=\"{$sectionId}\">\n";
        $html .= "  <div class=\"row\">\n";

        // Render grid columns using col-{width} classes like React does
        $columns = is_array($content['columns'] ?? null) ? $content['columns'] : [];
        foreach ($columns as $column) {
            if (is_array($column)) {
                $colWidth = $column['colWidth'] ?? 12;
                $columnContent = $column['content'] ?? '';

                $html .= "    <div class=\"col-{$colWidth}\">\n";
                $html .= "      <div>{$columnContent}</div>\n";
                $html .= "    </div>\n";
            }
        }

        $html .= "  </div>\n";
        $html .= "</div>";

        return $html;
    }

    /**
     * Build footer section HTML - minimal inline styles, use CSS for styling
     */
    protected function buildFooterHTML(string $type, string $sectionId, $content): string
    {
        // Ensure content is an array
        if (!is_array($content)) {
            $content = is_string($content) ? (json_decode($content, true) ?? []) : [];
        }

        // Simple footer
        if ($type === 'footer-simple') {
            $text = $content['text'] ?? '© 2025 Company Name. All rights reserved.';
            return "<footer id=\"{$sectionId}\" class=\"footer-simple\">\n  <p>{$text}</p>\n</footer>";
        }

        // Column footer
        if ($type === 'footer-columns') {
            $columns = is_array($content['columns'] ?? null) ? $content['columns'] : [];
            $copyrightText = $content['copyrightText'] ?? '© 2025 Company Name. All rights reserved.';

            $html = "<footer id=\"{$sectionId}\" class=\"footer-columns\">\n";
            $html .= "  <div class=\"footer-grid\">\n";

            foreach ($columns as $col) {
                $colContent = is_array($col) ? ($col['content'] ?? '<p>Column content</p>') : '<p>Column content</p>';
                $html .= "    <div class=\"footer-column\">\n";
                $html .= "      {$colContent}\n";
                $html .= "    </div>\n";
            }

            $html .= "  </div>\n";
            $html .= "  <div class=\"footer-copyright\">\n";
            $html .= "    <p>{$copyrightText}</p>\n";
            $html .= "  </div>\n";
            $html .= "</footer>";

            return $html;
        }

        // Default footer (fallback)
        return "<footer id=\"{$sectionId}\" class=\"{$type}\">\n  <!-- {$type} -->\n</footer>";
    }
}
