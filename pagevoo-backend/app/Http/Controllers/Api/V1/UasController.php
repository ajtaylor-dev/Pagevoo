<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DatabaseInstance;
use App\Models\Uas\UasUser;
use App\Models\Uas\UasGroup;
use App\Models\Uas\UasPageAccess;
use App\Models\Uas\UasPermissionDefinition;
use App\Models\Uas\UasSetting;
use App\Models\Uas\UasActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;

class UasController extends Controller
{
    /**
     * Set up connection to user's database by database instance ID
     */
    private function connectToUserDatabase(int $dbId): ?string
    {
        $instance = DatabaseInstance::where('id', $dbId)
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

        return 'user_db';
    }

    // ==================== USERS ====================

    /**
     * List all users with pagination
     */
    public function getUsers(Request $request): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $query = UasUser::on($connection)
            ->with('group')
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('group_id')) {
            $query->where('group_id', $request->group_id);
        }

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

    public function getUser(Request $request, int $id): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $user = UasUser::on($connection)
            ->with(['group', 'securityAnswers.question'])
            ->findOrFail($id);

        return response()->json($user);
    }

    public function createUser(Request $request): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:8',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'display_name' => 'nullable|string|max:255',
            'group_id' => 'required|integer',
            'status' => 'nullable|in:pending,active,suspended',
        ]);

        $exists = UasUser::on($connection)
            ->where('email', $validated['email'])
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Email already registered'], 422);
        }

        $user = UasUser::on($connection)->create([
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'display_name' => $validated['display_name'] ?? null,
            'group_id' => $validated['group_id'],
            'status' => $validated['status'] ?? 'active',
            'email_verified' => true,
            'email_verified_at' => now(),
        ]);

        UasActivityLog::on($connection)->create([
            'action' => 'admin_create_user',
            'user_id' => null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'details' => json_encode(['created_user_id' => $user->id]),
        ]);

        return response()->json($user->load('group'), 201);
    }

    public function updateUser(Request $request, int $id): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $user = UasUser::on($connection)->findOrFail($id);

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

        if (isset($validated['email']) && $validated['email'] !== $user->email) {
            $exists = UasUser::on($connection)
                ->where('email', $validated['email'])
                ->where('id', '!=', $id)
                ->exists();

            if ($exists) {
                return response()->json(['error' => 'Email already registered'], 422);
            }
        }

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update(array_filter($validated, fn($v) => $v !== null));

        return response()->json($user->load('group'));
    }

    public function deleteUser(Request $request, int $id): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $user = UasUser::on($connection)->findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    // ==================== GROUPS ====================

    public function getGroups(Request $request): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $groups = UasGroup::on($connection)
            ->withCount('users')
            ->orderBy('hierarchy_level')
            ->get();

        return response()->json($groups);
    }

    public function getGroup(Request $request, int $id): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $group = UasGroup::on($connection)
            ->withCount('users')
            ->findOrFail($id);

        return response()->json($group);
    }

    public function createGroup(Request $request): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'hierarchy_level' => 'required|integer|min:1',
            'permissions' => 'nullable|array',
            'is_default' => 'nullable|boolean',
        ]);

        $slug = Str::slug($validated['name']);

        $existingSlug = UasGroup::on($connection)->where('slug', $slug)->exists();
        if ($existingSlug) {
            $slug = $slug . '-' . Str::random(4);
        }

        if ($validated['is_default'] ?? false) {
            UasGroup::on($connection)->where('is_default', true)->update(['is_default' => false]);
        }

        $group = UasGroup::on($connection)->create([
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

    public function updateGroup(Request $request, int $id): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $group = UasGroup::on($connection)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'hierarchy_level' => 'nullable|integer|min:1',
            'permissions' => 'nullable|array',
            'is_default' => 'nullable|boolean',
        ]);

        if ($group->is_system) {
            unset($validated['name']);
            unset($validated['hierarchy_level']);
        }

        if ($validated['is_default'] ?? false) {
            UasGroup::on($connection)
                ->where('is_default', true)
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        $group->update(array_filter($validated, fn($v) => $v !== null));

        return response()->json($group);
    }

    public function deleteGroup(Request $request, int $id): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $group = UasGroup::on($connection)->findOrFail($id);

        if ($group->is_system) {
            return response()->json(['error' => 'Cannot delete system groups'], 422);
        }

        if ($group->users()->count() > 0) {
            return response()->json(['error' => 'Cannot delete group with users. Reassign users first.'], 422);
        }

        $group->delete();

        return response()->json(['message' => 'Group deleted successfully']);
    }

    // ==================== PAGE ACCESS ====================

    public function getPageAccess(Request $request): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $pageAccess = UasPageAccess::on($connection)
            ->orderBy('page_name')
            ->get();

        return response()->json($pageAccess);
    }

    public function syncPageAccess(Request $request): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $validated = $request->validate([
            'pages' => 'required|array',
            'pages.*.page_id' => 'required|string',
            'pages.*.page_name' => 'required|string',
        ]);

        foreach ($validated['pages'] as $page) {
            UasPageAccess::on($connection)->updateOrCreate(
                ['page_id' => $page['page_id']],
                ['page_name' => $page['page_name']]
            );
        }

        $pageIds = array_column($validated['pages'], 'page_id');
        UasPageAccess::on($connection)
            ->whereNotIn('page_id', $pageIds)
            ->delete();

        return response()->json(['message' => 'Page access synced']);
    }

    public function updatePageAccess(Request $request, string $pageId): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $pageAccess = UasPageAccess::on($connection)
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

    public function getPermissionDefinitions(Request $request): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $permissions = UasPermissionDefinition::on($connection)
            ->orderBy('category')
            ->orderBy('order')
            ->get();

        return response()->json($permissions);
    }

    public function getPermissionsGrouped(Request $request): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $permissions = UasPermissionDefinition::on($connection)
            ->orderBy('category')
            ->orderBy('order')
            ->get()
            ->groupBy('category');

        return response()->json($permissions);
    }

    // ==================== SETTINGS ====================

    public function getSettings(Request $request): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $settings = UasSetting::on($connection)->pluck('value', 'key');
        return response()->json($settings);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

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
                UasSetting::on($connection)->updateOrCreate(
                    ['key' => $key],
                    ['value' => $value]
                );
            }
        }

        return response()->json(['message' => 'Settings updated']);
    }

    // ==================== ACTIVITY LOG ====================

    public function getActivityLog(Request $request): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $query = UasActivityLog::on($connection)
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

    public function getDashboardStats(Request $request): JsonResponse
    {
        $dbId = $request->query('db');
        if (!$dbId) {
            return response()->json(['error' => 'Database ID is required'], 400);
        }

        $connection = $this->connectToUserDatabase((int)$dbId);
        if (!$connection) {
            return response()->json(['error' => 'Database not found'], 404);
        }

        $stats = [
            'total_users' => UasUser::on($connection)->count(),
            'active_users' => UasUser::on($connection)->where('status', 'active')->count(),
            'pending_users' => UasUser::on($connection)->where('status', 'pending')->count(),
            'suspended_users' => UasUser::on($connection)->where('status', 'suspended')->count(),
            'total_groups' => UasGroup::on($connection)->count(),
            'locked_pages' => UasPageAccess::on($connection)->where('is_locked', true)->count(),
            'recent_logins' => UasActivityLog::on($connection)
                ->where('action', 'login')
                ->where('created_at', '>=', now()->subDays(7))
                ->count(),
        ];

        return response()->json($stats);
    }
}
