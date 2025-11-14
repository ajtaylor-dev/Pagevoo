<?php

namespace App\Http\Controllers;

use App\Models\SectionLibrary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class SectionLibraryController extends Controller
{
    /**
     * Display a listing of the user's section library entries and Pagevoo official sections.
     */
    public function index(Request $request)
    {
        // Filter by source: 'my' (user's sections), 'pagevoo' (official), or 'both' (default)
        $source = $request->input('source', 'both');

        $query = SectionLibrary::query();

        // Apply source filter
        if ($source === 'my') {
            $query->where('user_id', Auth::id());
        } elseif ($source === 'pagevoo') {
            $query->where('is_pagevoo_official', true);
        } else {
            // Both: user's sections OR pagevoo official sections
            $query->where(function($q) {
                $q->where('user_id', Auth::id())
                  ->orWhere('is_pagevoo_official', true);
            });
        }

        // Filter by section type if provided
        if ($request->has('type')) {
            $query->where('section_type', $request->type);
        }

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

        $sections = $query->orderBy('created_at', 'desc')->get();

        // Transform the response to include preview_image_url and is_pagevoo_official
        $sections = $sections->map(function ($section) {
            return [
                'id' => $section->id,
                'name' => $section->name,
                'description' => $section->description,
                'preview_image' => $section->preview_image_url,
                'section_type' => $section->section_type,
                'tags' => $section->tags,
                'is_pagevoo_official' => $section->is_pagevoo_official,
                'created_at' => $section->created_at,
                'updated_at' => $section->updated_at,
            ];
        });

        return response()->json([
            'sections' => $sections
        ]);
    }

    /**
     * Store a newly created section in the library.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'section_type' => 'required|string|max:100',
            'section_data' => 'required|array',
            'tags' => 'nullable|array',
            'preview_image' => 'nullable|string', // Base64 encoded image
            'is_pagevoo_official' => 'nullable|boolean',
        ]);

        $data = [
            'user_id' => Auth::id(),
            'name' => $request->name,
            'description' => $request->description,
            'section_type' => $request->section_type,
            'section_data' => $request->section_data,
            'tags' => $request->tags ?? [],
            'is_public' => false,
            'is_pagevoo_official' => $request->input('is_pagevoo_official', false),
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
                $filename = 'section_library/' . Str::random(40) . '.' . $type;

                // Store image
                Storage::disk('public')->put($filename, $imageData);

                $data['preview_image'] = $filename;
            }
        }

        $section = SectionLibrary::create($data);

        return response()->json([
            'id' => $section->id,
            'name' => $section->name,
            'preview_url' => $section->preview_image_url,
            'created_at' => $section->created_at,
        ], 201);
    }

    /**
     * Display the specified section with full data.
     */
    public function show($id)
    {
        // Allow fetching sections that are either owned by the user OR are Pagevoo official
        $section = SectionLibrary::where(function($query) {
            $query->where('user_id', Auth::id())
                  ->orWhere('is_pagevoo_official', true);
        })->findOrFail($id);

        return response()->json([
            'id' => $section->id,
            'name' => $section->name,
            'description' => $section->description,
            'section_type' => $section->section_type,
            'section_data' => $section->section_data,
            'tags' => $section->tags,
            'preview_image' => $section->preview_image_url,
            'is_pagevoo_official' => $section->is_pagevoo_official,
            'created_at' => $section->created_at,
        ]);
    }

    /**
     * Update the specified section in the library.
     */
    public function update(Request $request, $id)
    {
        $section = SectionLibrary::where('user_id', Auth::id())
            ->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'section_type' => 'sometimes|required|string|max:100',
            'section_data' => 'sometimes|required|array',
            'tags' => 'nullable|array',
        ]);

        $section->update($request->only([
            'name', 'description', 'section_type', 'section_data', 'tags'
        ]));

        return response()->json([
            'id' => $section->id,
            'name' => $section->name,
            'updated_at' => $section->updated_at,
        ]);
    }

    /**
     * Remove the specified section from the library.
     */
    public function destroy($id)
    {
        $section = SectionLibrary::where('user_id', Auth::id())
            ->findOrFail($id);

        // Delete preview image if exists
        if ($section->preview_image) {
            Storage::disk('public')->delete($section->preview_image);
        }

        $section->delete();

        return response()->json([
            'message' => 'Section deleted successfully'
        ]);
    }
}
