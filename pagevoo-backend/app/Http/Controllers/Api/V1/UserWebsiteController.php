<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Template;
use App\Models\UserWebsite;
use App\Models\UserPage;
use App\Models\UserSection;
use App\Services\WebsiteFileService;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class UserWebsiteController extends BaseController
{
    protected WebsiteFileService $fileService;
    protected PermissionService $permissionService;

    public function __construct(WebsiteFileService $fileService, PermissionService $permissionService)
    {
        $this->fileService = $fileService;
        $this->permissionService = $permissionService;
    }

    /**
     * Get user's website
     */
    public function show()
    {
        $website = UserWebsite::with(['template', 'pages.sections'])
            ->where('user_id', auth()->id())
            ->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        return $this->sendSuccess($website, 'Website retrieved successfully');
    }

    /**
     * Initialize user website from template
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

        // Check if user already has a website
        $existingWebsite = UserWebsite::where('user_id', auth()->id())->first();
        if ($existingWebsite) {
            return $this->sendError('User already has a website', 400);
        }

        try {
            DB::beginTransaction();

            // Create user website
            $userWebsite = UserWebsite::create([
                'user_id' => auth()->id(),
                'template_id' => $template->id,
            ]);

            // Copy template pages and sections
            foreach ($template->pages as $templatePage) {
                $userPage = UserPage::create([
                    'user_website_id' => $userWebsite->id,
                    'template_page_id' => $templatePage->id,
                    'name' => $templatePage->name,
                    'slug' => $templatePage->slug,
                    'is_homepage' => $templatePage->is_homepage,
                    'order' => $templatePage->order,
                ]);

                foreach ($templatePage->sections as $templateSection) {
                    UserSection::create([
                        'user_page_id' => $userPage->id,
                        'template_section_id' => $templateSection->id,
                        'type' => $templateSection->type,
                        'content' => $templateSection->content,
                        'order' => $templateSection->order,
                    ]);
                }
            }

            DB::commit();

            $userWebsite->load(['template', 'pages.sections']);

            return $this->sendSuccess($userWebsite, 'Website initialized successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to initialize website: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create a blank user website
     */
    public function createBlank()
    {
        // Check if user already has a website
        $existingWebsite = UserWebsite::where('user_id', auth()->id())->first();
        if ($existingWebsite) {
            return $this->sendError('User already has a website', 400);
        }

        try {
            DB::beginTransaction();

            // Create user website with no template
            $userWebsite = UserWebsite::create([
                'user_id' => auth()->id(),
                'template_id' => null,
            ]);

            // Create default homepage
            $userPage = UserPage::create([
                'user_website_id' => $userWebsite->id,
                'template_page_id' => null,
                'name' => 'Home',
                'slug' => 'home',
                'is_homepage' => true,
                'order' => 0,
            ]);

            // Create default hero section with basic content
            UserSection::create([
                'user_page_id' => $userPage->id,
                'template_section_id' => null,
                'type' => 'hero',
                'content' => json_encode([
                    'title' => 'Welcome to Your Website',
                    'subtitle' => 'Start building your site by adding and customizing sections',
                    'buttonText' => 'Get Started',
                    'buttonUrl' => '#',
                    'backgroundImage' => '',
                ]),
                'order' => 0,
            ]);

            DB::commit();

            $userWebsite->load(['template', 'pages.sections']);

            return $this->sendSuccess($userWebsite, 'Blank website created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to create blank website: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Save website (generates/updates preview files)
     */
    public function save(Request $request)
    {
        $website = UserWebsite::with(['pages.sections'])->where('user_id', auth()->id())->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        try {
            // Prepare website data for file generation
            $websiteData = [
                'site_css' => $request->input('site_css', ''),
                'pages' => [],
                'images' => $request->input('images', []),
            ];

            // Get all pages with their sections
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
    public function publish(Request $request)
    {
        $user = auth()->user();
        $website = UserWebsite::with(['pages.sections'])->where('user_id', $user->id)->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

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
    public function unpublish()
    {
        $website = UserWebsite::where('user_id', auth()->id())->first();

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
    public function destroy()
    {
        $website = UserWebsite::where('user_id', auth()->id())->first();

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
