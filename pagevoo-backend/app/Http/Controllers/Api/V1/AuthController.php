<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class AuthController extends BaseController
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'business_name' => 'required|string|min:2|max:255',
            'business_type' => 'required|string',
            'phone_number' => 'nullable|string|max:20',
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
            'role' => 'user',
            'account_status' => 'trial',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->sendSuccess([
            'user' => $user,
            'token' => $token,
        ], 'User registered successfully');
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        if (!Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            return $this->sendError('Invalid credentials', 401);
        }

        $user = Auth::user();

        // Update last login timestamp
        $user->last_login_at = now();
        $user->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->sendSuccess([
            'user' => $user,
            'token' => $token,
        ], 'User logged in successfully');
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->sendSuccess([], 'User logged out successfully');
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        return $this->sendSuccess($request->user(), 'User retrieved successfully');
    }
}
