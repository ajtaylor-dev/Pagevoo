<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveWebsiteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Check if user owns the website they're trying to save
        if ($this->route('id')) {
            $website = \App\Models\UserWebsite::where('id', $this->route('id'))
                ->where('user_id', auth()->id())
                ->first();

            return $website !== null;
        }

        return true; // New website creation
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|regex:/^[a-zA-Z0-9\s\-\_]+$/',
            'site_css' => 'nullable|string|max:500000', // 500KB max
            'default_title' => 'nullable|string|max:60',
            'default_meta_description' => 'nullable|string|max:160',
            'subdomain' => [
                'nullable',
                'string',
                'max:63',
                'regex:/^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?$/',
                Rule::unique('user_websites', 'subdomain')->ignore($this->route('id')),
            ],
            'custom_domain' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i',
                Rule::unique('user_websites', 'custom_domain')->ignore($this->route('id')),
            ],

            // Pages validation
            'pages' => 'required|array|min:1|max:50', // Max 50 pages
            'pages.*.id' => 'nullable|integer',
            'pages.*.name' => 'required|string|max:255',
            'pages.*.slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9\-]+$/',
            ],
            'pages.*.order' => 'required|integer|min:0|max:99',
            'pages.*.page_css' => 'nullable|string|max:100000', // 100KB max per page
            'pages.*.meta_description' => 'nullable|string|max:160',

            // Sections validation
            'pages.*.sections' => 'required|array|max:100', // Max 100 sections per page
            'pages.*.sections.*.id' => 'nullable|integer',
            'pages.*.sections.*.type' => [
                'required',
                'string',
                Rule::in([
                    // Grid layouts
                    'grid-1x1', 'grid-2x1', 'grid-3x1', 'grid-4x1', 'grid-2x2', 'grid-3x2',
                    // Navigation
                    'navbar',
                    // Footers
                    'footer-simple', 'footer-columns',
                    // Legacy/generic types (kept for backwards compatibility)
                    'hero', 'footer', 'text', 'grid',
                    'gallery', 'testimonial', 'contact', 'features',
                    'pricing', 'cta', 'team', 'faq', 'video',
                    'map', 'social', 'newsletter', 'blog', 'portfolio'
                ]),
            ],
            'pages.*.sections.*.order' => 'required|integer|min:0|max:999',
            'pages.*.sections.*.content' => 'required|array',
            'pages.*.sections.*.css' => 'nullable|array',
            'pages.*.sections.*.visibility' => 'nullable|in:desktop,mobile,both',
            'pages.*.sections.*.custom_css' => 'nullable|string|max:50000', // 50KB max per section

            // Content validation based on section type
            'pages.*.sections.*.content.title' => 'nullable|string|max:255',
            'pages.*.sections.*.content.subtitle' => 'nullable|string|max:255',
            'pages.*.sections.*.content.text' => 'nullable|string|max:10000',
            'pages.*.sections.*.content.description' => 'nullable|string|max:5000',
            'pages.*.sections.*.content.buttonText' => 'nullable|string|max:100',
            'pages.*.sections.*.content.buttonLink' => 'nullable|string|max:500|url',
            'pages.*.sections.*.content.image' => 'nullable|string|max:500',
            'pages.*.sections.*.content.alt' => 'nullable|string|max:255',

            // Grid content validation
            'pages.*.sections.*.content.columns' => 'nullable|array|max:12',
            'pages.*.sections.*.content.columns.*' => 'nullable|string|max:10000',

            // Navigation items validation
            'pages.*.sections.*.content.items' => 'nullable|array|max:20',
            'pages.*.sections.*.content.items.*.label' => 'nullable|string|max:100',
            'pages.*.sections.*.content.items.*.link' => 'nullable|string|max:500',
            'pages.*.sections.*.content.items.*.children' => 'nullable|array|max:10',

            // Images array validation
            'images' => 'nullable|array|max:100',
            'images.*.path' => 'required|string|max:500',
            'images.*.filename' => 'required|string|max:255|regex:/^[a-zA-Z0-9\-\_\.]+$/',
        ];
    }

    /**
     * Get custom error messages
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Website name is required.',
            'name.regex' => 'Website name can only contain letters, numbers, spaces, hyphens and underscores.',
            'site_css.max' => 'Site CSS is too large. Maximum size is 500KB.',
            'subdomain.regex' => 'Subdomain must be lowercase alphanumeric with hyphens, starting and ending with alphanumeric.',
            'subdomain.unique' => 'This subdomain is already taken.',
            'custom_domain.regex' => 'Invalid domain format.',
            'custom_domain.unique' => 'This domain is already registered.',
            'pages.required' => 'Website must have at least one page.',
            'pages.max' => 'Maximum 50 pages allowed.',
            'pages.*.name.required' => 'Page name is required.',
            'pages.*.slug.regex' => 'Page slug must be lowercase with hyphens only.',
            'pages.*.sections.required' => 'Each page must have at least one section.',
            'pages.*.sections.max' => 'Maximum 100 sections per page allowed.',
            'pages.*.sections.*.type.in' => 'Invalid section type.',
            'pages.*.sections.*.content.required' => 'Section content is required.',
            'images.max' => 'Maximum 100 images allowed.',
        ];
    }

    /**
     * Prepare data for validation
     */
    protected function prepareForValidation(): void
    {
        // Sanitize subdomain
        if ($this->has('subdomain')) {
            $this->merge([
                'subdomain' => strtolower(trim($this->subdomain)),
            ]);
        }

        // Sanitize custom domain
        if ($this->has('custom_domain')) {
            $this->merge([
                'custom_domain' => strtolower(trim($this->custom_domain)),
            ]);
        }

        // Sanitize page slugs
        if ($this->has('pages')) {
            $pages = $this->pages;
            foreach ($pages as &$page) {
                if (isset($page['slug'])) {
                    $page['slug'] = strtolower(trim($page['slug']));
                }
            }
            $this->merge(['pages' => $pages]);
        }
    }

    /**
     * Additional validation after rules pass
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Check for duplicate page slugs
            if ($this->has('pages')) {
                $slugs = collect($this->pages)->pluck('slug')->filter();
                if ($slugs->count() !== $slugs->unique()->count()) {
                    $validator->errors()->add('pages', 'Each page must have a unique slug.');
                }
            }

            // Check total size of all CSS combined
            $totalCssSize = 0;
            $totalCssSize += strlen($this->site_css ?? '');

            if ($this->has('pages')) {
                foreach ($this->pages as $page) {
                    $totalCssSize += strlen($page['page_css'] ?? '');
                    foreach ($page['sections'] ?? [] as $section) {
                        $totalCssSize += strlen($section['custom_css'] ?? '');
                    }
                }
            }

            // Max 2MB total CSS
            if ($totalCssSize > 2097152) {
                $validator->errors()->add('css', 'Total CSS size exceeds 2MB limit.');
            }

            // Check user's storage quota
            $user = auth()->user();
            $storageLimit = $this->getUserStorageLimit($user);
            $currentUsage = $this->getUserStorageUsage($user);

            if ($currentUsage + ($totalCssSize / 1048576) > $storageLimit) {
                $validator->errors()->add('storage', 'Storage limit exceeded for your plan.');
            }
        });
    }

    /**
     * Get user's storage limit based on tier
     */
    protected function getUserStorageLimit($user): float
    {
        $tierLimits = [
            'trial' => 10, // 10MB
            'brochure' => 100, // 100MB
            'niche' => 500, // 500MB
            'pro' => 2000, // 2GB
        ];

        return $tierLimits[$user->tier ?? 'trial'];
    }

    /**
     * Get user's current storage usage
     */
    protected function getUserStorageUsage($user): float
    {
        // This would calculate actual storage usage
        // For now, return a placeholder
        return 0;
    }
}