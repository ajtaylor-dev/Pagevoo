<?php

namespace App\Models\Uas;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UasGroup extends Model
{
    protected $table = 'uas_groups';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'hierarchy_level',
        'permissions',
        'is_default',
        'is_system',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_default' => 'boolean',
        'is_system' => 'boolean',
    ];

    /**
     * Users in this group
     */
    public function users(): HasMany
    {
        return $this->hasMany(UasUser::class, 'group_id');
    }

    /**
     * Check if group has a specific permission
     */
    public function hasPermission(string $permission): bool
    {
        $permissions = $this->permissions ?? [];

        // Wildcard permission (admin)
        if (isset($permissions['*']) && $permissions['*'] === true) {
            return true;
        }

        return isset($permissions[$permission]) && $permissions[$permission] === true;
    }

    /**
     * Get the default group for new users
     */
    public static function getDefaultGroup(): ?self
    {
        return static::where('is_default', true)->first();
    }

    /**
     * Scope for non-banned groups
     */
    public function scopeActive($query)
    {
        return $query->where('slug', '!=', 'banned');
    }

    /**
     * Check if this is the banned group
     */
    public function isBanned(): bool
    {
        return $this->slug === 'banned';
    }
}
