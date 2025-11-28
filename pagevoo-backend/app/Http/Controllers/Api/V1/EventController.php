<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DatabaseInstance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class EventController extends Controller
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
     * Get all events
     */
    public function index(Request $request)
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');
        $filter = $request->query('filter', 'all'); // all, upcoming, past
        $categoryId = $request->query('category_id');

        if (!$referenceId) {
            return $this->sendError('Reference ID is required', 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        try {
            $query = DB::connection('user_db')
                ->table('events')
                ->where('website_id', $referenceId);

            // Apply date filters
            $today = now()->toDateString();
            if ($filter === 'upcoming') {
                $query->where('start_date', '>=', $today);
            } elseif ($filter === 'past') {
                $query->where(function ($q) use ($today) {
                    $q->where('end_date', '<', $today)
                      ->orWhere(function ($q2) use ($today) {
                          $q2->whereNull('end_date')
                             ->where('start_date', '<', $today);
                      });
                });
            }

            // Filter by category
            if ($categoryId) {
                $query->where('category_id', $categoryId);
            }

            $events = $query->orderBy('start_date', 'asc')
                ->orderBy('start_time', 'asc')
                ->get();

            // Get categories for each event
            foreach ($events as $event) {
                if ($event->category_id) {
                    $event->category = DB::connection('user_db')
                        ->table('event_categories')
                        ->where('id', $event->category_id)
                        ->first();
                }
            }

            return $this->sendSuccess($events);
        } catch (\Exception $e) {
            return $this->sendError('Failed to fetch events: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get a single event
     */
    public function show(Request $request, $eventId)
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
            $event = DB::connection('user_db')
                ->table('events')
                ->where('id', $eventId)
                ->where('website_id', $referenceId)
                ->first();

            if (!$event) {
                return $this->sendError('Event not found', 404);
            }

            if ($event->category_id) {
                $event->category = DB::connection('user_db')
                    ->table('event_categories')
                    ->where('id', $event->category_id)
                    ->first();
            }

            return $this->sendSuccess($event);
        } catch (\Exception $e) {
            return $this->sendError('Failed to fetch event: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create a new event
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'content' => 'nullable|string',
            'featured_image' => 'nullable|string|max:500',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'is_all_day' => 'boolean',
            'location' => 'nullable|string|max:500',
            'location_url' => 'nullable|url|max:500',
            'is_online' => 'boolean',
            'online_url' => 'nullable|url|max:500',
            'category_id' => 'nullable|integer',
            'status' => 'required|in:draft,published,cancelled',
            'is_featured' => 'boolean',
            'organizer_name' => 'nullable|string|max:255',
            'organizer_email' => 'nullable|email|max:255',
            'organizer_phone' => 'nullable|string|max:50',
            'ticket_url' => 'nullable|url|max:500',
            'price' => 'nullable|numeric|min:0',
            'price_text' => 'nullable|string|max:100',
            'capacity' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        try {
            // Generate slug if not provided
            $slug = $request->slug ?: Str::slug($request->title);

            // Ensure slug is unique
            $existingSlug = DB::connection('user_db')
                ->table('events')
                ->where('website_id', $request->reference_id)
                ->where('slug', $slug)
                ->exists();

            if ($existingSlug) {
                $slug = $slug . '-' . uniqid();
            }

            $eventId = DB::connection('user_db')
                ->table('events')
                ->insertGetId([
                    'website_id' => $request->reference_id,
                    'title' => $request->title,
                    'slug' => $slug,
                    'description' => $request->description,
                    'content' => $request->content,
                    'featured_image' => $request->featured_image,
                    'start_date' => $request->start_date,
                    'end_date' => $request->end_date,
                    'start_time' => $request->start_time,
                    'end_time' => $request->end_time,
                    'is_all_day' => $request->is_all_day ?? false,
                    'location' => $request->location,
                    'location_url' => $request->location_url,
                    'is_online' => $request->is_online ?? false,
                    'online_url' => $request->online_url,
                    'category_id' => $request->category_id,
                    'status' => $request->status,
                    'is_featured' => $request->is_featured ?? false,
                    'organizer_name' => $request->organizer_name,
                    'organizer_email' => $request->organizer_email,
                    'organizer_phone' => $request->organizer_phone,
                    'ticket_url' => $request->ticket_url,
                    'price' => $request->price,
                    'price_text' => $request->price_text,
                    'capacity' => $request->capacity,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            $event = DB::connection('user_db')
                ->table('events')
                ->where('id', $eventId)
                ->first();

            return $this->sendSuccess($event, 'Event created successfully', 201);
        } catch (\Exception $e) {
            return $this->sendError('Failed to create event: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update an event
     */
    public function update(Request $request, $eventId)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'title' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'content' => 'nullable|string',
            'featured_image' => 'nullable|string|max:500',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'is_all_day' => 'boolean',
            'location' => 'nullable|string|max:500',
            'location_url' => 'nullable|url|max:500',
            'is_online' => 'boolean',
            'online_url' => 'nullable|url|max:500',
            'category_id' => 'nullable|integer',
            'status' => 'sometimes|in:draft,published,cancelled',
            'is_featured' => 'boolean',
            'organizer_name' => 'nullable|string|max:255',
            'organizer_email' => 'nullable|email|max:255',
            'organizer_phone' => 'nullable|string|max:50',
            'ticket_url' => 'nullable|url|max:500',
            'price' => 'nullable|numeric|min:0',
            'price_text' => 'nullable|string|max:100',
            'capacity' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        try {
            $event = DB::connection('user_db')
                ->table('events')
                ->where('id', $eventId)
                ->where('website_id', $request->reference_id)
                ->first();

            if (!$event) {
                return $this->sendError('Event not found', 404);
            }

            $updateData = ['updated_at' => now()];

            $fields = [
                'title', 'slug', 'description', 'content', 'featured_image',
                'start_date', 'end_date', 'start_time', 'end_time', 'is_all_day',
                'location', 'location_url', 'is_online', 'online_url',
                'category_id', 'status', 'is_featured',
                'organizer_name', 'organizer_email', 'organizer_phone',
                'ticket_url', 'price', 'price_text', 'capacity'
            ];

            foreach ($fields as $field) {
                if ($request->has($field)) {
                    $updateData[$field] = $request->$field;
                }
            }

            DB::connection('user_db')
                ->table('events')
                ->where('id', $eventId)
                ->update($updateData);

            $updatedEvent = DB::connection('user_db')
                ->table('events')
                ->where('id', $eventId)
                ->first();

            return $this->sendSuccess($updatedEvent, 'Event updated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to update event: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete an event
     */
    public function destroy(Request $request, $eventId)
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
                ->table('events')
                ->where('id', $eventId)
                ->where('website_id', $referenceId)
                ->delete();

            if (!$deleted) {
                return $this->sendError('Event not found', 404);
            }

            return $this->sendSuccess(null, 'Event deleted successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to delete event: ' . $e->getMessage(), 500);
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

        try {
            $categories = DB::connection('user_db')
                ->table('event_categories')
                ->where('website_id', $referenceId)
                ->orderBy('order')
                ->get();

            // Get event count for each category
            foreach ($categories as $category) {
                $category->event_count = DB::connection('user_db')
                    ->table('events')
                    ->where('category_id', $category->id)
                    ->count();
            }

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
            'color' => 'nullable|string|max:7',
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
                ->table('event_categories')
                ->where('website_id', $request->reference_id)
                ->max('order') ?? -1;

            $categoryId = DB::connection('user_db')
                ->table('event_categories')
                ->insertGetId([
                    'website_id' => $request->reference_id,
                    'name' => $request->name,
                    'slug' => $slug,
                    'description' => $request->description,
                    'color' => $request->color ?? '#98b290',
                    'order' => $maxOrder + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            $category = DB::connection('user_db')
                ->table('event_categories')
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
            'color' => 'nullable|string|max:7',
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
            if ($request->has('color')) {
                $updateData['color'] = $request->color;
            }

            DB::connection('user_db')
                ->table('event_categories')
                ->where('id', $categoryId)
                ->where('website_id', $request->reference_id)
                ->update($updateData);

            $category = DB::connection('user_db')
                ->table('event_categories')
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
            // Set events with this category to null
            DB::connection('user_db')
                ->table('events')
                ->where('category_id', $categoryId)
                ->update(['category_id' => null]);

            $deleted = DB::connection('user_db')
                ->table('event_categories')
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
     * Get events for calendar view (by month)
     */
    public function getCalendarEvents(Request $request)
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');
        $year = $request->query('year', now()->year);
        $month = $request->query('month', now()->month);

        if (!$referenceId) {
            return $this->sendError('Reference ID is required', 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return $this->sendError('Database not found', 404);
        }

        try {
            $startOfMonth = \Carbon\Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
            $endOfMonth = \Carbon\Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

            $events = DB::connection('user_db')
                ->table('events')
                ->where('website_id', $referenceId)
                ->where('status', 'published')
                ->where(function ($query) use ($startOfMonth, $endOfMonth) {
                    $query->whereBetween('start_date', [$startOfMonth, $endOfMonth])
                          ->orWhereBetween('end_date', [$startOfMonth, $endOfMonth])
                          ->orWhere(function ($q) use ($startOfMonth, $endOfMonth) {
                              $q->where('start_date', '<=', $startOfMonth)
                                ->where('end_date', '>=', $endOfMonth);
                          });
                })
                ->orderBy('start_date')
                ->orderBy('start_time')
                ->get();

            // Get categories for each event
            foreach ($events as $event) {
                if ($event->category_id) {
                    $event->category = DB::connection('user_db')
                        ->table('event_categories')
                        ->where('id', $event->category_id)
                        ->first();
                }
            }

            return $this->sendSuccess([
                'events' => $events,
                'year' => (int) $year,
                'month' => (int) $month,
            ]);
        } catch (\Exception $e) {
            return $this->sendError('Failed to fetch calendar events: ' . $e->getMessage(), 500);
        }
    }
}
