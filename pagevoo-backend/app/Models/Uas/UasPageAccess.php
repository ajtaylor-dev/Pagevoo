<?php

namespace App\Models\Uas;

use Illuminate\Database\Eloquent\Model;

class UasPageAccess extends Model
{
    protected $table = 'uas_page_access';

    protected $fillable = [
        'page_id',
        'page_name',
        'is_locked',
        'allowed_groups',
        'allowed_users',
        'denied_users',
        'redirect_to',
        'custom_redirect_url',
    ];

    protected $casts = [
        'is_locked' => 'boolean',
        'allowed_groups' => 'array',
        'allowed_users' => 'array',
        'denied_users' => 'array',
    ];

    /**
     * Check if a user can access this page
     */
    public function canAccess(?UasUser $user): bool
    {
        // If page is not locked, anyone can access
        if (!$this->is_locked) {
            return true;
        }

        // If locked and no user, deny access
        if (!$user) {
            return false;
        }

        return $user->canAccessPage($this);
    }

    /**
     * Get redirect URL for unauthorized access
     */
    public function getRedirectUrl(): string
    {
        switch ($this->redirect_to) {
            case 'home':
                return '/';
            case 'custom':
                return $this->custom_redirect_url ?? '/login';
            case 'login':
            default:
                return '/login';
        }
    }

    /**
     * Scope for locked pages only
     */
    public function scopeLocked($query)
    {
        return $query->where('is_locked', true);
    }
}
