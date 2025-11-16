<?php

namespace App\Services\Security;

/**
 * CSS Sanitizer Service
 * Sanitizes CSS to prevent injection attacks and malicious code execution
 */
class CssSanitizer
{
    /**
     * Dangerous CSS patterns that could lead to security issues
     */
    protected array $dangerousPatterns = [
        // JavaScript execution attempts
        '/javascript:/i',
        '/expression\s*\(/i',
        '/-moz-binding/i',
        '/behavior\s*:/i',
        '/vbscript:/i',

        // Data URIs with scripts
        '/data:[^,]*script/i',
        '/data:[^,]*javascript/i',

        // File access attempts
        '/file:\/\//i',

        // IE specific vectors
        '/import\s+url\s*\(\s*["\']?javascript:/i',
        '/@import\s+["\']javascript:/i',
    ];

    /**
     * Allowed CSS properties (whitelist approach for maximum security)
     */
    protected array $allowedProperties = [
        // Layout
        'display', 'position', 'top', 'right', 'bottom', 'left', 'float', 'clear',
        'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'overflow', 'overflow-x', 'overflow-y', 'z-index',

        // Flexbox
        'flex', 'flex-direction', 'flex-wrap', 'flex-flow', 'justify-content',
        'align-items', 'align-self', 'align-content', 'order', 'flex-grow',
        'flex-shrink', 'flex-basis',

        // Grid
        'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
        'grid-template-areas', 'grid-gap', 'grid-column', 'grid-row',
        'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end',
        'gap', 'row-gap', 'column-gap',

        // Typography
        'font', 'font-family', 'font-size', 'font-weight', 'font-style',
        'line-height', 'letter-spacing', 'text-align', 'text-decoration',
        'text-transform', 'text-indent', 'text-overflow', 'white-space',
        'word-spacing', 'word-wrap', 'word-break', 'vertical-align',

        // Colors and Backgrounds
        'color', 'background', 'background-color', 'background-image',
        'background-position', 'background-size', 'background-repeat',
        'background-attachment', 'opacity',

        // Borders
        'border', 'border-width', 'border-style', 'border-color',
        'border-top', 'border-right', 'border-bottom', 'border-left',
        'border-radius', 'border-top-left-radius', 'border-top-right-radius',
        'border-bottom-left-radius', 'border-bottom-right-radius',
        'outline', 'outline-width', 'outline-style', 'outline-color',

        // Box Model
        'box-sizing', 'box-shadow',

        // Transforms and Transitions
        'transform', 'transform-origin', 'transition', 'transition-property',
        'transition-duration', 'transition-timing-function', 'transition-delay',

        // Animation
        'animation', 'animation-name', 'animation-duration', 'animation-timing-function',
        'animation-delay', 'animation-iteration-count', 'animation-direction',

        // Other
        'cursor', 'visibility', 'list-style', 'list-style-type', 'list-style-position',
        'content', 'quotes', 'counter-reset', 'counter-increment',
    ];

    /**
     * Sanitize CSS string
     *
     * @param string $css
     * @return string
     */
    public function sanitize(string $css): string
    {
        // Remove all PHP tags and potential PHP code
        $css = $this->removePHPTags($css);

        // Remove dangerous patterns
        $css = $this->removeDangerousPatterns($css);

        // Remove @import statements (can be used for attacks)
        $css = $this->removeImports($css);

        // Sanitize URLs in CSS
        $css = $this->sanitizeUrls($css);

        // Remove any remaining JavaScript protocols
        $css = $this->removeJavaScriptProtocols($css);

        // Escape special characters for safe PHP inclusion
        $css = $this->escapeForPHP($css);

        return $css;
    }

    /**
     * Remove PHP tags and potential PHP code
     */
    protected function removePHPTags(string $css): string
    {
        // Remove all PHP tags variants
        $phpPatterns = [
            '/<\?php/i',
            '/<\?=/i',
            '/<\?/i',
            '/\?>/i',
            '/<script\s+language\s*=\s*["\']?php["\']?/i',
        ];

        foreach ($phpPatterns as $pattern) {
            $css = preg_replace($pattern, '', $css);
        }

        return $css;
    }

    /**
     * Remove dangerous CSS patterns
     */
    protected function removeDangerousPatterns(string $css): string
    {
        foreach ($this->dangerousPatterns as $pattern) {
            $css = preg_replace($pattern, '', $css);
        }

        return $css;
    }

    /**
     * Remove @import statements
     */
    protected function removeImports(string $css): string
    {
        // Remove all @import rules as they can be used to load external resources
        $css = preg_replace('/@import\s+[^;]+;/i', '', $css);
        $css = preg_replace('/@import\s+url\([^)]+\)[^;]*;/i', '', $css);

        return $css;
    }

    /**
     * Sanitize URLs in CSS
     */
    protected function sanitizeUrls(string $css): string
    {
        // Find all url() occurrences
        $css = preg_replace_callback(
            '/url\s*\(\s*(["\']?)([^"\')]+)\1\s*\)/i',
            function ($matches) {
                $url = $matches[2];

                // Allow only relative URLs and data URIs for images
                if ($this->isValidUrl($url)) {
                    return "url('{$url}')";
                }

                // Remove invalid URLs
                return 'none';
            },
            $css
        );

        return $css;
    }

    /**
     * Check if URL is valid and safe
     */
    protected function isValidUrl(string $url): bool
    {
        $url = trim($url);

        // Block javascript: and other dangerous protocols
        if (preg_match('/^(javascript|vbscript|file|data):/i', $url)) {
            // Allow safe data URIs for images only
            if (preg_match('/^data:image\/(png|jpg|jpeg|gif|svg\+xml|webp);base64,/i', $url)) {
                return true;
            }
            return false;
        }

        // Allow relative URLs
        if (!preg_match('/^https?:\/\//i', $url)) {
            return true;
        }

        // Allow HTTP/HTTPS URLs to trusted domains only
        $trustedDomains = [
            'fonts.googleapis.com',
            'fonts.gstatic.com',
            'cdnjs.cloudflare.com',
            'unpkg.com',
            'cdn.jsdelivr.net',
        ];

        foreach ($trustedDomains as $domain) {
            if (strpos($url, $domain) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Remove JavaScript protocols
     */
    protected function removeJavaScriptProtocols(string $css): string
    {
        $css = preg_replace('/javascript\s*:/i', '', $css);
        $css = preg_replace('/vbscript\s*:/i', '', $css);

        return $css;
    }

    /**
     * Escape CSS for safe inclusion in PHP files
     */
    protected function escapeForPHP(string $css): string
    {
        // Escape backslashes first
        $css = str_replace('\\', '\\\\', $css);

        // Escape quotes
        $css = str_replace('"', '\\"', $css);

        // Ensure no PHP execution
        $css = str_replace('<?', '&lt;?', $css);
        $css = str_replace('?>', '?&gt;', $css);

        return $css;
    }

    /**
     * Validate CSS property (optional stricter validation)
     */
    public function isValidProperty(string $property): bool
    {
        $property = strtolower(trim($property));
        return in_array($property, $this->allowedProperties);
    }

    /**
     * Strict sanitization - only allow whitelisted properties
     */
    public function strictSanitize(string $css): string
    {
        // First do basic sanitization
        $css = $this->sanitize($css);

        // Parse and rebuild CSS with only allowed properties
        $output = '';

        // Simple CSS parser (for production, consider using a proper CSS parser library)
        preg_match_all('/([^{]+){([^}]+)}/s', $css, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $selector = trim($match[1]);
            $rules = $match[2];

            // Skip dangerous selectors
            if (strpos($selector, 'javascript') !== false ||
                strpos($selector, 'expression') !== false) {
                continue;
            }

            $validRules = [];
            $properties = explode(';', $rules);

            foreach ($properties as $property) {
                if (strpos($property, ':') !== false) {
                    list($prop, $value) = explode(':', $property, 2);
                    $prop = trim($prop);

                    if ($this->isValidProperty($prop)) {
                        $value = $this->sanitizePropertyValue($value);
                        $validRules[] = "    {$prop}: {$value}";
                    }
                }
            }

            if (!empty($validRules)) {
                $output .= "{$selector} {\n" . implode(";\n", $validRules) . ";\n}\n\n";
            }
        }

        return $output;
    }

    /**
     * Sanitize CSS property value
     */
    protected function sanitizePropertyValue(string $value): string
    {
        $value = trim($value);

        // Remove any JavaScript attempts
        if (preg_match('/javascript:|expression\(|import/i', $value)) {
            return 'inherit';
        }

        return $value;
    }
}