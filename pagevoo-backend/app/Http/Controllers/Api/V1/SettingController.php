<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingController extends BaseController
{
    /**
     * Get all settings
     */
    public function index()
    {
        $settings = Setting::all();
        return $this->sendSuccess($settings, 'Settings retrieved successfully');
    }

    /**
     * Get upload settings
     */
    public function getUploadSettings()
    {
        $settings = Setting::whereIn('key', [
            'upload_max_gallery_image_size',
            'upload_max_preview_image_size',
            'upload_allowed_gallery_formats',
            'upload_allowed_preview_formats'
        ])->get()->keyBy('key');

        return $this->sendSuccess($settings, 'Upload settings retrieved successfully');
    }

    /**
     * Update upload settings
     */
    public function updateUploadSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'upload_max_gallery_image_size' => 'required|integer|min:100|max:10240',
            'upload_max_preview_image_size' => 'required|integer|min:100|max:10240',
            'upload_allowed_gallery_formats' => 'required|string',
            'upload_allowed_preview_formats' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        // Update each setting
        Setting::set('upload_max_gallery_image_size', $request->upload_max_gallery_image_size, 'integer', 'Maximum file size for gallery images in KB');
        Setting::set('upload_max_preview_image_size', $request->upload_max_preview_image_size, 'integer', 'Maximum file size for preview images in KB');
        Setting::set('upload_allowed_gallery_formats', $request->upload_allowed_gallery_formats, 'string', 'Allowed file formats for gallery images (comma-separated)');
        Setting::set('upload_allowed_preview_formats', $request->upload_allowed_preview_formats, 'string', 'Allowed file formats for preview images (comma-separated)');

        $settings = Setting::whereIn('key', [
            'upload_max_gallery_image_size',
            'upload_max_preview_image_size',
            'upload_allowed_gallery_formats',
            'upload_allowed_preview_formats'
        ])->get()->keyBy('key');

        return $this->sendSuccess($settings, 'Upload settings updated successfully');
    }

    /**
     * Get a specific setting by key
     */
    public function show($key)
    {
        $setting = Setting::where('key', $key)->first();

        if (!$setting) {
            return $this->sendError('Setting not found', 404);
        }

        return $this->sendSuccess($setting, 'Setting retrieved successfully');
    }

    /**
     * Update a specific setting
     */
    public function update(Request $request, $key)
    {
        $validator = Validator::make($request->all(), [
            'value' => 'required',
            'type' => 'nullable|in:string,integer,boolean,json',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $setting = Setting::set(
            $key,
            $request->value,
            $request->type ?? 'string',
            $request->description
        );

        return $this->sendSuccess($setting, 'Setting updated successfully');
    }
}
