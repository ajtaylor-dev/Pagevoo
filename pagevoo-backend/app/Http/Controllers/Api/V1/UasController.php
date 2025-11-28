<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Uas\UasUser;
use App\Models\Uas\UasGroup;
use App\Models\Uas\UasPageAccess;
use App\Models\Uas\UasPermissionDefinition;
use App\Models\Uas\UasSetting;
use App\Models\Uas\UasActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UasController extends Controller
{
    protected $connection;

    public function __construct(Request $request)
    {
        // Get database connection from request (set by middleware)
        $this->connection = $request->get('db_connection', 'mysql');
    }

    // ==================== USERS ====================

    /**
     * List all users with pagination
     */
    public function getUsers(Request $request): JsonResponse
    {
        $query = UasUser::on($this->connection)
            ->with('group')
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by group
        if ($request->has('group_id')) {
            $query->where('group_id', $request->group_id);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('display_name', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 20);
        $users = $query->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Get a single user
     */
    public function getUser(int $id): JsonResponse
    {
        $user = UasUser::on($this->connection)
            ->with(['group', 'securityAnswers.question'])
            ->findOrFail($id);

        return response()->json($user);
    }

    /**
     * Create a new user (admin creation - skips email verification)
     */
    public function createUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:8',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'display_name' => 'nullable|string|max:255',
            'group_id' => 'required|integer',
            'status' => 'nullable|in:pending,active,suspended',
        ]);

        // Check email doesn't already exist
        $exists = UasUser::on($this->connection)
            ->where('email', $validated['email'])
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Email already registered'], 422);
        }

        $user = UasUser::on($this->connection)->create([
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'display_name' => $validated['display_name'] ?? null,
            'group_id' => $validated['group_id'],
            'status' => $validated['status'] ?? 'active',
            'email_verified' => true, // Admin-created users are pre-verified
            'email_verified_at' => now(),
        ]);

        UasActivityLog::on($this->connection)->log(
            'admin_create_user',
            null,
            $request->ip(),
            $request->userAgent(),
            ['created_user_id' => $user->id]
        );

        return response()->json($user->load('group'), 201);
    }

    /**
     * Update a user
     */
    public function updateUser(Request $request, int $id): JsonResponse
    {
        $user = UasUser::on($this->connection)->findOrFail($id);

        $validated = $request->validate([
            'email' => 'nullable|email',
            'password' => 'nullable|min:8',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'display_name' => 'nullable|string|max:255',
            'group_id' => 'nullable|integer',
            'status' => 'nullable|in:pending,active,suspended',
            'permission_overrides' => 'nullable|array',
        ]);

        // Check email uniqueness if changing
        if (isset($validated['email']) && $validated['email'] !== $user->email) {
            $exists = UasUser::on($this->connection)
                ->where('email', $validated['email'])
                ->where('id', '!=', $id)
                ->exists();

            if ($exists) {
                return response()->json(['error' => 'Email already registered'], 422);
            }
        }

        // Hash password if provided
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update(array_filter($validated, fn($v) => $v !== null));

        UasActivityLog::on($this->connection)->log(
            'admin_update_user',
            null,
            $request->ip(),
            $request->userAgent(),
            ['updated_user_id' => $user->id]
        );

        return response()->json($user->load('group'));
    }

    /**
     * Delete a user
     */
    public function deleteUser(Request $request, int $id): JsonResponse
    {
        $user = UasUser::on($this->connection)->findOrFail($id);

        UasActivityLog::on($this->connection)->log(
            'admin_delete_user',
            null,
            $request->ip(),
            $request->userAgent(),
            ['deleted_user_email' => $user->email]
        );

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    // ==================== GROUPS ====================

    /**
     * List all groups
     */
    public function getGroups(): JsonResponse
    {
        $groups = UasGroup::on($this->connection)
            ->withCount('users')
            ->orderBy('hierarchy_level')
            ->get();

        return response()->json($groups);
    }

    /**
     * Get a single group
     */
    public function getGroup(int $id): JsonResponse
    {
        $group = UasGroup::on($this->connection)
            ->withCount('users')
            ->findOrFail($id);

        return response()->json($group);
    }

    /**
     * Create a new group
     */
    public function createGroup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'hierarchy_level' => 'required|integer|min:1',
            'permissions' => 'nullable|array',
            'is_default' => 'nullable|boolean',
        ]);

        $slug = Str::slug($validated['name']);

        // Ensure unique slug
        $existingSlug = UasGroup::on($this->connection)->where('slug', $slug)->exists();
        if ($existingSlug) {
            $slug = $slug . '-' . Str::random(4);
        }

        // If setting as default, remove default from other groups
        if ($validated['is_default'] ?? false) {
            UasGroup::on($this->connection)->where('is_default', true)->update(['is_default' => false]);
        }

        $group = UasGroup::on($this->connection)->create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'hierarchy_level' => $validated['hierarchy_level'],
            'permissions' => $validated['permissions'] ?? [],
            'is_default' => $validated['is_default'] ?? false,
            'is_system' => false,
        ]);

        return response()->json($group, 201);
    }

    /**
     * Update a group
     */
    public function updateGroup(Request $request, int $id): JsonResponse
    {
        $group = UasGroup::on($this->connection)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'hierarchy_level' => 'nullable|integer|min:1',
            'permissions' => 'nullable|array',
            'is_default' => 'nullable|boolean',
        ]);

        // System groups have restrictions
        if ($group->is_system) {
            // Can only update permissions and description for system groups
            unset($validated['name']);
            unset($validated['hierarchy_level']);
        }

        // If setting as default, remove default from other groups
        if ($validated['is_default'] ?? false) {
            UasGroup::on($this->connection)
                ->where('is_default', true)
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        $group->update(array_filter($validated, fn($v) => $v !== null));

        return response()->json($group);
    }

    /**
     * Delete a group
     */
    public function deleteGroup(int $id): JsonResponse
    {
        $group = UasGroup::on($this->connection)->findOrFail($id);

        // Cannot delete system groups
        if ($group->is_system) {
            return response()->json(['error' => 'Cannot delete system groups'], 422);
        }

        // Cannot delete if users are in this group
        if ($group->users()->count() > 0) {
            return response()->json(['error' => 'Cannot delete group with users. Reassign users first.'], 422);
        }

        $group->delete();

        return response()->json(['message' => 'Group deleted successfully']);
    }

    // ==================== PAGE ACCESS ====================

    /**
     * Get page access list (for all pages)
     */
    public function getPageAccess(): JsonResponse
    {
        $pageAccess = UasPageAccess::on($this->connection)
            ->orderBy('page_name')
            ->get();

        return response()->json($pageAccess);
    }

    /**
     * Sync page access (upsert from frontend page list)
     */
    public function syncPageAccess(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pages' => 'required|array',
            'pages.*.page_id' => 'required|string',
            'pages.*.page_name' => 'required|string',
        ]);

        foreach ($validated['pages'] as $page) {
            UasPageAccess::on($this->connection)->updateOrCreate(
                ['page_id' => $page['page_id']],
                ['page_name' => $page['page_name']]
            );
        }

        // Remove any pages that no longer exist
        $pageIds = array_column($validated['pages'], 'page_id');
        UasPageAccess::on($this->connection)
            ->whereNotIn('page_id', $pageIds)
            ->delete();

        return response()->json(['message' => 'Page access synced']);
    }

    /**
     * Update page access settings
     */
    public function updatePageAccess(Request $request, string $pageId): JsonResponse
    {
        $pageAccess = UasPageAccess::on($this->connection)
            ->where('page_id', $pageId)
            ->firstOrFail();

        $validated = $request->validate([
            'is_locked' => 'nullable|boolean',
            'allowed_groups' => 'nullable|array',
            'allowed_users' => 'nullable|array',
            'denied_users' => 'nullable|array',
            'redirect_to' => 'nullable|in:login,home,custom',
            'custom_redirect_url' => 'nullable|string',
        ]);

        $pageAccess->update($validated);

        return response()->json($pageAccess);
    }

    // ==================== PERMISSIONS ====================

    /**
     * Get all permission definitions
     */
    public function getPermissionDefinitions(): JsonResponse
    {
        $permissions = UasPermissionDefinition::on($this->connection)
            ->orderBy('category')
            ->orderBy('order')
            ->get();

        return response()->json($permissions);
    }

    /**
     * Get permissions grouped by category
     */
    public function getPermissionsGrouped(): JsonResponse
    {
        $permissions = UasPermissionDefinition::on($this->connection)
            ->orderBy('category')
            ->orderBy('order')
            ->get()
            ->groupBy('category');

        return response()->json($permissions);
    }

    // ==================== SETTINGS ====================

    /**
     * Get all UAS settings
     */
    public function getSettings(): JsonResponse
    {
        $settings = UasSetting::on($this->connection)->pluck('value', 'key');
        return response()->json($settings);
    }

    /**
     * Update UAS settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $settings = $request->validate([
            'registration_enabled' => 'nullable|string',
            'email_verification_required' => 'nullable|string',
            'security_questions_required' => 'nullable|string',
            'session_lifetime_minutes' => 'nullable|string',
            'remember_me_days' => 'nullable|string',
            'password_reset_expiry_hours' => 'nullable|string',
            'max_login_attempts' => 'nullable|string',
            'lockout_duration_minutes' => 'nullable|string',
        ]);

        foreach ($settings as $key => $value) {
            if ($value !== null) {
                UasSetting::on($this->connection)->updateOrCreate(
                    ['key' => $key],
                    ['value' => $value]
                );
            }
        }

        return response()->json(['message' => 'Settings updated']);
    }

    // ==================== ACTIVITY LOG ====================

    /**
     * Get activity log
     */
    public function getActivityLog(Request $request): JsonResponse
    {
        $query = UasActivityLog::on($this->connection)
            ->with('user')
            ->orderBy('created_at', 'desc');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        $perPage = $request->get('per_page', 50);
        $logs = $query->paginate($perPage);

        return response()->json($logs);
    }

    // ==================== DASHBOARD STATS ====================

    /**
     * Get UAS dashboard statistics
     */
    public function getDashboardStats(): JsonResponse
    {
        $stats = [
            'total_users' => UasUser::on($this->connection)->count(),
            'active_users' => UasUser::on($this->connection)->where('status', 'active')->count(),
            'pending_users' => UasUser::on($this->connection)->where('status', 'pending')->count(),
            'suspended_users' => UasUser::on($this->connection)->where('status', 'suspended')->count(),
            'total_groups' => UasGroup::on($this->connection)->count(),
            'locked_pages' => UasPageAccess::on($this->connection)->where('is_locked', true)->count(),
            'recent_logins' => UasActivityLog::on($this->connection)
                ->where('action', 'login')
                ->where('created_at', '>=', now()->subDays(7))
                ->count(),
        ];

        return response()->json($stats);
    }
}
