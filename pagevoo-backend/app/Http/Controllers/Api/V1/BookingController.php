<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DatabaseInstance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

class BookingController extends Controller
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

    // ==================== DASHBOARD ====================

    /**
     * Get dashboard stats
     */
    public function dashboard(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $today = Carbon::today()->toDateString();
            $weekStart = Carbon::now()->startOfWeek()->toDateString();
            $weekEnd = Carbon::now()->endOfWeek()->toDateString();
            $monthStart = Carbon::now()->startOfMonth()->toDateString();
            $monthEnd = Carbon::now()->endOfMonth()->toDateString();

            $stats = [
                'today' => DB::connection('user_db')
                    ->table('bookings')
                    ->where('booking_date', $today)
                    ->whereNotIn('status', ['cancelled'])
                    ->count(),
                'pending' => DB::connection('user_db')
                    ->table('bookings')
                    ->where('status', 'pending')
                    ->count(),
                'upcoming' => DB::connection('user_db')
                    ->table('bookings')
                    ->where('booking_date', '>=', $today)
                    ->whereNotIn('status', ['cancelled', 'completed'])
                    ->count(),
                'this_week' => DB::connection('user_db')
                    ->table('bookings')
                    ->whereBetween('booking_date', [$weekStart, $weekEnd])
                    ->whereNotIn('status', ['cancelled'])
                    ->count(),
                'this_month' => DB::connection('user_db')
                    ->table('bookings')
                    ->whereBetween('booking_date', [$monthStart, $monthEnd])
                    ->whereNotIn('status', ['cancelled'])
                    ->count(),
            ];

            return response()->json(['success' => true, 'data' => $stats]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch stats: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get calendar events
     */
    public function getCalendarEvents(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');
        $startDate = $request->query('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', Carbon::now()->endOfMonth()->toDateString());

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $bookings = DB::connection('user_db')
                ->table('bookings')
                ->leftJoin('booking_services', 'bookings.service_id', '=', 'booking_services.id')
                ->leftJoin('booking_staff', 'bookings.staff_id', '=', 'booking_staff.id')
                ->whereBetween('bookings.booking_date', [$startDate, $endDate])
                ->whereNotIn('bookings.status', ['cancelled'])
                ->select(
                    'bookings.*',
                    'booking_services.name as service_name',
                    'booking_services.color as service_color',
                    'booking_staff.name as staff_name',
                    'booking_staff.color as staff_color'
                )
                ->orderBy('bookings.booking_date')
                ->orderBy('bookings.start_time')
                ->get();

            $events = $bookings->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'title' => $booking->customer_name . ' - ' . ($booking->service_name ?? 'Service'),
                    'start' => $booking->booking_date . 'T' . $booking->start_time,
                    'end' => $booking->booking_date . 'T' . $booking->end_time,
                    'color' => $booking->staff_color ?? $booking->service_color ?? '#3B82F6',
                    'status' => $booking->status,
                    'booking' => $booking,
                ];
            });

            return response()->json(['success' => true, 'data' => $events]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch calendar events: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get available time slots for a service on a date
     */
    public function getAvailableSlots(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');
        $serviceId = $request->query('service_id');
        $date = $request->query('date');
        $staffId = $request->query('staff_id');

        if (!$referenceId || !$serviceId || !$date) {
            return response()->json(['error' => 'Reference ID, service_id, and date are required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            // Get service
            $service = DB::connection('user_db')
                ->table('booking_services')
                ->where('id', $serviceId)
                ->first();

            if (!$service) {
                return response()->json(['error' => 'Service not found'], 404);
            }

            // Get day of week (0 = Sunday, 6 = Saturday)
            $dayOfWeek = Carbon::parse($date)->dayOfWeek;

            // Get business hours
            $businessHours = DB::connection('user_db')
                ->table('booking_business_hours')
                ->where('day_of_week', $dayOfWeek)
                ->where(function ($q) use ($staffId) {
                    if ($staffId) {
                        $q->where('staff_id', $staffId);
                    } else {
                        $q->whereNull('staff_id');
                    }
                })
                ->first();

            if (!$businessHours || !$businessHours->is_open) {
                return response()->json(['success' => true, 'data' => []]);
            }

            // Check for availability overrides
            $dayBlocked = DB::connection('user_db')
                ->table('booking_availability')
                ->where('date', $date)
                ->where('type', 'unavailable')
                ->where(function ($q) use ($staffId) {
                    if ($staffId) {
                        $q->where('staff_id', $staffId);
                    } else {
                        $q->whereNull('staff_id');
                    }
                })
                ->whereNull('start_time') // All day block
                ->exists();

            if ($dayBlocked) {
                return response()->json(['success' => true, 'data' => []]);
            }

            // Get existing bookings for the date
            $existingBookings = DB::connection('user_db')
                ->table('bookings')
                ->where('booking_date', $date)
                ->where('service_id', $serviceId)
                ->whereNotIn('status', ['cancelled'])
                ->when($staffId, function ($q) use ($staffId) {
                    $q->where('staff_id', $staffId);
                })
                ->get();

            // Generate available slots
            $slots = [];
            $settings = $this->getSettingsArray($referenceId);
            $slotInterval = $settings['slot_interval_minutes'] ?? 15;
            $duration = $service->duration_minutes ?? 60;
            $bufferBefore = $service->buffer_before_minutes ?? 0;
            $bufferAfter = $service->buffer_after_minutes ?? 0;

            $openTime = strtotime($businessHours->open_time);
            $closeTime = strtotime($businessHours->close_time);
            $breakStart = $businessHours->break_start ? strtotime($businessHours->break_start) : null;
            $breakEnd = $businessHours->break_end ? strtotime($businessHours->break_end) : null;

            $currentTime = $openTime;

            while ($currentTime + ($duration * 60) <= $closeTime) {
                $slotStart = $currentTime;
                $slotEnd = $currentTime + ($duration * 60);

                // Check if slot is during break
                if ($breakStart && $breakEnd) {
                    if ($slotStart < $breakEnd && $slotEnd > $breakStart) {
                        $currentTime += $slotInterval * 60;
                        continue;
                    }
                }

                // Check if slot conflicts with existing bookings
                $conflict = false;
                foreach ($existingBookings as $booking) {
                    $bookingStart = strtotime($booking->start_time) - ($bufferBefore * 60);
                    $bookingEnd = strtotime($booking->end_time) + ($bufferAfter * 60);

                    if ($slotStart < $bookingEnd && $slotEnd > $bookingStart) {
                        $conflict = true;
                        break;
                    }
                }

                if (!$conflict) {
                    $slots[] = [
                        'start' => date('H:i', $slotStart),
                        'end' => date('H:i', $slotEnd),
                        'available' => true,
                    ];
                }

                $currentTime += $slotInterval * 60;
            }

            return response()->json(['success' => true, 'data' => $slots]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch available slots: ' . $e->getMessage()], 500);
        }
    }

    // ==================== BOOKINGS ====================

    /**
     * Get all bookings with optional filters
     */
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $query = DB::connection('user_db')
                ->table('bookings')
                ->leftJoin('booking_services', 'bookings.service_id', '=', 'booking_services.id')
                ->leftJoin('booking_staff', 'bookings.staff_id', '=', 'booking_staff.id')
                ->select(
                    'bookings.*',
                    'booking_services.name as service_name',
                    'booking_services.duration_minutes as service_duration',
                    'booking_services.price as service_price',
                    'booking_staff.name as staff_name'
                );

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('bookings.status', $request->status);
            }

            // Filter by service
            if ($request->has('service_id') && $request->service_id) {
                $query->where('bookings.service_id', $request->service_id);
            }

            // Filter by staff
            if ($request->has('staff_id') && $request->staff_id) {
                $query->where('bookings.staff_id', $request->staff_id);
            }

            // Filter by date range
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('bookings.booking_date', [$request->start_date, $request->end_date]);
            } elseif ($request->has('date')) {
                $query->where('bookings.booking_date', $request->date);
            }

            // Filter upcoming only
            if ($request->boolean('upcoming')) {
                $query->where('bookings.booking_date', '>=', Carbon::today()->toDateString())
                    ->whereNotIn('bookings.status', ['cancelled', 'completed']);
            }

            // Search by customer
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('bookings.customer_name', 'like', "%{$search}%")
                        ->orWhere('bookings.customer_email', 'like', "%{$search}%")
                        ->orWhere('bookings.customer_phone', 'like', "%{$search}%")
                        ->orWhere('bookings.booking_reference', 'like', "%{$search}%");
                });
            }

            $bookings = $query->orderBy('bookings.booking_date', 'desc')
                ->orderBy('bookings.start_time', 'asc')
                ->get();

            // Transform to include service and staff as nested objects
            $bookings = $bookings->map(function ($booking) {
                $booking->service = $booking->service_name ? (object) [
                    'id' => $booking->service_id,
                    'name' => $booking->service_name,
                    'duration_minutes' => $booking->service_duration,
                    'price' => $booking->service_price,
                ] : null;
                $booking->staff = $booking->staff_name ? (object) [
                    'id' => $booking->staff_id,
                    'name' => $booking->staff_name,
                ] : null;
                return $booking;
            });

            return response()->json(['success' => true, 'data' => $bookings]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch bookings: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get a single booking
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $booking = DB::connection('user_db')
                ->table('bookings')
                ->leftJoin('booking_services', 'bookings.service_id', '=', 'booking_services.id')
                ->leftJoin('booking_staff', 'bookings.staff_id', '=', 'booking_staff.id')
                ->leftJoin('booking_resources', 'bookings.resource_id', '=', 'booking_resources.id')
                ->where('bookings.id', $id)
                ->select(
                    'bookings.*',
                    'booking_services.name as service_name',
                    'booking_services.duration_minutes as service_duration',
                    'booking_services.price as service_price',
                    'booking_staff.name as staff_name',
                    'booking_resources.name as resource_name'
                )
                ->first();

            if (!$booking) {
                return response()->json(['error' => 'Booking not found'], 404);
            }

            // Add nested objects
            $booking->service = $booking->service_name ? (object) [
                'id' => $booking->service_id,
                'name' => $booking->service_name,
                'duration_minutes' => $booking->service_duration,
                'price' => $booking->service_price,
            ] : null;
            $booking->staff = $booking->staff_name ? (object) [
                'id' => $booking->staff_id,
                'name' => $booking->staff_name,
            ] : null;
            $booking->resource = $booking->resource_name ? (object) [
                'id' => $booking->resource_id,
                'name' => $booking->resource_name,
            ] : null;

            return response()->json(['success' => true, 'data' => $booking]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch booking: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a new booking
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'service_id' => 'required|integer',
            'staff_id' => 'nullable|integer',
            'resource_id' => 'nullable|integer',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'customer_notes' => 'nullable|string',
            'booking_date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'party_size' => 'nullable|integer|min:1',
            'status' => 'nullable|string',
            'total_price' => 'nullable|numeric',
            'admin_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            // Generate booking reference
            $bookingReference = 'BK-' . strtoupper(Str::random(8));

            $bookingId = DB::connection('user_db')
                ->table('bookings')
                ->insertGetId([
                    'service_id' => $request->service_id,
                    'staff_id' => $request->staff_id,
                    'resource_id' => $request->resource_id,
                    'customer_name' => $request->customer_name,
                    'customer_email' => $request->customer_email,
                    'customer_phone' => $request->customer_phone,
                    'customer_notes' => $request->customer_notes,
                    'booking_date' => $request->booking_date,
                    'start_time' => $request->start_time,
                    'end_time' => $request->end_time,
                    'party_size' => $request->party_size ?? 1,
                    'booking_reference' => $bookingReference,
                    'status' => $request->status ?? 'pending',
                    'total_price' => $request->total_price,
                    'payment_status' => 'unpaid',
                    'admin_notes' => $request->admin_notes,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            $booking = DB::connection('user_db')
                ->table('bookings')
                ->where('id', $bookingId)
                ->first();

            return response()->json(['success' => true, 'data' => $booking, 'message' => 'Booking created successfully'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create booking: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a booking
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $booking = DB::connection('user_db')
                ->table('bookings')
                ->where('id', $id)
                ->first();

            if (!$booking) {
                return response()->json(['error' => 'Booking not found'], 404);
            }

            $updateData = ['updated_at' => now()];

            $fields = ['service_id', 'staff_id', 'resource_id', 'customer_name', 'customer_email',
                'customer_phone', 'customer_notes', 'booking_date', 'start_time', 'end_time',
                'party_size', 'status', 'cancellation_reason', 'total_price', 'deposit_paid',
                'amount_paid', 'payment_status', 'payment_method', 'payment_reference', 'admin_notes'];

            foreach ($fields as $field) {
                if ($request->has($field)) {
                    $updateData[$field] = $request->$field;
                }
            }

            // Handle status change to cancelled
            if (isset($updateData['status']) && $updateData['status'] === 'cancelled' && $booking->status !== 'cancelled') {
                $updateData['cancelled_at'] = now();
            }

            DB::connection('user_db')
                ->table('bookings')
                ->where('id', $id)
                ->update($updateData);

            $updatedBooking = DB::connection('user_db')
                ->table('bookings')
                ->where('id', $id)
                ->first();

            return response()->json(['success' => true, 'data' => $updatedBooking, 'message' => 'Booking updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update booking: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a booking
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $deleted = DB::connection('user_db')
                ->table('bookings')
                ->where('id', $id)
                ->delete();

            if (!$deleted) {
                return response()->json(['error' => 'Booking not found'], 404);
            }

            return response()->json(['success' => true, 'message' => 'Booking deleted']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete booking: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Confirm a booking
     */
    public function confirm(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $updated = DB::connection('user_db')
                ->table('bookings')
                ->where('id', $id)
                ->update([
                    'status' => 'confirmed',
                    'confirmed_at' => now(),
                    'updated_at' => now(),
                ]);

            if (!$updated) {
                return response()->json(['error' => 'Booking not found'], 404);
            }

            $booking = DB::connection('user_db')
                ->table('bookings')
                ->where('id', $id)
                ->first();

            return response()->json(['success' => true, 'data' => $booking, 'message' => 'Booking confirmed']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to confirm booking: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cancel a booking
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'cancellation_reason' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $updated = DB::connection('user_db')
                ->table('bookings')
                ->where('id', $id)
                ->update([
                    'status' => 'cancelled',
                    'cancellation_reason' => $request->cancellation_reason,
                    'cancelled_at' => now(),
                    'updated_at' => now(),
                ]);

            if (!$updated) {
                return response()->json(['error' => 'Booking not found'], 404);
            }

            $booking = DB::connection('user_db')
                ->table('bookings')
                ->where('id', $id)
                ->first();

            return response()->json(['success' => true, 'data' => $booking, 'message' => 'Booking cancelled']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to cancel booking: ' . $e->getMessage()], 500);
        }
    }

    // ==================== SERVICES ====================

    /**
     * Get all services
     */
    public function getServices(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $services = DB::connection('user_db')
                ->table('booking_services')
                ->leftJoin('booking_categories', 'booking_services.category_id', '=', 'booking_categories.id')
                ->select('booking_services.*', 'booking_categories.name as category_name')
                ->orderBy('booking_services.order')
                ->get();

            // Get staff for each service
            foreach ($services as $service) {
                $service->staff = DB::connection('user_db')
                    ->table('booking_staff_services')
                    ->join('booking_staff', 'booking_staff_services.staff_id', '=', 'booking_staff.id')
                    ->where('booking_staff_services.service_id', $service->id)
                    ->select('booking_staff.*')
                    ->get();

                $service->category = $service->category_name ? (object) [
                    'id' => $service->category_id,
                    'name' => $service->category_name,
                ] : null;
            }

            return response()->json(['success' => true, 'data' => $services]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch services: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a service
     */
    public function storeService(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|integer',
            'description' => 'nullable|string',
            'duration_minutes' => 'nullable|integer|min:1',
            'price' => 'nullable|numeric|min:0',
            'capacity' => 'nullable|integer|min:1',
            'staff_ids' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            // Generate slug
            $slug = Str::slug($request->name);
            $baseSlug = $slug;
            $counter = 1;
            while (DB::connection('user_db')->table('booking_services')->where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }

            // Get max order
            $maxOrder = DB::connection('user_db')
                ->table('booking_services')
                ->max('order') ?? -1;

            $serviceId = DB::connection('user_db')
                ->table('booking_services')
                ->insertGetId([
                    'name' => $request->name,
                    'slug' => $slug,
                    'category_id' => $request->category_id,
                    'description' => $request->description,
                    'duration_minutes' => $request->duration_minutes ?? 60,
                    'buffer_before_minutes' => $request->buffer_before_minutes ?? 0,
                    'buffer_after_minutes' => $request->buffer_after_minutes ?? 0,
                    'capacity' => $request->capacity ?? 1,
                    'pricing_type' => $request->pricing_type ?? 'fixed',
                    'price' => $request->price ?? 0,
                    'is_active' => true,
                    'order' => $maxOrder + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            // Attach staff
            if (!empty($request->staff_ids)) {
                foreach ($request->staff_ids as $staffId) {
                    DB::connection('user_db')
                        ->table('booking_staff_services')
                        ->insert([
                            'staff_id' => $staffId,
                            'service_id' => $serviceId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                }
            }

            $service = DB::connection('user_db')
                ->table('booking_services')
                ->where('id', $serviceId)
                ->first();

            return response()->json(['success' => true, 'data' => $service, 'message' => 'Service created successfully'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create service: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a service
     */
    public function updateService(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $service = DB::connection('user_db')
                ->table('booking_services')
                ->where('id', $id)
                ->first();

            if (!$service) {
                return response()->json(['error' => 'Service not found'], 404);
            }

            $updateData = ['updated_at' => now()];

            $fields = ['name', 'category_id', 'description', 'featured_image', 'type',
                'duration_minutes', 'buffer_before_minutes', 'buffer_after_minutes',
                'capacity', 'min_party_size', 'max_party_size', 'pricing_type', 'price',
                'currency', 'is_active', 'order', 'color'];

            foreach ($fields as $field) {
                if ($request->has($field)) {
                    $updateData[$field] = $request->$field;
                }
            }

            // Update slug if name changed
            if (isset($updateData['name']) && $updateData['name'] !== $service->name) {
                $slug = Str::slug($updateData['name']);
                $baseSlug = $slug;
                $counter = 1;
                while (DB::connection('user_db')->table('booking_services')->where('slug', $slug)->where('id', '!=', $id)->exists()) {
                    $slug = $baseSlug . '-' . $counter++;
                }
                $updateData['slug'] = $slug;
            }

            DB::connection('user_db')
                ->table('booking_services')
                ->where('id', $id)
                ->update($updateData);

            // Sync staff if provided
            if ($request->has('staff_ids')) {
                DB::connection('user_db')
                    ->table('booking_staff_services')
                    ->where('service_id', $id)
                    ->delete();

                foreach ($request->staff_ids as $staffId) {
                    DB::connection('user_db')
                        ->table('booking_staff_services')
                        ->insert([
                            'staff_id' => $staffId,
                            'service_id' => $id,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                }
            }

            $updatedService = DB::connection('user_db')
                ->table('booking_services')
                ->where('id', $id)
                ->first();

            return response()->json(['success' => true, 'data' => $updatedService, 'message' => 'Service updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update service: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a service
     */
    public function destroyService(Request $request, int $id): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            // Delete staff associations
            DB::connection('user_db')
                ->table('booking_staff_services')
                ->where('service_id', $id)
                ->delete();

            $deleted = DB::connection('user_db')
                ->table('booking_services')
                ->where('id', $id)
                ->delete();

            if (!$deleted) {
                return response()->json(['error' => 'Service not found'], 404);
            }

            return response()->json(['success' => true, 'message' => 'Service deleted']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete service: ' . $e->getMessage()], 500);
        }
    }

    // ==================== CATEGORIES ====================

    /**
     * Get all categories
     */
    public function getCategories(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $categories = DB::connection('user_db')
                ->table('booking_categories')
                ->orderBy('order')
                ->get();

            // Add services count
            foreach ($categories as $category) {
                $category->services_count = DB::connection('user_db')
                    ->table('booking_services')
                    ->where('category_id', $category->id)
                    ->count();
            }

            return response()->json(['success' => true, 'data' => $categories]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch categories: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a category
     */
    public function storeCategory(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $slug = Str::slug($request->name);
            $maxOrder = DB::connection('user_db')
                ->table('booking_categories')
                ->max('order') ?? -1;

            $categoryId = DB::connection('user_db')
                ->table('booking_categories')
                ->insertGetId([
                    'name' => $request->name,
                    'slug' => $slug,
                    'description' => $request->description,
                    'color' => $request->color ?? '#3B82F6',
                    'is_active' => true,
                    'order' => $maxOrder + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            $category = DB::connection('user_db')
                ->table('booking_categories')
                ->where('id', $categoryId)
                ->first();

            return response()->json(['success' => true, 'data' => $category, 'message' => 'Category created successfully'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create category: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a category
     */
    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $updateData = ['updated_at' => now()];

            if ($request->has('name')) {
                $updateData['name'] = $request->name;
                $updateData['slug'] = Str::slug($request->name);
            }
            if ($request->has('description')) $updateData['description'] = $request->description;
            if ($request->has('color')) $updateData['color'] = $request->color;
            if ($request->has('is_active')) $updateData['is_active'] = $request->is_active;
            if ($request->has('order')) $updateData['order'] = $request->order;

            $updated = DB::connection('user_db')
                ->table('booking_categories')
                ->where('id', $id)
                ->update($updateData);

            if (!$updated) {
                return response()->json(['error' => 'Category not found'], 404);
            }

            $category = DB::connection('user_db')
                ->table('booking_categories')
                ->where('id', $id)
                ->first();

            return response()->json(['success' => true, 'data' => $category, 'message' => 'Category updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update category: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a category
     */
    public function destroyCategory(Request $request, int $id): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            // Set services with this category to null
            DB::connection('user_db')
                ->table('booking_services')
                ->where('category_id', $id)
                ->update(['category_id' => null]);

            $deleted = DB::connection('user_db')
                ->table('booking_categories')
                ->where('id', $id)
                ->delete();

            if (!$deleted) {
                return response()->json(['error' => 'Category not found'], 404);
            }

            return response()->json(['success' => true, 'message' => 'Category deleted']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete category: ' . $e->getMessage()], 500);
        }
    }

    // ==================== STAFF ====================

    /**
     * Get all staff
     */
    public function getStaff(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $staff = DB::connection('user_db')
                ->table('booking_staff')
                ->orderBy('order')
                ->get();

            // Get services for each staff member
            foreach ($staff as $member) {
                $member->services = DB::connection('user_db')
                    ->table('booking_staff_services')
                    ->join('booking_services', 'booking_staff_services.service_id', '=', 'booking_services.id')
                    ->where('booking_staff_services.staff_id', $member->id)
                    ->select('booking_services.*')
                    ->get();
            }

            return response()->json(['success' => true, 'data' => $staff]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch staff: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a staff member
     */
    public function storeStaff(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'title' => 'nullable|string|max:100',
            'bio' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'service_ids' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $maxOrder = DB::connection('user_db')
                ->table('booking_staff')
                ->max('order') ?? -1;

            $staffId = DB::connection('user_db')
                ->table('booking_staff')
                ->insertGetId([
                    'name' => $request->name,
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'title' => $request->title,
                    'bio' => $request->bio,
                    'color' => $request->color ?? '#3B82F6',
                    'is_active' => true,
                    'order' => $maxOrder + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            // Attach services
            if (!empty($request->service_ids)) {
                foreach ($request->service_ids as $serviceId) {
                    DB::connection('user_db')
                        ->table('booking_staff_services')
                        ->insert([
                            'staff_id' => $staffId,
                            'service_id' => $serviceId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                }
            }

            $staff = DB::connection('user_db')
                ->table('booking_staff')
                ->where('id', $staffId)
                ->first();

            return response()->json(['success' => true, 'data' => $staff, 'message' => 'Staff member created successfully'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create staff member: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a staff member
     */
    public function updateStaff(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $staff = DB::connection('user_db')
                ->table('booking_staff')
                ->where('id', $id)
                ->first();

            if (!$staff) {
                return response()->json(['error' => 'Staff member not found'], 404);
            }

            $updateData = ['updated_at' => now()];

            $fields = ['name', 'email', 'phone', 'title', 'bio', 'avatar', 'color', 'is_active', 'order'];

            foreach ($fields as $field) {
                if ($request->has($field)) {
                    $updateData[$field] = $request->$field;
                }
            }

            DB::connection('user_db')
                ->table('booking_staff')
                ->where('id', $id)
                ->update($updateData);

            // Sync services if provided
            if ($request->has('service_ids')) {
                DB::connection('user_db')
                    ->table('booking_staff_services')
                    ->where('staff_id', $id)
                    ->delete();

                foreach ($request->service_ids as $serviceId) {
                    DB::connection('user_db')
                        ->table('booking_staff_services')
                        ->insert([
                            'staff_id' => $id,
                            'service_id' => $serviceId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                }
            }

            $updatedStaff = DB::connection('user_db')
                ->table('booking_staff')
                ->where('id', $id)
                ->first();

            return response()->json(['success' => true, 'data' => $updatedStaff, 'message' => 'Staff member updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update staff member: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a staff member
     */
    public function destroyStaff(Request $request, int $id): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            // Delete service associations
            DB::connection('user_db')
                ->table('booking_staff_services')
                ->where('staff_id', $id)
                ->delete();

            // Delete business hours
            DB::connection('user_db')
                ->table('booking_business_hours')
                ->where('staff_id', $id)
                ->delete();

            $deleted = DB::connection('user_db')
                ->table('booking_staff')
                ->where('id', $id)
                ->delete();

            if (!$deleted) {
                return response()->json(['error' => 'Staff member not found'], 404);
            }

            return response()->json(['success' => true, 'message' => 'Staff member deleted']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete staff member: ' . $e->getMessage()], 500);
        }
    }

    // ==================== RESOURCES ====================

    /**
     * Get all resources
     */
    public function getResources(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $resources = DB::connection('user_db')
                ->table('booking_resources')
                ->orderBy('order')
                ->get();

            return response()->json(['success' => true, 'data' => $resources]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch resources: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a resource
     */
    public function storeResource(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'capacity' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $maxOrder = DB::connection('user_db')
                ->table('booking_resources')
                ->max('order') ?? -1;

            $resourceId = DB::connection('user_db')
                ->table('booking_resources')
                ->insertGetId([
                    'name' => $request->name,
                    'description' => $request->description,
                    'capacity' => $request->capacity ?? 1,
                    'is_active' => true,
                    'order' => $maxOrder + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            $resource = DB::connection('user_db')
                ->table('booking_resources')
                ->where('id', $resourceId)
                ->first();

            return response()->json(['success' => true, 'data' => $resource, 'message' => 'Resource created successfully'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create resource: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a resource
     */
    public function updateResource(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $updateData = ['updated_at' => now()];

            $fields = ['name', 'description', 'capacity', 'is_active', 'order'];

            foreach ($fields as $field) {
                if ($request->has($field)) {
                    $updateData[$field] = $request->$field;
                }
            }

            $updated = DB::connection('user_db')
                ->table('booking_resources')
                ->where('id', $id)
                ->update($updateData);

            if (!$updated) {
                return response()->json(['error' => 'Resource not found'], 404);
            }

            $resource = DB::connection('user_db')
                ->table('booking_resources')
                ->where('id', $id)
                ->first();

            return response()->json(['success' => true, 'data' => $resource, 'message' => 'Resource updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update resource: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a resource
     */
    public function destroyResource(Request $request, int $id): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $deleted = DB::connection('user_db')
                ->table('booking_resources')
                ->where('id', $id)
                ->delete();

            if (!$deleted) {
                return response()->json(['error' => 'Resource not found'], 404);
            }

            return response()->json(['success' => true, 'message' => 'Resource deleted']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete resource: ' . $e->getMessage()], 500);
        }
    }

    // ==================== BUSINESS HOURS ====================

    /**
     * Get business hours
     */
    public function getBusinessHours(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');
        $staffId = $request->query('staff_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $query = DB::connection('user_db')
                ->table('booking_business_hours');

            if ($staffId) {
                $query->where('staff_id', $staffId);
            } else {
                $query->whereNull('staff_id');
            }

            $hours = $query->orderBy('day_of_week')->get();

            return response()->json(['success' => true, 'data' => $hours]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch business hours: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update business hours
     */
    public function updateBusinessHours(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'staff_id' => 'nullable|integer',
            'hours' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $staffId = $request->staff_id;

            foreach ($request->hours as $hourData) {
                DB::connection('user_db')
                    ->table('booking_business_hours')
                    ->updateOrInsert(
                        [
                            'staff_id' => $staffId,
                            'day_of_week' => $hourData['day_of_week'],
                        ],
                        [
                            'is_open' => $hourData['is_open'] ?? false,
                            'open_time' => $hourData['open_time'] ?? null,
                            'close_time' => $hourData['close_time'] ?? null,
                            'break_start' => $hourData['break_start'] ?? null,
                            'break_end' => $hourData['break_end'] ?? null,
                            'updated_at' => now(),
                        ]
                    );
            }

            $query = DB::connection('user_db')
                ->table('booking_business_hours');

            if ($staffId) {
                $query->where('staff_id', $staffId);
            } else {
                $query->whereNull('staff_id');
            }

            $hours = $query->orderBy('day_of_week')->get();

            return response()->json(['success' => true, 'data' => $hours, 'message' => 'Business hours updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update business hours: ' . $e->getMessage()], 500);
        }
    }

    // ==================== AVAILABILITY ====================

    /**
     * Get availability overrides
     */
    public function getAvailability(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $query = DB::connection('user_db')
                ->table('booking_availability');

            if ($request->has('staff_id')) {
                $query->where('staff_id', $request->staff_id);
            }

            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('date', [$request->start_date, $request->end_date]);
            }

            $availability = $query->orderBy('date')->get();

            return response()->json(['success' => true, 'data' => $availability]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch availability: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create availability override
     */
    public function storeAvailability(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
            'date' => 'required|date',
            'availability_type' => 'required|in:available,unavailable',
            'staff_id' => 'nullable|integer',
            'start_time' => 'nullable',
            'end_time' => 'nullable',
            'reason' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $availabilityId = DB::connection('user_db')
                ->table('booking_availability')
                ->insertGetId([
                    'staff_id' => $request->staff_id,
                    'date' => $request->date,
                    'type' => $request->availability_type,
                    'start_time' => $request->start_time,
                    'end_time' => $request->end_time,
                    'reason' => $request->reason,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            $availability = DB::connection('user_db')
                ->table('booking_availability')
                ->where('id', $availabilityId)
                ->first();

            return response()->json(['success' => true, 'data' => $availability, 'message' => 'Availability override created'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create availability override: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete availability override
     */
    public function destroyAvailability(Request $request, int $id): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $deleted = DB::connection('user_db')
                ->table('booking_availability')
                ->where('id', $id)
                ->delete();

            if (!$deleted) {
                return response()->json(['error' => 'Availability override not found'], 404);
            }

            return response()->json(['success' => true, 'message' => 'Availability override deleted']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete availability override: ' . $e->getMessage()], 500);
        }
    }

    // ==================== SETTINGS ====================

    /**
     * Get all settings
     */
    public function getSettings(Request $request): JsonResponse
    {
        $type = $request->query('type', 'template');
        $referenceId = $request->query('reference_id');

        if (!$referenceId) {
            return response()->json(['error' => 'Reference ID is required'], 400);
        }

        $dbName = $this->connectToUserDatabase($type, $referenceId);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $settings = $this->getSettingsArray($referenceId);
            return response()->json(['success' => true, 'data' => $settings]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch settings: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:template,website',
            'reference_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validation Error', 'details' => $validator->errors()], 422);
        }

        $dbName = $this->connectToUserDatabase($request->type, $request->reference_id);
        if (!$dbName) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        try {
            $settingsToUpdate = $request->except(['type', 'reference_id']);

            foreach ($settingsToUpdate as $key => $value) {
                DB::connection('user_db')
                    ->table('booking_settings')
                    ->updateOrInsert(
                        ['key' => $key],
                        [
                            'value' => is_array($value) ? json_encode($value) : $value,
                            'updated_at' => now(),
                        ]
                    );
            }

            $settings = $this->getSettingsArray($request->reference_id);
            return response()->json(['success' => true, 'data' => $settings, 'message' => 'Settings updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update settings: ' . $e->getMessage()], 500);
        }
    }

    // ==================== HELPERS ====================

    /**
     * Get settings as array
     */
    private function getSettingsArray(int $referenceId): array
    {
        $settingsRows = DB::connection('user_db')
            ->table('booking_settings')
            ->get();

        $settings = [];
        foreach ($settingsRows as $row) {
            $value = $row->value;
            // Try to decode JSON values
            $decoded = json_decode($value, true);
            $settings[$row->key] = $decoded !== null ? $decoded : $value;
        }

        // Defaults
        return array_merge([
            'currency' => 'USD',
            'timezone' => 'America/New_York',
            'slot_interval_minutes' => 15,
            'min_advance_booking_hours' => 2,
            'max_advance_booking_days' => 60,
            'require_payment' => false,
            'send_confirmation_email' => true,
            'send_reminder_email' => true,
            'reminder_hours_before' => 24,
        ], $settings);
    }
}
