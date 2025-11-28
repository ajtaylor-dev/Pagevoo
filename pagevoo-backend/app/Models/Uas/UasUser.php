<?php

namespace App\Models\Uas;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UasUser extends Model
{
    protected $table = 'uas_users';

    protected $fillable = [
        'group_id',
        'email',
        'password',
        'first_name',
        'last_name',
        'display_name',
        'avatar',
        'bio',
        'email_verified',
        'email_verified_at',
        'permission_overrides',
        'status',
        'last_login_at',
        'last_login_ip',
        'remember_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified' => 'boolean',
        'email_verified_at' => 'datetime',
        'permission_overrides' => 'array',
        'last_login_at' => 'datetime',
    ];

    /**
     * The group this user belongs to
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(UasGroup::class, 'group_id');
    }

    /**
     * User's security answers
     */
    public function securityAnswers(): HasMany
    {
        return $this->hasMany(UasUserSecurityAnswer::class, 'user_id');
    }

    /**
     * User's active sessions
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(UasSession::class, 'user_id');
    }

    /**
     * Activity log entries for this user
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(UasActivityLog::class, 'user_id');
    }

    /**
     * Check if user has a specific permission
     * Checks individual overrides first, then group permissions
     */
    public function hasPermission(string $permission): bool
    {
        // Check individual overrides first
        $overrides = $this->permission_overrides ?? [];
        if (isset($overrides[$permission])) {
            return $overrides[$permission] === true;
        }

        // Fall back to group permission
        return $this->group ? $this->group->hasPermission($permission) : false;
    }

    /**
     * Get the display name or full name
     */
    public function getNameAttribute(): string
    {
        return $this->display_name ?? "{$this->first_name} {$this->last_name}";
    }

    /**
     * Check if user is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && $this->email_verified;
    }

    /**
     * Check if user is banned
     */
    public function isBanned(): bool
    {
        return $this->status === 'suspended' || ($this->group && $this->group->isBanned());
    }

    /**
     * Check if user can access a specific page
     */
    public function canAccessPage(UasPageAccess $pageAccess): bool
    {
        // Admins can access everything
        if ($this->group && $this->group->hierarchy_level === 1) {
            return true;
        }

        // Check if explicitly denied
        $deniedUsers = $pageAccess->denied_users ?? [];
        if (in_array($this->id, $deniedUsers)) {
            return false;
        }

        // Check if explicitly allowed
        $allowedUsers = $pageAccess->allowed_users ?? [];
        if (in_array($this->id, $allowedUsers)) {
            return true;
        }

        // Check group access
        $allowedGroups = $pageAccess->allowed_groups ?? [];
        if (empty($allowedGroups)) {
            // No groups specified = all logged-in users can access
            return true;
        }

        return in_array($this->group_id, $allowedGroups);
    }

    /**
     * Scope for active users only
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')->where('email_verified', true);
    }

    /**
     * Scope for pending verification
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
