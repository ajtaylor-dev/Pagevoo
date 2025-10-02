<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\User;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class CollaboratorController extends BaseController
{
    /**
     * Get all collaborators for the authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->canManageCollaborators()) {
            return $this->sendError('Only Pro users can manage collaborators', 403);
        }

        $collaborators = $user->collaborators()->with('groups')->get();
        return $this->sendSuccess($collaborators, 'Collaborators retrieved successfully');
    }

    /**
     * Create a new collaborator
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user->canManageCollaborators()) {
            return $this->sendError('Only Pro users can manage collaborators', 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        DB::beginTransaction();
        try {
            $collaborator = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'business_name' => $user->business_name,
                'business_type' => $user->business_type,
                'phone_number' => $request->phone_number,
                'role' => 'collaborator',
                'account_status' => $user->account_status,
                'owner_id' => $user->id,
            ]);

            // Find or create the Default Group
            $defaultGroup = Group::firstOrCreate(
                [
                    'owner_id' => $user->id,
                    'name' => 'Default Group'
                ],
                [
                    'description' => 'Default group for all collaborators',
                    'permissions' => [
                        'can_edit_content' => false,
                        'can_manage_pages' => false,
                        'can_view_analytics' => false,
                        'can_manage_media' => false,
                        'can_view_journal' => true,
                        'can_edit_journal' => false
                    ]
                ]
            );

            // Add collaborator to the Default Group
            $defaultGroup->users()->attach($collaborator->id);

            DB::commit();

            // Load the collaborator with groups relationship
            $collaborator->load('groups');

            return $this->sendSuccess($collaborator, 'Collaborator created successfully', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to create collaborator', 500);
        }
    }

    /**
     * Update a collaborator
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->canManageCollaborators()) {
            return $this->sendError('Only Pro users can manage collaborators', 403);
        }

        $collaborator = User::find($id);

        if (!$collaborator) {
            return $this->sendError('Collaborator not found', 404);
        }

        // Ensure this collaborator belongs to the authenticated user
        if ($collaborator->owner_id !== $user->id) {
            return $this->sendError('Unauthorized', 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $collaborator->name = $request->name;
        $collaborator->email = $request->email;
        $collaborator->phone_number = $request->phone_number;

        // Only update password if provided
        if ($request->filled('password')) {
            $collaborator->password = Hash::make($request->password);
        }

        $collaborator->save();

        return $this->sendSuccess($collaborator, 'Collaborator updated successfully');
    }

    /**
     * Delete a collaborator
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->canManageCollaborators()) {
            return $this->sendError('Only Pro users can manage collaborators', 403);
        }

        $collaborator = User::find($id);

        if (!$collaborator) {
            return $this->sendError('Collaborator not found', 404);
        }

        // Ensure this collaborator belongs to the authenticated user
        if ($collaborator->owner_id !== $user->id) {
            return $this->sendError('Unauthorized', 403);
        }

        $collaborator->delete();

        return $this->sendSuccess([], 'Collaborator deleted successfully');
    }
}
