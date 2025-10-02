<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GroupController extends BaseController
{
    /**
     * Get all groups for the authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->canManageCollaborators()) {
            return $this->sendError('Only Pro users can manage groups', 403);
        }

        $groups = $user->ownedGroups()->with('users')->get();
        return $this->sendSuccess($groups, 'Groups retrieved successfully');
    }

    /**
     * Create a new group
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user->canManageCollaborators()) {
            return $this->sendError('Only Pro users can manage groups', 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $group = Group::create([
            'name' => $request->name,
            'description' => $request->description,
            'owner_id' => $user->id,
            'permissions' => $request->permissions ?? [],
        ]);

        return $this->sendSuccess($group, 'Group created successfully', 201);
    }

    /**
     * Update a group
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->canManageCollaborators()) {
            return $this->sendError('Only Pro users can manage groups', 403);
        }

        $group = Group::find($id);

        if (!$group) {
            return $this->sendError('Group not found', 404);
        }

        // Ensure this group belongs to the authenticated user
        if ($group->owner_id !== $user->id) {
            return $this->sendError('Unauthorized', 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $group->name = $request->name;
        $group->description = $request->description;
        $group->permissions = $request->permissions ?? [];
        $group->save();

        return $this->sendSuccess($group, 'Group updated successfully');
    }

    /**
     * Delete a group
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->canManageCollaborators()) {
            return $this->sendError('Only Pro users can manage groups', 403);
        }

        $group = Group::find($id);

        if (!$group) {
            return $this->sendError('Group not found', 404);
        }

        // Ensure this group belongs to the authenticated user
        if ($group->owner_id !== $user->id) {
            return $this->sendError('Unauthorized', 403);
        }

        $group->delete();

        return $this->sendSuccess([], 'Group deleted successfully');
    }

    /**
     * Add users to a group
     */
    public function addUsers(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->canManageCollaborators()) {
            return $this->sendError('Only Pro users can manage groups', 403);
        }

        $group = Group::find($id);

        if (!$group) {
            return $this->sendError('Group not found', 404);
        }

        // Ensure this group belongs to the authenticated user
        if ($group->owner_id !== $user->id) {
            return $this->sendError('Unauthorized', 403);
        }

        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        // Ensure all users are collaborators of the authenticated user
        $collaboratorIds = $user->collaborators()->pluck('id')->toArray();
        foreach ($request->user_ids as $userId) {
            if (!in_array($userId, $collaboratorIds)) {
                return $this->sendError('You can only add your own collaborators to groups', 403);
            }
        }

        $group->users()->syncWithoutDetaching($request->user_ids);

        return $this->sendSuccess($group->load('users'), 'Users added to group successfully');
    }

    /**
     * Remove users from a group
     */
    public function removeUsers(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->canManageCollaborators()) {
            return $this->sendError('Only Pro users can manage groups', 403);
        }

        $group = Group::find($id);

        if (!$group) {
            return $this->sendError('Group not found', 404);
        }

        // Ensure this group belongs to the authenticated user
        if ($group->owner_id !== $user->id) {
            return $this->sendError('Unauthorized', 403);
        }

        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error', 422, $validator->errors());
        }

        $group->users()->detach($request->user_ids);

        return $this->sendSuccess($group->load('users'), 'Users removed from group successfully');
    }
}
