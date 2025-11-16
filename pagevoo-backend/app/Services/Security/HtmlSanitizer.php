<?php

namespace App\Services\Security;

/**
 * HTML Sanitizer Service
 * Sanitizes HTML content to prevent XSS attacks
 */
class HtmlSanitizer
{
    /**
     * Allowed HTML tags for rich content
     */
    protected array $allowedTags = [
        // Text formatting
        'p', 'br', 'span', 'div', 'strong', 'b', 'em', 'i', 'u', 'strike', 's',
        'sub', 'sup', 'mark', 'small', 'del', 'ins', 'code', 'pre', 'blockquote',

        // Headings
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',

        // Lists
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',

        // Links (with restricted attributes)
        'a',

        // Images (with restricted attributes)
        'img',

        // Tables
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',

        // Semantic HTML5
        'section', 'article', 'aside', 'nav', 'header', 'footer', 'main',
        'figure', 'figcaption', 'time', 'address',

        // Forms (limited)
        'form', 'input', 'textarea', 'select', 'option', 'label', 'button',
    ];

    /**
     * Allowed attributes for specific tags
     */
    protected array $allowedAttributes = [
        'a' => ['href', 'title', 'target', 'rel'],
        'img' => ['src', 'alt', 'title', 'width', 'height', 'loading'],
        'div' => ['class', 'id', 'style'],
        'span' => ['class', 'id', 'style'],
        'p' => ['class', 'id', 'style'],
        'section' => ['class', 'id', 'style'],
        'article' => ['class', 'id', 'style'],
        'h1' => ['class', 'id', 'style'],
        'h2' => ['class', 'id', 'style'],
        'h3' => ['class', 'id', 'style'],
        'h4' => ['class', 'id', 'style'],
        'h5' => ['class', 'id', 'style'],
        'h6' => ['class', 'id', 'style'],
        'table' => ['class', 'id', 'style'],
        'form' => ['action', 'method', 'class', 'id'],
        'input' => ['type', 'name', 'value', 'placeholder', 'class', 'id', 'required'],
        'button' => ['type', 'class', 'id', 'onclick'],
        'time' => ['datetime'],
    ];

    /**
     * Dangerous protocols to filter
     */
    protected array $dangerousProtocols = [
        'javascript:', 'vbscript:', 'data:text/html', 'data:text/javascript',
        'data:text/vbscript', 'about:', 'chrome:', 'ms-its:', 'mhtml:', 'file:',
        'jar:', 'resource:', 'x-javascript:', 'mocha:', 'livescript:',
    ];

    /**
     * Sanitize HTML content
     *
     * @param string $html
     * @param bool $allowRichContent
     * @return string
     */
    public function sanitize(string $html, bool $allowRichContent = true): string
    {
        if (!$allowRichContent) {
            // Strip all HTML for plain text
            return htmlspecialchars($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        // Use DOMDocument for parsing
        $dom = new \DOMDocument();

        // Suppress warnings for malformed HTML
        libxml_use_internal_errors(true);

        // Load HTML with UTF-8 encoding
        $html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
        $dom->loadHTML("<html><body>{$html}</body></html>", LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);

        // Clear errors
        libxml_clear_errors();

        // Sanitize the DOM tree
        $this->sanitizeNode($dom->documentElement);

        // Get the cleaned HTML
        $body = $dom->getElementsByTagName('body')->item(0);
        $cleanHtml = '';

        if ($body) {
            foreach ($body->childNodes as $child) {
                $cleanHtml .= $dom->saveHTML($child);
            }
        }

        return $cleanHtml;
    }

    /**
     * Recursively sanitize DOM nodes
     *
     * @param \DOMNode $node
     */
    protected function sanitizeNode(\DOMNode $node): void
    {
        // Process child nodes first (before potentially removing parent)
        $childNodes = [];
        foreach ($node->childNodes as $child) {
            $childNodes[] = $child;
        }

        foreach ($childNodes as $child) {
            if ($child instanceof \DOMElement) {
                $this->sanitizeElement($child);
            } elseif ($child instanceof \DOMText) {
                // Text nodes are safe
                continue;
            } elseif ($child instanceof \DOMComment) {
                // Remove comments
                $child->parentNode->removeChild($child);
            }
        }
    }

    /**
     * Sanitize a DOM element
     *
     * @param \DOMElement $element
     */
    protected function sanitizeElement(\DOMElement $element): void
    {
        $tagName = strtolower($element->tagName);

        // Remove disallowed tags
        if (!in_array($tagName, $this->allowedTags)) {
            // Remove the element but keep its children
            while ($element->firstChild) {
                $element->parentNode->insertBefore($element->firstChild, $element);
            }
            $element->parentNode->removeChild($element);
            return;
        }

        // Sanitize attributes
        $this->sanitizeAttributes($element);

        // Special handling for specific tags
        switch ($tagName) {
            case 'a':
                $this->sanitizeLink($element);
                break;
            case 'img':
                $this->sanitizeImage($element);
                break;
            case 'form':
                $this->sanitizeForm($element);
                break;
        }

        // Recursively sanitize children
        $this->sanitizeNode($element);
    }

    /**
     * Sanitize element attributes
     *
     * @param \DOMElement $element
     */
    protected function sanitizeAttributes(\DOMElement $element): void
    {
        $tagName = strtolower($element->tagName);
        $allowedAttrs = $this->allowedAttributes[$tagName] ?? [];

        // Global attributes allowed on all elements
        $globalAttrs = ['class', 'id'];
        $allowedAttrs = array_merge($allowedAttrs, $globalAttrs);

        $attributes = [];
        foreach ($element->attributes as $attr) {
            $attributes[] = $attr;
        }

        foreach ($attributes as $attr) {
            $attrName = strtolower($attr->name);
            $attrValue = $attr->value;

            // Remove disallowed attributes
            if (!in_array($attrName, $allowedAttrs)) {
                $element->removeAttribute($attr->name);
                continue;
            }

            // Sanitize specific attributes
            switch ($attrName) {
                case 'href':
                case 'src':
                case 'action':
                    if ($this->isDangerousUrl($attrValue)) {
                        $element->removeAttribute($attr->name);
                    }
                    break;

                case 'style':
                    $attrValue = $this->sanitizeInlineStyle($attrValue);
                    $element->setAttribute($attr->name, $attrValue);
                    break;

                case 'class':
                case 'id':
                    // Sanitize to prevent injection
                    $attrValue = preg_replace('/[^a-zA-Z0-9\-_\s]/', '', $attrValue);
                    $element->setAttribute($attr->name, $attrValue);
                    break;

                case 'onclick':
                case 'onload':
                case 'onerror':
                case 'onmouseover':
                case 'onmouseout':
                    // Remove all event handlers
                    $element->removeAttribute($attr->name);
                    break;
            }
        }
    }

    /**
     * Check if URL contains dangerous protocols
     *
     * @param string $url
     * @return bool
     */
    protected function isDangerousUrl(string $url): bool
    {
        $url = trim($url);

        foreach ($this->dangerousProtocols as $protocol) {
            if (stripos($url, $protocol) === 0) {
                return true;
            }
        }

        // Check for encoded protocols
        $decodedUrl = html_entity_decode($url, ENT_QUOTES | ENT_HTML5);
        $decodedUrl = urldecode($decodedUrl);

        foreach ($this->dangerousProtocols as $protocol) {
            if (stripos($decodedUrl, $protocol) === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Sanitize inline styles
     *
     * @param string $style
     * @return string
     */
    protected function sanitizeInlineStyle(string $style): string
    {
        // Remove JavaScript in styles
        $style = preg_replace('/javascript:/i', '', $style);
        $style = preg_replace('/expression\s*\(/i', '', $style);
        $style = preg_replace('/@import/i', '', $style);

        // Remove dangerous CSS properties
        $style = preg_replace('/behavior\s*:/i', '', $style);
        $style = preg_replace('/-moz-binding\s*:/i', '', $style);

        return $style;
    }

    /**
     * Sanitize link elements
     *
     * @param \DOMElement $element
     */
    protected function sanitizeLink(\DOMElement $element): void
    {
        $href = $element->getAttribute('href');

        // Ensure rel="noopener noreferrer" for external links
        if ($href && strpos($href, 'http') === 0) {
            $element->setAttribute('rel', 'noopener noreferrer');
        }

        // Ensure target="_blank" has rel attribute
        if ($element->getAttribute('target') === '_blank') {
            $rel = $element->getAttribute('rel');
            if (!strpos($rel, 'noopener') !== false) {
                $rel .= ' noopener noreferrer';
                $element->setAttribute('rel', trim($rel));
            }
        }
    }

    /**
     * Sanitize image elements
     *
     * @param \DOMElement $element
     */
    protected function sanitizeImage(\DOMElement $element): void
    {
        $src = $element->getAttribute('src');

        // Remove if no src
        if (empty($src)) {
            $element->parentNode->removeChild($element);
            return;
        }

        // Validate image source
        if ($this->isDangerousUrl($src)) {
            $element->parentNode->removeChild($element);
            return;
        }

        // Add loading="lazy" by default for performance
        if (!$element->hasAttribute('loading')) {
            $element->setAttribute('loading', 'lazy');
        }
    }

    /**
     * Sanitize form elements
     *
     * @param \DOMElement $element
     */
    protected function sanitizeForm(\DOMElement $element): void
    {
        $action = $element->getAttribute('action');

        // Remove forms with dangerous actions
        if ($action && $this->isDangerousUrl($action)) {
            $element->parentNode->removeChild($element);
            return;
        }

        // Ensure method is safe
        $method = strtolower($element->getAttribute('method'));
        if (!in_array($method, ['get', 'post'])) {
            $element->setAttribute('method', 'post');
        }
    }

    /**
     * Sanitize for plain text output
     *
     * @param string $text
     * @return string
     */
    public function sanitizePlainText(string $text): string
    {
        return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}