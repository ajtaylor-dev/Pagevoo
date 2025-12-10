<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\UserPage;
use App\Models\UserSection;
use App\Models\DatabaseInstance;
use App\Services\SystemPageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class SystemPageController extends Controller
{
    protected SystemPageService $systemPageService;

    public function __construct(SystemPageService $systemPageService)
    {
        $this->systemPageService = $systemPageService;
    }

    /**
     * Get all system pages for the current user.
     * These are stored independently and persist regardless of website save state.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Get system pages for this user
        $systemPages = UserPage::where('user_id', $userId)
            ->where('is_system', true)
            ->with('sections')
            ->orderBy('order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $systemPages,
        ]);
    }

    /**
     * Get system pages for installed features.
     * Creates them if they don't exist but feature is installed.
     */
    public function getForInstalledFeatures(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Check what features are installed
        $databaseInstance = DatabaseInstance::where('type', 'website')
            ->where('reference_id', $userId)
            ->first();

        if (!$databaseInstance) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        $installedFeatures = $databaseInstance->getInstalledFeatures();
        $featureTypes = array_column($installedFeatures, 'type');

        // Get existing system pages
        $existingPages = UserPage::where('user_id', $userId)
            ->where('is_system', true)
            ->with('sections')
            ->get();

        $existingSystemTypes = $existingPages->pluck('system_type')->toArray();

        // Create missing system pages for installed features
        $createdPages = [];
        foreach ($featureTypes as $featureType) {
            if (!in_array($featureType, $this->systemPageService->getSupportedFeatures())) {
                continue;
            }

            $definitions = $this->systemPageService->getPageDefinitions($featureType);
            $maxOrder = UserPage::where('user_id', $userId)->max('order') ?? 0;

            foreach ($definitions as $pageDef) {
                if (in_array($pageDef['system_type'], $existingSystemTypes)) {
                    continue;
                }

                $maxOrder++;

                // Create the system page
                $page = UserPage::create([
                    'user_id' => $userId,
                    'user_website_id' => null, // Not tied to a specific website
                    'name' => $pageDef['name'],
                    'slug' => $pageDef['slug'],
                    'page_id' => 'page_' . Str::random(8),
                    'is_homepage' => false,
                    'order' => $maxOrder,
                    'is_system' => true,
                    'system_type' => $pageDef['system_type'],
                    'feature_type' => $featureType,
                ]);

                // Create sections (locked to prevent deletion, but still editable for styling)
                $sectionOrder = 0;
                foreach ($pageDef['sections'] as $sectionDef) {
                    $page->sections()->create([
                        'section_name' => $sectionDef['section_name'],
                        'section_id' => 'section_' . Str::random(8),
                        'type' => $sectionDef['type'],
                        'content' => $sectionDef['content'],
                        'css' => [],
                        'order' => $sectionOrder++,
                        'is_locked' => true,
                        'lock_type' => $sectionDef['lock_type'] ?? 'system_required',
                    ]);
                }

                $createdPages[] = $page->fresh(['sections']);
            }
        }

        // Return all system pages (existing + newly created)
        $allPages = UserPage::where('user_id', $userId)
            ->where('is_system', true)
            ->with('sections')
            ->orderBy('order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $allPages,
        ]);
    }

    /**
     * Update a system page (styling, section content, etc.)
     * This saves immediately without requiring website save.
     */
    public function update(Request $request, int $pageId): JsonResponse
    {
        $userId = $request->user()->id;

        $page = UserPage::where('id', $pageId)
            ->where('user_id', $userId)
            ->where('is_system', true)
            ->first();

        if (!$page) {
            return response()->json([
                'success' => false,
                'message' => 'System page not found',
            ], 404);
        }

        // Update page properties
        $page->update($request->only([
            'name',
            'slug',
            'meta_description',
            'page_css',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'System page updated',
            'data' => $page->fresh(['sections']),
        ]);
    }

    /**
     * Update a section within a system page.
     */
    public function updateSection(Request $request, int $pageId, int $sectionId): JsonResponse
    {
        $userId = $request->user()->id;

        $page = UserPage::where('id', $pageId)
            ->where('user_id', $userId)
            ->where('is_system', true)
            ->first();

        if (!$page) {
            return response()->json([
                'success' => false,
                'message' => 'System page not found',
            ], 404);
        }

        $section = $page->sections()->where('id', $sectionId)->first();

        if (!$section) {
            return response()->json([
                'success' => false,
                'message' => 'Section not found',
            ], 404);
        }

        // Update section
        $section->update($request->only([
            'section_name',
            'content',
            'css',
            'order',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Section updated',
            'data' => $section->fresh(),
        ]);
    }

    /**
     * Bulk update system pages (for reordering, etc.)
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $pages = $request->input('pages', []);

        foreach ($pages as $pageData) {
            if (!isset($pageData['id'])) continue;

            $page = UserPage::where('id', $pageData['id'])
                ->where('user_id', $userId)
                ->where('is_system', true)
                ->first();

            if ($page) {
                $page->update([
                    'order' => $pageData['order'] ?? $page->order,
                ]);

                // Update sections if provided
                if (isset($pageData['sections'])) {
                    foreach ($pageData['sections'] as $sectionData) {
                        if (!isset($sectionData['id'])) continue;

                        $section = $page->sections()->where('id', $sectionData['id'])->first();
                        if ($section) {
                            $section->update([
                                'content' => $sectionData['content'] ?? $section->content,
                                'css' => $sectionData['css'] ?? $section->css,
                                'order' => $sectionData['order'] ?? $section->order,
                            ]);
                        }
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'System pages updated',
        ]);
    }

    /**
     * Delete system pages for a feature (called when feature is uninstalled).
     */
    public function deleteForFeature(Request $request, string $featureType): JsonResponse
    {
        $userId = $request->user()->id;

        // Delete sections first
        $pageIds = UserPage::where('user_id', $userId)
            ->where('is_system', true)
            ->where('feature_type', $featureType)
            ->pluck('id');

        UserSection::whereIn('user_page_id', $pageIds)->delete();

        // Delete pages
        $deleted = UserPage::where('user_id', $userId)
            ->where('is_system', true)
            ->where('feature_type', $featureType)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => "Deleted {$deleted} system pages for feature: {$featureType}",
        ]);
    }
}
