<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\TemplatePage;
use App\Models\TemplateSection;
use App\Models\Setting;
use App\Services\TemplateFileGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TemplateController extends BaseController
{
    protected TemplateFileGenerator $fileGenerator;

    public function __construct()
    {
        $this->fileGenerator = new TemplateFileGenerator();
    }
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
            'pages.*.page_id' => 'nullable|string',
            'pages.*.is_homepage' => 'boolean',
            'pages.*.order' => 'integer',
            'pages.*.sections' => 'array',
            'pages.*.sections.*.section_name' => 'nullable|string',
            'pages.*.sections.*.section_id' => 'nullable|string',
            'pages.*.sections.*.type' => 'required|string',
            'pages.*.sections.*.content' => 'nullable|array',
            'pages.*.sections.*.css' => 'nullable|array',
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
            'is_active' => $request->is_active ?? false, // Default to unpublished (draft)
            'created_by' => auth()->id(),
            'exclusive_to' => $request->exclusive_to,
            'technologies' => $request->technologies,
            'features' => $request->features,
            'custom_css' => $request->custom_css,
        ]);

        // Create pages and sections
        foreach ($request->pages as $pageData) {
            $page = TemplatePage::create([
                'template_id' => $template->id,
                'name' => $pageData['name'],
                'slug' => $pageData['slug'],
                'page_id' => $pageData['page_id'] ?? null,
                'is_homepage' => $pageData['is_homepage'] ?? false,
                'order' => $pageData['order'] ?? 0,
            ]);

            if (isset($pageData['sections'])) {
                foreach ($pageData['sections'] as $sectionData) {
                    TemplateSection::create([
                        'template_page_id' => $page->id,
                        'section_name' => $sectionData['section_name'] ?? ucfirst($sectionData['type']),
                        'section_id' => $sectionData['section_id'] ?? null,
                        'type' => $sectionData['type'],
                        'content' => $sectionData['content'] ?? null,
                        'css' => $sectionData['css'] ?? null,
                        'order' => $sectionData['order'] ?? 0,
                    ]);
                }
            }
        }

        $template->load(['pages.sections', 'creator']);

        // Generate HTML/CSS files to disk
        try {
            $this->fileGenerator->generateTemplateFiles($template);
        } catch (\Exception $e) {
            \Log::error('Failed to generate template files: ' . $e->getMessage());
            // Don't fail the request, just log the error
        }

        // Refresh template to get updated template_slug
        $template->refresh();
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
            'pages.*.page_id' => 'nullable|string',
            'pages.*.is_homepage' => 'boolean',
            'pages.*.order' => 'integer',
            'pages.*.sections' => 'array',
            'pages.*.sections.*.section_name' => 'nullable|string',
            'pages.*.sections.*.section_id' => 'nullable|string',
            'pages.*.sections.*.type' => 'required|string',
            'pages.*.sections.*.content' => 'nullable|array',
            'pages.*.sections.*.css' => 'nullable|array',
            'pages.*.sections.*.order' => 'integer',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        // Track if is_active is changing
        $wasActive = $template->is_active;
        $willBeActive = $request->has('is_active') ? $request->is_active : $wasActive;

        $template->update($request->only([
            'name',
            'description',
            'business_type',
            'preview_image',
            'is_active',
            'exclusive_to',
            'technologies',
            'features',
            'custom_css'
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
                    'page_id' => $pageData['page_id'] ?? null,
                    'is_homepage' => $pageData['is_homepage'] ?? false,
                    'order' => $pageData['order'] ?? 0,
                ]);

                if (isset($pageData['sections'])) {
                    foreach ($pageData['sections'] as $sectionData) {
                        TemplateSection::create([
                            'template_page_id' => $page->id,
                            'section_name' => $sectionData['section_name'] ?? ucfirst($sectionData['type']),
                            'section_id' => $sectionData['section_id'] ?? null,
                            'type' => $sectionData['type'],
                            'content' => $sectionData['content'] ?? null,
                            'css' => $sectionData['css'] ?? null,
                            'order' => $sectionData['order'] ?? 0,
                        ]);
                    }
                }
            }
        }

        // Force refresh to ensure all relationships are loaded fresh from database
        $template->refresh();
        $template->load(['pages.sections', 'creator']);

        // Handle slug regeneration if published status changed
        if ($wasActive !== $willBeActive) {
            try {
                $this->fileGenerator->updateSlugOnPublish($template, $willBeActive);
            } catch (\Exception $e) {
                \Log::error('Failed to update template slug on publish: ' . $e->getMessage());
            }
        } else {
            // Regenerate HTML/CSS files
            try {
                $this->fileGenerator->generateTemplateFiles($template);
            } catch (\Exception $e) {
                \Log::error('Failed to regenerate template files: ' . $e->getMessage());
                // Log more details about the error
                \Log::error('Template ID: ' . $template->id);
                \Log::error('Template Slug: ' . $template->template_slug);
                \Log::error('Pages count: ' . $template->pages->count());
            }
        }

        // Final refresh to get updated template_slug if it was generated
        $template->refresh();
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

        // Delete template files from disk
        try {
            $this->fileGenerator->deleteTemplateFiles($template);
        } catch (\Exception $e) {
            \Log::error('Failed to delete template files: ' . $e->getMessage());
            // Continue with deletion even if file cleanup fails
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

        // Get upload settings from database
        $maxSize = Setting::get('upload_max_preview_image_size', 5120);
        $allowedFormats = Setting::get('upload_allowed_preview_formats', 'jpeg,png,jpg,gif,webp');

        $validator = Validator::make($request->all(), [
            'preview_image' => "required|image|mimes:{$allowedFormats}|max:{$maxSize}",
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

    /**
     * Upload image to template gallery
     */
    public function uploadGalleryImage(Request $request, $id)
    {
        try {
            \Log::info('Upload gallery image called for template ID: ' . $id);

            $template = Template::find($id);

            if (!$template) {
                return $this->sendError('Template not found', 404);
            }

            // Get upload settings from database
            $maxSize = Setting::get('upload_max_gallery_image_size', 2048);
            $allowedFormats = Setting::get('upload_allowed_gallery_formats', 'jpeg,png,jpg,gif,svg,webp');

            $validator = Validator::make($request->all(), [
                'image' => "required|image|mimes:{$allowedFormats}|max:{$maxSize}",
            ]);

            if ($validator->fails()) {
                \Log::error('Validation failed', ['errors' => $validator->errors()]);
                return $this->sendError('Validation Error', 422, $validator->errors());
            }

            // Create template directory if it doesn't exist
            $templateDir = public_path("template_directory/template_{$template->id}/images");
            \Log::info('Template directory: ' . $templateDir);

            if (!file_exists($templateDir)) {
                \Log::info('Creating directory...');
                mkdir($templateDir, 0755, true);
            }

            // Upload file
            $file = $request->file('image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $fileSize = $file->getSize(); // Get size BEFORE moving
            \Log::info('Moving file to: ' . $templateDir . '/' . $filename);
            $file->move($templateDir, $filename);

            // Add image to template's images array
            $images = $template->images ?? [];
            \Log::info('Existing images count: ' . count($images));

            $newImage = [
                'id' => uniqid(),
                'filename' => $filename,
                'path' => "template_directory/template_{$template->id}/images/{$filename}",
                'size' => $fileSize,
                'uploaded_at' => now()->toDateTimeString()
            ];
            $images[] = $newImage;

            \Log::info('Updating template with new image', ['newImage' => $newImage]);
            $template->update(['images' => $images]);

            \Log::info('Image uploaded successfully');
            return $this->sendSuccess($newImage, 'Image uploaded successfully');
        } catch (\Exception $e) {
            \Log::error('Upload gallery image error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return $this->sendError('Upload failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete image from template gallery
     */
    public function deleteGalleryImage(Request $request, $id)
    {
        $template = Template::find($id);

        if (!$template) {
            return $this->sendError('Template not found', 404);
        }

        $imageId = $request->input('image_id');
        $images = $template->images ?? [];

        // Find and remove image
        $imageToDelete = null;
        $images = array_filter($images, function($img) use ($imageId, &$imageToDelete) {
            if ($img['id'] === $imageId) {
                $imageToDelete = $img;
                return false;
            }
            return true;
        });

        if (!$imageToDelete) {
            return $this->sendError('Image not found', 404);
        }

        // Delete physical file
        $filePath = public_path($imageToDelete['path']);
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        // Update template
        $template->update(['images' => array_values($images)]);

        return $this->sendSuccess(null, 'Image deleted successfully');
    }

    /**
     * Rename image in template gallery
     */
    public function renameGalleryImage(Request $request, $id)
    {
        $template = Template::find($id);

        if (!$template) {
            return $this->sendError('Template not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'image_id' => 'required|string',
            'new_filename' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $imageId = $request->input('image_id');
        $newFilename = $request->input('new_filename');
        $images = $template->images ?? [];

        // Find and update image
        $imageFound = false;
        foreach ($images as &$img) {
            if ($img['id'] === $imageId) {
                $imageFound = true;

                // Rename physical file
                $oldPath = public_path($img['path']);
                $dir = dirname($oldPath);
                $newPath = $dir . '/' . $newFilename;

                if (file_exists($oldPath)) {
                    rename($oldPath, $newPath);
                }

                // Update image data
                $img['filename'] = $newFilename;
                $img['path'] = "template_directory/template_{$template->id}/images/{$newFilename}";
                break;
            }
        }

        if (!$imageFound) {
            return $this->sendError('Image not found', 404);
        }

        // Update template
        $template->update(['images' => $images]);

        return $this->sendSuccess(null, 'Image renamed successfully');
    }
}
