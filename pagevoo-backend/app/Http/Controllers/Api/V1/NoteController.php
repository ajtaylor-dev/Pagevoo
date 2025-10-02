<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Note;
use App\Models\User;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NoteController extends BaseController
{
    /**
     * Get all notes for the authenticated user (owned + shared).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Check if user can access journal
        if (!$user->canAccessJournal()) {
            return $this->sendError('Journal access requires Niche or Pro package', 403);
        }

        // Get owned notes
        $ownedNotes = $user->notes()
            ->with(['sharedWithUsers', 'sharedWithGroups'])
            ->get();

        // Get notes shared directly with user
        $directlySharedNotes = $user->sharedNotes()
            ->with(['user', 'sharedWithUsers', 'sharedWithGroups'])
            ->get();

        // Get notes shared through groups
        $groupSharedNotes = Note::whereHas('sharedWithGroups', function ($query) use ($user) {
            $query->whereIn('groups.id', $user->groups->pluck('id'));
        })
        ->where('user_id', '!=', $user->id) // Exclude own notes
        ->with(['user', 'sharedWithUsers', 'sharedWithGroups'])
        ->get();

        // Merge and remove duplicates
        $allNotes = $ownedNotes
            ->merge($directlySharedNotes)
            ->merge($groupSharedNotes)
            ->unique('id')
            ->values();

        return $this->sendSuccess($allNotes, 'Notes retrieved successfully');
    }

    /**
     * Create a new note.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Check if user can access journal
        if (!$user->canAccessJournal()) {
            return $this->sendError('Journal access requires Niche or Pro package', 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'share_with_users' => 'nullable|array',
            'share_with_users.*' => 'exists:users,id',
            'share_with_groups' => 'nullable|array',
            'share_with_groups.*' => 'exists:groups,id',
        ]);

        DB::beginTransaction();
        try {
            // Create note
            $note = Note::create([
                'user_id' => $user->id,
                'title' => $validated['title'],
                'content' => $validated['content'] ?? null,
            ]);

            // Share with users (only if Pro)
            if ($user->package === 'pro' && isset($validated['share_with_users'])) {
                // Only allow sharing with own collaborators
                $validUsers = User::whereIn('id', $validated['share_with_users'])
                    ->where('owner_id', $user->id)
                    ->pluck('id');

                $note->sharedWithUsers()->attach($validUsers);
            }

            // Share with groups (only if Pro)
            if ($user->package === 'pro' && isset($validated['share_with_groups'])) {
                // Only allow sharing with own groups
                $validGroups = Group::whereIn('id', $validated['share_with_groups'])
                    ->where('owner_id', $user->id)
                    ->pluck('id');

                $note->sharedWithGroups()->attach($validGroups);
            }

            DB::commit();

            // Load relationships for response
            $note->load(['sharedWithUsers', 'sharedWithGroups']);

            return $this->sendSuccess($note, 'Note created successfully', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to create note', 500);
        }
    }

    /**
     * Update an existing note.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        // Check if user can access journal
        if (!$user->canAccessJournal()) {
            return $this->sendError('Journal access requires Niche or Pro package', 403);
        }

        $note = Note::find($id);

        if (!$note) {
            return $this->sendError('Note not found', 404);
        }

        // Check if user owns the note
        if ($note->user_id !== $user->id) {
            return $this->sendError('Unauthorized to edit this note', 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'share_with_users' => 'nullable|array',
            'share_with_users.*' => 'exists:users,id',
            'share_with_groups' => 'nullable|array',
            'share_with_groups.*' => 'exists:groups,id',
        ]);

        DB::beginTransaction();
        try {
            // Update note
            $note->update([
                'title' => $validated['title'],
                'content' => $validated['content'] ?? null,
            ]);

            // Update sharing (only if Pro)
            if ($user->package === 'pro') {
                // Sync shared users
                if (isset($validated['share_with_users'])) {
                    $validUsers = User::whereIn('id', $validated['share_with_users'])
                        ->where('owner_id', $user->id)
                        ->pluck('id');

                    $note->sharedWithUsers()->sync($validUsers);
                } else {
                    $note->sharedWithUsers()->detach();
                }

                // Sync shared groups
                if (isset($validated['share_with_groups'])) {
                    $validGroups = Group::whereIn('id', $validated['share_with_groups'])
                        ->where('owner_id', $user->id)
                        ->pluck('id');

                    $note->sharedWithGroups()->sync($validGroups);
                } else {
                    $note->sharedWithGroups()->detach();
                }
            }

            DB::commit();

            // Load relationships for response
            $note->load(['sharedWithUsers', 'sharedWithGroups']);

            return $this->sendSuccess($note, 'Note updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to update note', 500);
        }
    }

    /**
     * Delete a note.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        // Check if user can access journal
        if (!$user->canAccessJournal()) {
            return $this->sendError('Journal access requires Niche or Pro package', 403);
        }

        $note = Note::find($id);

        if (!$note) {
            return $this->sendError('Note not found', 404);
        }

        // Check if user owns the note
        if ($note->user_id !== $user->id) {
            return $this->sendError('Unauthorized to delete this note', 403);
        }

        $note->delete();

        return $this->sendSuccess(null, 'Note deleted successfully');
    }
}
