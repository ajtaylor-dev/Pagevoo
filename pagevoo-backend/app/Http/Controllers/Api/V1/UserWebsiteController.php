<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Template;
use App\Models\UserWebsite;
use App\Models\UserPage;
use App\Models\UserSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class UserWebsiteController extends BaseController
{
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
     * Update user's website content
     */
    public function updateContent(Request $request)
    {
        $website = UserWebsite::where('user_id', auth()->id())->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        // Update logic here (to be implemented based on builder requirements)

        return $this->sendSuccess($website, 'Website updated successfully');
    }

    /**
     * Publish user's website
     */
    public function publish()
    {
        $website = UserWebsite::where('user_id', auth()->id())->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        $website->update([
            'published_at' => now(),
        ]);

        return $this->sendSuccess($website, 'Website published successfully');
    }

    /**
     * Unpublish user's website
     */
    public function unpublish()
    {
        $website = UserWebsite::where('user_id', auth()->id())->first();

        if (!$website) {
            return $this->sendError('Website not found', 404);
        }

        $website->update([
            'published_at' => null,
        ]);

        return $this->sendSuccess($website, 'Website unpublished successfully');
    }
}
