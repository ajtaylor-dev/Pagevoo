<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Note extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'content',
    ];

    /**
     * Get the user that owns the note
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all users this note is shared with
     */
    public function sharedWithUsers(): MorphToMany
    {
        return $this->morphedByMany(User::class, 'shareable', 'note_shares');
    }

    /**
     * Get all groups this note is shared with
     */
    public function sharedWithGroups(): MorphToMany
    {
        return $this->morphedByMany(Group::class, 'shareable', 'note_shares');
    }
}
