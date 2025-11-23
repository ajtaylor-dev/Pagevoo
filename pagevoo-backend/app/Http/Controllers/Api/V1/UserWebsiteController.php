<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Template;
use App\Models\UserWebsite;
use App\Models\UserPage;
use App\Models\UserSection;
use App\Models\DatabaseInstance;
use App\Services\WebsiteFileService;
use App\Services\PermissionService;
use App\Services\DatabaseManager;
use App\Services\Security\CssSanitizer;
use App\Services\Security\HtmlSanitizer;
use App\Http\Requests\SaveWebsiteRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class UserWebsiteController extends BaseController
{
    protected WebsiteFileService $fileService;
    protected PermissionService $permissionService;
    protected DatabaseManager $databaseManager;

    public function __construct(
        WebsiteFileService $fileService,
        PermissionService $permissionService,
        DatabaseManager $databaseManager
    ) {
        $this->fileService = $fileService;
        $this->permissionService = $permissionService;
        $this->databaseManager = $databaseManager;
    }

    /**
     * Get all user's websites
     */
    public function index()
    {
        $websites = UserWebsite::with(['template', 'pages.sections'])
            ->where('user_id', auth()->id())
            ->orderBy('updated_at', 'desc')
            ->get();

        return $this->sendSuccess($websites, 'Websites retrieved successfully');
    }

    /**
     * Get a specific user website
     */
    public function show($id)
    {
        $website = UserWebsite::with(['template', 'pages.sections'])
            ->where('user_id', auth()->id())
            ->where('id', $id)
            ->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        return $this->sendSuccess($website, 'Website retrieved successfully');
    }

    /**
     * Get template structure for initialization (does NOT save to database)
     */
    public function initializeFromTemplate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'template_id' => 'required|exists:templates,id',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $template = Template::with(['pages.sections'])->find($request->template_id);

        if (!$template->is_active) {
            return $this->sendError('Template is not active', 400);
        }

        // Build website structure from template WITHOUT saving to database
        $websiteStructure = [
            'id' => null, // No ID until first save
            'user_id' => auth()->id(),
            'template_id' => $template->id,
            'template' => [
                'id' => $template->id,
                'name' => $template->name,
                'description' => $template->description,
            ],
            'is_published' => false,
            'pages' => [],
        ];

        // Copy template pages and sections structure
        foreach ($template->pages as $templatePage) {
            $pageStructure = [
                'id' => null, // No ID until first save
                'user_website_id' => null,
                'template_page_id' => $templatePage->id,
                'name' => $templatePage->name,
                'slug' => $templatePage->slug,
                'is_homepage' => $templatePage->is_homepage,
                'order' => $templatePage->order,
                'sections' => [],
            ];

            foreach ($templatePage->sections as $templateSection) {
                $pageStructure['sections'][] = [
                    'id' => null, // No ID until first save
                    'user_page_id' => null,
                    'template_section_id' => $templateSection->id,
                    'type' => $templateSection->type,
                    'content' => $templateSection->content,
                    'order' => $templateSection->order,
                ];
            }

            $websiteStructure['pages'][] = $pageStructure;
        }

        return $this->sendSuccess($websiteStructure, 'Template structure retrieved successfully');
    }

    /**
     * Get blank website structure (does NOT save to database)
     */
    public function createBlank()
    {
        // Build blank website structure WITHOUT saving to database
        $websiteStructure = [
            'id' => null, // No ID until first save
            'user_id' => auth()->id(),
            'template_id' => null,
            'template' => null,
            'is_published' => false,
            'pages' => [
                [
                    'id' => null, // No ID until first save
                    'user_website_id' => null,
                    'template_page_id' => null,
                    'name' => 'Home',
                    'slug' => 'home',
                    'is_homepage' => true,
                    'order' => 0,
                    'sections' => [], // No default sections - user starts with a blank page
                ],
            ],
        ];

        return $this->sendSuccess($websiteStructure, 'Blank website structure retrieved successfully');
    }

    /**
     * Save website (generates/updates preview files)
     * Handles both first-time save (create) and subsequent saves (update)
     */
    public function save(SaveWebsiteRequest $request, $id = null)
    {
        // The validation is already done by SaveWebsiteRequest

        // If ID is provided, update that website, otherwise get the current one from request
        $websiteId = $id ?? $request->input('id');

        // Check if this is a first save (no website ID)
        $isFirstSave = empty($websiteId) || $websiteId === 'null' || $websiteId === null;

        if ($isFirstSave) {
            // First save - create new website
            $website = new UserWebsite();
            $website->user_id = auth()->id();
            $website->template_id = $request->input('template_id');
        } else {
            // Update existing website
            $website = UserWebsite::with(['pages.sections'])
                ->where('user_id', auth()->id())
                ->where('id', $websiteId)
                ->first();

            if (!$website) {
                return $this->sendError('Website not found', 404);
            }
        }

        // Initialize sanitizers
        $cssSanitizer = new CssSanitizer();
        $htmlSanitizer = new HtmlSanitizer();

        try {
            \Log::info('Save website request data:', [
                'website_id' => $websiteId,
                'user_id' => auth()->id(),
                'name' => $request->input('name')
            ]);

            // Update website fields with sanitized data
            if ($request->has('name')) {
                $website->name = $htmlSanitizer->sanitizePlainText($request->input('name'));
            }
            if ($request->has('site_css')) {
                // Sanitize CSS before saving
                $siteCss = $request->input('site_css');
                // Ensure site_css is a string (handle null, empty, or array cases)
                if (is_array($siteCss)) {
                    $siteCss = ''; // Default to empty string if array
                } elseif (is_null($siteCss)) {
                    $siteCss = '';
                } else {
                    $siteCss = (string) $siteCss;
                }
                $website->site_css = $cssSanitizer->sanitize($siteCss);
            }
            if ($request->has('default_title')) {
                $website->default_title = $htmlSanitizer->sanitizePlainText($request->input('default_title'));
            }
            if ($request->has('default_description')) {
                $website->default_description = $htmlSanitizer->sanitizePlainText($request->input('default_description'));
            }
            $website->save();

            // Update pages and sections from request
            if ($request->has('pages')) {
                $pagesData = $request->input('pages');

                foreach ($pagesData as $pageData) {
                    // Check if page has ID and exists
                    $pageId = $pageData['id'] ?? null;
                    $page = null;

                    if ($pageId && !$isFirstSave) {
                        $page = $website->pages()->find($pageId);
                    }

                    if ($page) {
                        // Update existing page
                        $page->update([
                            'name' => $pageData['name'],
                            'slug' => $pageData['slug'],
                            'is_homepage' => $pageData['is_homepage'] ?? false,
                            'order' => $pageData['order'],
                            'meta_description' => $pageData['meta_description'] ?? '',
                            'page_css' => $pageData['page_css'] ?? '',
                        ]);

                        // Update sections for this page
                        if (isset($pageData['sections'])) {
                            // Get existing section IDs
                            $existingSectionIds = $page->sections->pluck('id')->toArray();
                            $updatedSectionIds = [];

                            foreach ($pageData['sections'] as $sectionData) {
                                \Log::info('Processing section:', ['section_data' => $sectionData]);

                                // Ensure content and css are arrays
                                $content = $sectionData['content'] ?? [];
                                $css = $sectionData['css'] ?? [];

                                // If they're strings, try to decode them
                                if (is_string($content)) {
                                    $content = json_decode($content, true) ?? [];
                                }
                                if (is_string($css)) {
                                    $css = json_decode($css, true) ?? [];
                                }

                                if (isset($sectionData['id']) && in_array($sectionData['id'], $existingSectionIds)) {
                                    // Update existing section
                                    $section = $page->sections()->find($sectionData['id']);
                                    if ($section) {
                                        $section->update([
                                            'section_id' => $sectionData['section_id'] ?? $section->section_id,
                                            'section_name' => $sectionData['section_name'] ?? ($sectionData['type'] ?? 'section'),
                                            'type' => $sectionData['type'] ?? $section->type,
                                            'content' => $content,
                                            'css' => $css,
                                            'order' => $sectionData['order'] ?? $section->order,
                                        ]);
                                        $updatedSectionIds[] = $section->id;
                                    }
                                } else {
                                    // Create new section
                                    $section = $page->sections()->create([
                                        'section_id' => $sectionData['section_id'] ?? 'section-' . uniqid(),
                                        'section_name' => $sectionData['section_name'] ?? ($sectionData['type'] ?? 'section'),
                                        'type' => $sectionData['type'] ?? 'unknown',
                                        'content' => $content,
                                        'css' => $css,
                                        'order' => $sectionData['order'] ?? 0,
                                    ]);
                                    $updatedSectionIds[] = $section->id;
                                }
                            }

                            // Delete sections that are no longer present
                            $page->sections()->whereNotIn('id', $updatedSectionIds)->delete();
                        }
                    } else {
                        // Create new page (first save)
                        $page = $website->pages()->create([
                            'template_page_id' => $pageData['template_page_id'] ?? null,
                            'name' => $pageData['name'],
                            'slug' => $pageData['slug'],
                            'is_homepage' => $pageData['is_homepage'] ?? false,
                            'order' => $pageData['order'],
                            'meta_description' => $pageData['meta_description'] ?? '',
                            'page_css' => $pageData['page_css'] ?? '',
                        ]);

                        // Create sections for this new page
                        if (isset($pageData['sections'])) {
                            foreach ($pageData['sections'] as $sectionData) {
                                // Ensure content and css are arrays
                                $content = $sectionData['content'] ?? [];
                                $css = $sectionData['css'] ?? [];

                                // If they're strings, try to decode them
                                if (is_string($content)) {
                                    $content = json_decode($content, true) ?? [];
                                }
                                if (is_string($css)) {
                                    $css = json_decode($css, true) ?? [];
                                }

                                $page->sections()->create([
                                    'template_section_id' => $sectionData['template_section_id'] ?? null,
                                    'section_id' => $sectionData['section_id'] ?? 'section-' . uniqid(),
                                    'section_name' => $sectionData['section_name'] ?? ($sectionData['type'] ?? 'section'),
                                    'type' => $sectionData['type'] ?? 'unknown',
                                    'content' => $content,
                                    'css' => $css,
                                    'order' => $sectionData['order'] ?? 0,
                                ]);
                            }
                        }
                    }
                }
            }

            // Prepare website data for file generation
            $websiteData = [
                'site_css' => $request->input('site_css', ''),
                'pages' => [],
                'images' => $request->input('images', []),
            ];

            // Reload website to get updated data
            $website->load(['pages.sections']);

            // Get all pages with their sections for file generation
            foreach ($website->pages as $page) {
                $websiteData['pages'][] = [
                    'name' => $page->name,
                    'slug' => $page->slug,
                    'page_css' => $page->page_css ?? '',
                    'sections' => $page->sections->toArray(),
                ];
            }

            // Generate preview files
            $this->fileService->generatePreviewFiles($website, $websiteData);

            return $this->sendSuccess([
                'website' => $website,
                'preview_url' => $website->getPreviewUrl(),
            ], 'Website saved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to save website: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Publish website (requires permission & domain configuration)
     */
    public function publish(Request $request, $id = null)
    {
        $user = auth()->user();
        $websiteId = $id ?? $request->input('id');

        $website = UserWebsite::with(['pages.sections'])
            ->where('user_id', $user->id)
            ->where('id', $websiteId)
            ->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        // Unpublish any other published websites for this user
        UserWebsite::where('user_id', $user->id)
            ->where('id', '!=', $website->id)
            ->where('is_published', true)
            ->update(['is_published' => false]);

        // Check permission
        if (!$this->permissionService->canPublish($user)) {
            $requiredTier = $this->permissionService->getRequiredTierForFeature('publish_website');
            return $this->sendError(
                "Publishing requires a {$requiredTier} account or higher. Please upgrade to publish your website.",
                403,
                [
                    'current_tier' => $user->getAccountTier(),
                    'required_tier' => $requiredTier,
                ]
            );
        }

        // Check if subdomain or custom domain is configured
        if (!$website->hasDomain()) {
            return $this->sendError(
                'Please configure a subdomain or custom domain before publishing.',
                400,
                ['requires' => 'subdomain or custom_domain']
            );
        }

        try {
            // Prepare website data
            $websiteData = [
                'site_css' => $request->input('site_css', ''),
                'pages' => [],
                'images' => $request->input('images', []),
            ];

            foreach ($website->pages as $page) {
                $websiteData['pages'][] = [
                    'name' => $page->name,
                    'slug' => $page->slug,
                    'page_css' => $page->page_css ?? '',
                    'sections' => $page->sections->toArray(),
                ];
            }

            // Generate published files
            $this->fileService->generatePublishedFiles($website, $websiteData);

            return $this->sendSuccess([
                'website' => $website->fresh(),
                'published_url' => $website->getPublishedUrl(),
                'published_at' => $website->last_published_at,
            ], 'Website published successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to publish website: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Unpublish website (removes from production)
     */
    public function unpublish($id)
    {
        $website = UserWebsite::where('user_id', auth()->id())
            ->where('id', $id)
            ->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        if (!$website->is_published) {
            return $this->sendError('Website is not currently published', 400);
        }

        try {
            $this->fileService->unpublish($website);

            return $this->sendSuccess([
                'website' => $website->fresh(),
                'preview_url' => $website->getPreviewUrl(),
            ], 'Website unpublished successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to unpublish website: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get preview URL
     */
    public function getPreviewUrl()
    {
        $website = UserWebsite::where('user_id', auth()->id())->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        $previewUrl = $website->getPreviewUrl();

        if (!$previewUrl) {
            return $this->sendError('Preview not available. Please save your website first.', 400);
        }

        return $this->sendSuccess([
            'preview_url' => $previewUrl,
            'preview_hash' => $website->preview_hash,
        ], 'Preview URL retrieved successfully');
    }

    /**
     * Get published URL
     */
    public function getPublishedUrl()
    {
        $website = UserWebsite::where('user_id', auth()->id())->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        if (!$website->is_published) {
            return $this->sendError('Website is not published', 400);
        }

        $publishedUrl = $website->getPublishedUrl();

        return $this->sendSuccess([
            'published_url' => $publishedUrl,
            'domain' => $website->getPrimaryDomain(),
            'is_custom_domain' => !empty($website->custom_domain),
        ], 'Published URL retrieved successfully');
    }

    /**
     * Get storage usage
     */
    public function getStorageUsage()
    {
        $user = auth()->user();
        $website = UserWebsite::where('user_id', $user->id)->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        $usage = $website->getStorageUsage();
        $maxStorage = $this->permissionService->getLimit($user, 'max_storage_mb');

        return $this->sendSuccess([
            'usage' => $usage,
            'limit' => $maxStorage,
            'percentage' => $maxStorage > 0 ? round(($usage['total_mb'] / $maxStorage) * 100, 1) : 0,
        ], 'Storage usage retrieved successfully');
    }

    /**
     * Configure subdomain
     */
    public function configureSubdomain(Request $request)
    {
        $user = auth()->user();
        $website = UserWebsite::where('user_id', $user->id)->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'subdomain' => 'required|string|alpha_dash|max:63|unique:user_websites,subdomain,' . $website->id,
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $website->update([
            'subdomain' => strtolower($request->subdomain),
        ]);

        return $this->sendSuccess([
            'website' => $website,
            'full_domain' => $request->subdomain . '.pagevoo.com',
        ], 'Subdomain configured successfully');
    }

    /**
     * Delete user's website
     */
    public function destroy($id)
    {
        $website = UserWebsite::where('user_id', auth()->id())
            ->where('id', $id)
            ->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        try {
            // Delete pages (cascade will delete sections)
            $website->pages()->delete();

            // Delete website
            $website->delete();

            return $this->sendSuccess(null, 'Website deleted successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to delete website: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Configure custom domain (Brochure/Niche/Pro only)
     */
    public function configureCustomDomain(Request $request)
    {
        $user = auth()->user();
        $website = UserWebsite::where('user_id', $user->id)->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        // Check permission
        if (!$this->permissionService->can($user, 'custom_domain')) {
            $requiredTier = $this->permissionService->getRequiredTierForFeature('custom_domain');
            return $this->sendError(
                "Custom domains require a {$requiredTier} account or higher.",
                403,
                [
                    'current_tier' => $user->getAccountTier(),
                    'required_tier' => $requiredTier,
                ]
            );
        }

        $validator = Validator::make($request->all(), [
            'custom_domain' => 'required|string|max:255|unique:user_websites,custom_domain,' . $website->id,
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $website->update([
            'custom_domain' => strtolower($request->custom_domain),
        ]);

        return $this->sendSuccess([
            'website' => $website,
            'custom_domain' => $request->custom_domain,
        ], 'Custom domain configured successfully');
    }
}
