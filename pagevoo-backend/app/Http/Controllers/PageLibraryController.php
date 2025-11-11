<?php

namespace App\Http\Controllers;

use App\Models\PageLibrary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class PageLibraryController extends Controller
{
    /**
     * Display a listing of the user's page library entries.
     */
    public function index(Request $request)
    {
        $query = PageLibrary::where('user_id', Auth::id());

        // Filter by tags if provided
        if ($request->has('tags')) {
            $tags = is_array($request->tags) ? $request->tags : explode(',', $request->tags);
            $query->where(function($q) use ($tags) {
                foreach ($tags as $tag) {
                    $q->orWhereJsonContains('tags', trim($tag));
                }
            });
        }

        // Search by name or description
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        $pages = $query->orderBy('created_at', 'desc')->get();

        // Transform the response
        $pages = $pages->map(function ($page) {
            return [
                'id' => $page->id,
                'name' => $page->name,
                'description' => $page->description,
                'preview_image' => $page->preview_image_url,
                'meta_description' => $page->meta_description,
                'tags' => $page->tags,
                'section_count' => $page->section_count,
                'created_at' => $page->created_at,
                'updated_at' => $page->updated_at,
            ];
        });

        return response()->json([
            'pages' => $pages
        ]);
    }

    /**
     * Store a newly created page in the library.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string|max:500',
            'page_data' => 'required|array',
            'site_css' => 'nullable|string',
            'tags' => 'nullable|array',
            'preview_image' => 'nullable|string', // Base64 encoded image
        ]);

        $data = [
            'user_id' => Auth::id(),
            'name' => $request->name,
            'description' => $request->description,
            'meta_description' => $request->meta_description,
            'meta_keywords' => $request->meta_keywords,
            'page_data' => $request->page_data,
            'site_css' => $request->site_css,
            'tags' => $request->tags ?? [],
            'is_public' => false,
        ];

        // Handle preview image upload
        if ($request->has('preview_image') && $request->preview_image) {
            $imageData = $request->preview_image;

            // Check if it's a base64 encoded image
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $type = strtolower($type[1]); // jpg, png, gif
                $imageData = base64_decode($imageData);

                // Generate unique filename
                $filename = 'page_library/' . Str::random(40) . '.' . $type;

                // Store image
                Storage::disk('public')->put($filename, $imageData);

                $data['preview_image'] = $filename;
            }
        }

        $page = PageLibrary::create($data);

        return response()->json([
            'id' => $page->id,
            'name' => $page->name,
            'preview_url' => $page->preview_image_url,
            'created_at' => $page->created_at,
        ], 201);
    }

    /**
     * Display the specified page with full data.
     */
    public function show($id)
    {
        $page = PageLibrary::where('user_id', Auth::id())
            ->findOrFail($id);

        return response()->json([
            'id' => $page->id,
            'name' => $page->name,
            'description' => $page->description,
            'meta_description' => $page->meta_description,
            'meta_keywords' => $page->meta_keywords,
            'page_data' => $page->page_data,
            'site_css' => $page->site_css,
            'tags' => $page->tags,
            'preview_image' => $page->preview_image_url,
            'section_count' => $page->section_count,
            'created_at' => $page->created_at,
        ]);
    }

    /**
     * Update the specified page in the library.
     */
    public function update(Request $request, $id)
    {
        $page = PageLibrary::where('user_id', Auth::id())
            ->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string|max:500',
            'page_data' => 'sometimes|required|array',
            'site_css' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        $page->update($request->only([
            'name', 'description', 'meta_description', 'meta_keywords',
            'page_data', 'site_css', 'tags'
        ]));

        return response()->json([
            'id' => $page->id,
            'name' => $page->name,
            'updated_at' => $page->updated_at,
        ]);
    }

    /**
     * Remove the specified page from the library.
     */
    public function destroy($id)
    {
        $page = PageLibrary::where('user_id', Auth::id())
            ->findOrFail($id);

        // Delete preview image if exists
        if ($page->preview_image) {
            Storage::disk('public')->delete($page->preview_image);
        }

        $page->delete();

        return response()->json([
            'message' => 'Page deleted successfully'
        ]);
    }
}
