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
            'role' => 'required|string|in:user,admin',
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
            'role' => 'required|string|in:user,admin',
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
}
