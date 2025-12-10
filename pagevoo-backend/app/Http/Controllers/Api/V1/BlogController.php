<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\DatabaseInstance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class BlogController extends BaseController
{
    /**
     * Set up connection to user's database
     */
    private function connectToUserDatabase(string $type, int $referenceId): ?string
    {
        $instance = DatabaseInstance::where('type', $type)
            ->where('reference_id', $referenceId)
            ->where('status', 'active')
            ->first();

        if (!$instance) {
            return null;
        }

        // Configure dynamic database connection
        Config::set('database.connections.user_db', [
            'driver' => 'mysql',
            'host' => Config::get('database.connections.mysql.host'),
            'port' => Config::get('database.connections.mysql.port'),
            'database' => $instance->database_name,
            'username' => Config::get('database.connections.mysql.username'),
            'password' => Config::get('database.connections.mysql.password'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'strict' => true,
        ]);

        // Purge and reconnect
        DB::purge('user_db');
        DB::reconnect('user_db');

        return $instance->database_name;
    }

    /**
     * Check if blog tables exist in the user database
     */
    private function checkBlogTablesExist(): bool
    {
        try {
            return DB::connection('user_db')->getSchemaBuilder()->hasTable('blog_posts');
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get all blog posts
     */
    public function index(Request $request)
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return $this->sendError('Reference ID is required', 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        // Check if blog feature is installed
        if (!$this->checkBlogTablesExist()) {
            return $this->sendError('Blog feature is not installed. Please install the Blog feature from the Database Manager.', 400);
        }

        try {
            $posts = DB::connection('user_db')
                ->table('blog_posts')
                ->where('website_id', $referenceId)
                ->orderBy('created_at', 'desc')
                ->get();

            // Get categories for each post
            foreach ($posts as $post) {
                if ($post->category_id) {
                    $post->category = DB::connection('user_db')
                        ->table('blog_categories')
                        ->where('id', $post->category_id)
                        ->first();
                }

                // Get tags for each post
                $post->tags = DB::connection('user_db')
                    ->table('blog_post_tags')
                    ->join('blog_tags', 'blog_post_tags.tag_id', '=', 'blog_tags.id')
                    ->where('blog_post_tags.post_id', $post->id)
                    ->select('blog_tags.*')
                    ->get();
            }

            return $this->sendSuccess($posts);
        } catch (\Exception $e) {
            return $this->sendError('Failed to fetch posts: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create a new blog post
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'required|string',
            'featured_image' => 'nullable|string|max:500',
            'author_name' => 'nullable|string|max:255',
            'category_id' => 'nullable|integer',
            'status' => 'required|in:draft,published,scheduled',
            'published_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        // Check if blog feature is installed
        if (!$this->checkBlogTablesExist()) {
            return $this->sendError('Blog feature is not installed. Please install the Blog feature from the Database Manager.', 400);
        }

        try {
            // Generate slug if not provided
            $slug = $request->slug ?: Str::slug($request->title);

            // Ensure slug is unique
            $existingSlug = DB::connection('user_db')
                ->table('blog_posts')
                ->where('website_id', $request->reference_id)
                ->where('slug', $slug)
                ->exists();

            if ($existingSlug) {
                $slug = $slug . '-' . uniqid();
            }

            $postId = DB::connection('user_db')
                ->table('blog_posts')
                ->insertGetId([
                    'website_id' => $request->reference_id,
                    'title' => $request->title,
                    'slug' => $slug,
                    'excerpt' => $request->excerpt,
                    'content' => $request->content,
                    'featured_image' => $request->featured_image,
                    'author_name' => $request->author_name,
                    'category_id' => $request->category_id,
                    'status' => $request->status,
                    'published_at' => $request->status === 'published' ? now() : $request->published_at,
                    'view_count' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            $post = DB::connection('user_db')
                ->table('blog_posts')
                ->where('id', $postId)
                ->first();

            return $this->sendSuccess($post, 'Post created successfully', 201);
        } catch (\Exception $e) {
            return $this->sendError('Failed to create post: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update a blog post
     */
    public function update(Request $request, $postId)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'title' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'sometimes|string',
            'featured_image' => 'nullable|string|max:500',
            'author_name' => 'nullable|string|max:255',
            'category_id' => 'nullable|integer',
            'status' => 'sometimes|in:draft,published,scheduled',
            'published_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        try {
            $post = DB::connection('user_db')
                ->table('blog_posts')
                ->where('id', $postId)
                ->where('website_id', $request->reference_id)
                ->first();

            if (!$post) {
                return $this->sendError('Post not found', 404);
            }

            $updateData = [
                'updated_at' => now(),
            ];

            if ($request->has('title')) $updateData['title'] = $request->title;
            if ($request->has('slug')) $updateData['slug'] = $request->slug;
            if ($request->has('excerpt')) $updateData['excerpt'] = $request->excerpt;
            if ($request->has('content')) $updateData['content'] = $request->content;
            if ($request->has('featured_image')) $updateData['featured_image'] = $request->featured_image;
            if ($request->has('author_name')) $updateData['author_name'] = $request->author_name;
            if ($request->has('category_id')) $updateData['category_id'] = $request->category_id;
            if ($request->has('status')) {
                $updateData['status'] = $request->status;
                if ($request->status === 'published' && !$post->published_at) {
                    $updateData['published_at'] = now();
                }
            }
            if ($request->has('published_at')) $updateData['published_at'] = $request->published_at;

            DB::connection('user_db')
                ->table('blog_posts')
                ->where('id', $postId)
                ->update($updateData);

            $updatedPost = DB::connection('user_db')
                ->table('blog_posts')
                ->where('id', $postId)
                ->first();

            return $this->sendSuccess($updatedPost, 'Post updated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to update post: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a blog post
     */
    public function destroy(Request $request, $postId)
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return $this->sendError('Reference ID is required', 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        try {
            $deleted = DB::connection('user_db')
                ->table('blog_posts')
                ->where('id', $postId)
                ->where('website_id', $referenceId)
                ->delete();

            if (!$deleted) {
                return $this->sendError('Post not found', 404);
            }

            // Delete associated tags
            DB::connection('user_db')
                ->table('blog_post_tags')
                ->where('post_id', $postId)
                ->delete();

            return $this->sendSuccess(null, 'Post deleted successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to delete post: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get all categories
     */
    public function getCategories(Request $request)
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return $this->sendError('Reference ID is required', 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        // Check if blog feature is installed
        if (!$this->checkBlogTablesExist()) {
            return $this->sendError('Blog feature is not installed. Please install the Blog feature from the Database Manager.', 400);
        }

        try {
            $categories = DB::connection('user_db')
                ->table('blog_categories')
                ->where('website_id', $referenceId)
                ->orderBy('order')
                ->get();

            return $this->sendSuccess($categories);
        } catch (\Exception $e) {
            return $this->sendError('Failed to fetch categories: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create a new category
     */
    public function storeCategory(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        try {
            $slug = Str::slug($request->name);

            // Get max order
            $maxOrder = DB::connection('user_db')
                ->table('blog_categories')
                ->where('website_id', $request->reference_id)
                ->max('order') ?? -1;

            $categoryId = DB::connection('user_db')
                ->table('blog_categories')
                ->insertGetId([
                    'website_id' => $request->reference_id,
                    'name' => $request->name,
                    'slug' => $slug,
                    'description' => $request->description,
                    'order' => $maxOrder + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            $category = DB::connection('user_db')
                ->table('blog_categories')
                ->where('id', $categoryId)
                ->first();

            return $this->sendSuccess($category, 'Category created successfully', 201);
        } catch (\Exception $e) {
            return $this->sendError('Failed to create category: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update a category
     */
    public function updateCategory(Request $request, $categoryId)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        try {
            $updateData = ['updated_at' => now()];

            if ($request->has('name')) {
                $updateData['name'] = $request->name;
                $updateData['slug'] = Str::slug($request->name);
            }
            if ($request->has('description')) {
                $updateData['description'] = $request->description;
            }

            DB::connection('user_db')
                ->table('blog_categories')
                ->where('id', $categoryId)
                ->where('website_id', $request->reference_id)
                ->update($updateData);

            $category = DB::connection('user_db')
                ->table('blog_categories')
                ->where('id', $categoryId)
                ->first();

            return $this->sendSuccess($category, 'Category updated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to update category: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a category
     */
    public function destroyCategory(Request $request, $categoryId)
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return $this->sendError('Reference ID is required', 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        try {
            // Set posts with this category to null
            DB::connection('user_db')
                ->table('blog_posts')
                ->where('category_id', $categoryId)
                ->update(['category_id' => null]);

            $deleted = DB::connection('user_db')
                ->table('blog_categories')
                ->where('id', $categoryId)
                ->where('website_id', $referenceId)
                ->delete();

            if (!$deleted) {
                return $this->sendError('Category not found', 404);
            }

            return $this->sendSuccess(null, 'Category deleted successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to delete category: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get all tags
     */
    public function getTags(Request $request)
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return $this->sendError('Reference ID is required', 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        // Check if blog feature is installed
        if (!$this->checkBlogTablesExist()) {
            return $this->sendError('Blog feature is not installed. Please install the Blog feature from the Database Manager.', 400);
        }

        try {
            $tags = DB::connection('user_db')
                ->table('blog_tags')
                ->where('website_id', $referenceId)
                ->orderBy('name')
                ->get();

            return $this->sendSuccess($tags);
        } catch (\Exception $e) {
            return $this->sendError('Failed to fetch tags: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create a new tag
     */
    public function storeTag(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        try {
            $slug = Str::slug($request->name);

            $tagId = DB::connection('user_db')
                ->table('blog_tags')
                ->insertGetId([
                    'website_id' => $request->reference_id,
                    'name' => $request->name,
                    'slug' => $slug,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            $tag = DB::connection('user_db')
                ->table('blog_tags')
                ->where('id', $tagId)
                ->first();

            return $this->sendSuccess($tag, 'Tag created successfully', 201);
        } catch (\Exception $e) {
            return $this->sendError('Failed to create tag: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a tag
     */
    public function destroyTag(Request $request, $tagId)
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return $this->sendError('Reference ID is required', 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        try {
            // Delete post-tag associations
            DB::connection('user_db')
                ->table('blog_post_tags')
                ->where('tag_id', $tagId)
                ->delete();

            $deleted = DB::connection('user_db')
                ->table('blog_tags')
                ->where('id', $tagId)
                ->where('website_id', $referenceId)
                ->delete();

            if (!$deleted) {
                return $this->sendError('Tag not found', 404);
            }

            return $this->sendSuccess(null, 'Tag deleted successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to delete tag: ' . $e->getMessage(), 500);
        }
    }
}
