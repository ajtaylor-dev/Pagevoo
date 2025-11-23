<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends BaseController
{
    /**
     * Get all users
     */
    public function index()
    {
        $users = User::all();
        return $this->sendSuccess($users, 'Users retrieved successfully');
    }

    /**
     * Create a new user
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'business_name' => 'required|string|min:2|max:255',
            'business_type' => 'required|string',
            'role' => 'required|string|in:user,admin,collaborator',
            'account_status' => 'required|string|in:active,suspended',
            'account_tier' => 'nullable|string|in:trial,brochure,niche,pro',
            'owner_id' => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'business_name' => $request->business_name,
            'business_type' => $request->business_type,
            'phone_number' => $request->phone_number,
            'role' => $request->role,
            'account_status' => $request->account_status,
            'account_tier' => $request->role === 'admin' ? null : ($request->account_tier ?? 'trial'),
            'owner_id' => $request->owner_id,
        ]);

        return $this->sendSuccess($user, 'User created successfully', 201);
    }

    /**
     * Update a user
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return $this->sendError('User not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
            'business_name' => 'required|string|min:2|max:255',
            'business_type' => 'required|string',
            'role' => 'required|string|in:user,admin,collaborator',
            'account_status' => 'required|string|in:active,suspended',
            'account_tier' => 'nullable|string|in:trial,brochure,niche,pro',
            'owner_id' => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $user->name = $request->name;
        $user->email = $request->email;
        $user->business_name = $request->business_name;
        $user->business_type = $request->business_type;
        $user->phone_number = $request->phone_number;
        $user->role = $request->role;
        $user->account_status = $request->account_status;
        $user->account_tier = $request->role === 'admin' ? null : $request->account_tier;
        $user->owner_id = $request->owner_id;

        // Only update password if provided
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return $this->sendSuccess($user, 'User updated successfully');
    }

    /**
     * Delete a user
     */
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return $this->sendError('User not found', 404);
        }

        // Prevent deleting admin users
        if ($user->role === 'admin') {
            return $this->sendError('Cannot delete admin users', 403);
        }

        $user->delete();

        return $this->sendSuccess([], 'User deleted successfully');
    }

    /**
     * Delete inactive users (trial users who haven't logged in for 30 days)
     */
    public function deleteInactiveUsers()
    {
        // Find trial users who haven't logged in for 30 days
        $thirtyDaysAgo = now()->subDays(30);

        $inactiveUsers = User::where('account_status', 'trial')
            ->where(function ($query) use ($thirtyDaysAgo) {
                $query->whereNull('last_login_at')
                    ->orWhere('last_login_at', '<', $thirtyDaysAgo);
            })
            ->where('role', '!=', 'admin') // Never delete admins
            ->get();

        $count = $inactiveUsers->count();

        // Delete each inactive user
        foreach ($inactiveUsers as $user) {
            $user->delete();
        }

        return $this->sendSuccess([
            'deleted_count' => $count,
            'deleted_users' => $inactiveUsers->pluck('email')
        ], "Successfully deleted {$count} inactive user(s)");
    }

    /**
     * Reset system to factory defaults
     * Deletes all templates and resets ID counter to 1
     */
    public function resetToFactory()
    {
        try {
            $testUserEmails = ['admin@pagevoo.com', 'trial@test.com', 'brochure@test.com', 'niche@test.com', 'pro@test.com'];

            // Temporarily disable foreign key checks to allow truncation
            // Note: This causes an implicit commit, so we can't use transactions
            \DB::statement('SET FOREIGN_KEY_CHECKS=0');

            // Delete all templates and related records
            \DB::table('template_sections')->truncate();
            \DB::table('template_pages')->truncate();
            \DB::table('templates')->truncate();

            // Delete all websites and their related records
            \DB::table('user_sections')->truncate();
            \DB::table('user_pages')->truncate();
            \DB::table('user_websites')->truncate();

            // Delete all users except test users
            User::whereNotIn('email', $testUserEmails)->delete();

            // Delete all database instances
            \App\Models\DatabaseInstance::truncate();

            // Reset auto-increment counters to 1
            \DB::statement('ALTER TABLE templates AUTO_INCREMENT = 1');
            \DB::statement('ALTER TABLE template_pages AUTO_INCREMENT = 1');
            \DB::statement('ALTER TABLE template_sections AUTO_INCREMENT = 1');
            \DB::statement('ALTER TABLE user_websites AUTO_INCREMENT = 1');
            \DB::statement('ALTER TABLE user_pages AUTO_INCREMENT = 1');
            \DB::statement('ALTER TABLE user_sections AUTO_INCREMENT = 1');

            // Re-enable foreign key checks
            \DB::statement('SET FOREIGN_KEY_CHECKS=1');

            return $this->sendSuccess([
                'message' => 'System reset to factory defaults successfully',
                'templates_deleted' => 'all',
                'users_kept' => count($testUserEmails)
            ], 'Factory reset completed');

        } catch (\Exception $e) {
            // Re-enable foreign key checks in case of error
            \DB::statement('SET FOREIGN_KEY_CHECKS=1');
            return $this->sendError('Factory reset failed: ' . $e->getMessage(), 500);
        }
    }
}
