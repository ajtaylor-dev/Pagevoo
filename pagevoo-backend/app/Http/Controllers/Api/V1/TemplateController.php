<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\TemplatePage;
use App\Models\TemplateSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TemplateController extends BaseController
{
    /**
     * Get all templates
     */
    public function index()
    {
        $templates = Template::with(['pages.sections', 'creator'])
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->sendSuccess($templates, 'Templates retrieved successfully');
    }

    /**
     * Get all templates (admin - includes inactive)
     */
    public function adminIndex()
    {
        $templates = Template::with(['pages.sections', 'creator'])
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->sendSuccess($templates, 'Templates retrieved successfully');
    }

    /**
     * Get single template with all pages and sections
     */
    public function show($id)
    {
        $template = Template::with(['pages.sections', 'creator'])->find($id);

        if (!$template) {
            return $this->sendError('Template not found', 404);
        }

        return $this->sendSuccess($template, 'Template retrieved successfully');
    }

    /**
     * Create new template
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'business_type' => 'required|in:restaurant,barber,pizza,cafe,gym,salon,other',
            'preview_image' => 'nullable|string',
            'is_active' => 'boolean',
            'exclusive_to' => 'nullable|in:pro,niche',
            'technologies' => 'nullable|array',
            'features' => 'nullable|array',
            'pages' => 'required|array',
            'pages.*.name' => 'required|string',
            'pages.*.slug' => 'required|string',
            'pages.*.is_homepage' => 'boolean',
            'pages.*.order' => 'integer',
            'pages.*.sections' => 'array',
            'pages.*.sections.*.name' => 'nullable|string',
            'pages.*.sections.*.type' => 'required|string',
            'pages.*.sections.*.content' => 'nullable|array',
            'pages.*.sections.*.order' => 'integer',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $template = Template::create([
            'name' => $request->name,
            'description' => $request->description,
            'business_type' => $request->business_type,
            'preview_image' => $request->preview_image,
            'is_active' => $request->is_active ?? true,
            'created_by' => auth()->id(),
            'exclusive_to' => $request->exclusive_to,
            'technologies' => $request->technologies,
            'features' => $request->features,
        ]);

        // Create pages and sections
        foreach ($request->pages as $pageData) {
            $page = TemplatePage::create([
                'template_id' => $template->id,
                'name' => $pageData['name'],
                'slug' => $pageData['slug'],
                'is_homepage' => $pageData['is_homepage'] ?? false,
                'order' => $pageData['order'] ?? 0,
            ]);

            if (isset($pageData['sections'])) {
                foreach ($pageData['sections'] as $sectionData) {
                    TemplateSection::create([
                        'template_page_id' => $page->id,
                        'name' => $sectionData['name'] ?? ucfirst($sectionData['type']),
                        'type' => $sectionData['type'],
                        'content' => $sectionData['content'] ?? null,
                        'order' => $sectionData['order'] ?? 0,
                    ]);
                }
            }
        }

        $template->load(['pages.sections', 'creator']);

        return $this->sendSuccess($template, 'Template created successfully');
    }

    /**
     * Update template
     */
    public function update(Request $request, $id)
    {
        $template = Template::find($id);

        if (!$template) {
            return $this->sendError('Template not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'business_type' => 'in:restaurant,barber,pizza,cafe,gym,salon,other',
            'preview_image' => 'nullable|string',
            'is_active' => 'boolean',
            'exclusive_to' => 'nullable|in:pro,niche',
            'technologies' => 'nullable|array',
            'features' => 'nullable|array',
            'pages' => 'nullable|array',
            'pages.*.name' => 'required|string',
            'pages.*.slug' => 'required|string',
            'pages.*.is_homepage' => 'boolean',
            'pages.*.order' => 'integer',
            'pages.*.sections' => 'array',
            'pages.*.sections.*.name' => 'nullable|string',
            'pages.*.sections.*.type' => 'required|string',
            'pages.*.sections.*.content' => 'nullable|array',
            'pages.*.sections.*.order' => 'integer',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $template->update($request->only([
            'name',
            'description',
            'business_type',
            'preview_image',
            'is_active',
            'exclusive_to',
            'technologies',
            'features'
        ]));

        // If pages data is provided, update pages and sections
        if ($request->has('pages')) {
            // Delete existing pages (cascade will delete sections)
            $template->pages()->delete();

            // Create new pages and sections
            foreach ($request->pages as $pageData) {
                $page = TemplatePage::create([
                    'template_id' => $template->id,
                    'name' => $pageData['name'],
                    'slug' => $pageData['slug'],
                    'is_homepage' => $pageData['is_homepage'] ?? false,
                    'order' => $pageData['order'] ?? 0,
                ]);

                if (isset($pageData['sections'])) {
                    foreach ($pageData['sections'] as $sectionData) {
                        TemplateSection::create([
                            'template_page_id' => $page->id,
                            'name' => $sectionData['name'] ?? ucfirst($sectionData['type']),
                            'type' => $sectionData['type'],
                            'content' => $sectionData['content'] ?? null,
                            'order' => $sectionData['order'] ?? 0,
                        ]);
                    }
                }
            }
        }

        $template->load(['pages.sections', 'creator']);

        return $this->sendSuccess($template, 'Template updated successfully');
    }

    /**
     * Delete template
     */
    public function destroy($id)
    {
        $template = Template::find($id);

        if (!$template) {
            return $this->sendError('Template not found', 404);
        }

        $template->delete();

        return $this->sendSuccess(null, 'Template deleted successfully');
    }

    /**
     * Upload preview image for template
     */
    public function uploadImage(Request $request, $id)
    {
        $template = Template::find($id);

        if (!$template) {
            return $this->sendError('Template not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'preview_image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        // Delete old image if exists
        if ($template->preview_image && \Storage::disk('public')->exists($template->preview_image)) {
            \Storage::disk('public')->delete($template->preview_image);
        }

        // Store new image
        $path = $request->file('preview_image')->store('template-previews', 'public');

        $template->update(['preview_image' => $path]);

        $template->load(['pages.sections', 'creator']);

        return $this->sendSuccess($template, 'Preview image uploaded successfully');
    }
}
