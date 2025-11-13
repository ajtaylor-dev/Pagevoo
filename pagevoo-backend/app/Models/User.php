<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'business_name',
        'business_type',
        'phone_number',
        'role',
        'account_status',
        'package',
        'account_tier',
        'owner_id',
        'internal_url',
        'external_url',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the owner (parent user) of this collaborator.
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get all collaborators for this user.
     */
    public function collaborators()
    {
        return $this->hasMany(User::class, 'owner_id');
    }

    /**
     * Get all groups owned by this user.
     */
    public function ownedGroups()
    {
        return $this->hasMany(Group::class, 'owner_id');
    }

    /**
     * Get all groups this user belongs to.
     */
    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_user')->withTimestamps();
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is a collaborator.
     */
    public function isCollaborator(): bool
    {
        return $this->role === 'collaborator';
    }

    /**
     * Check if user can manage collaborators (Pro subscription).
     */
    public function canManageCollaborators(): bool
    {
        return $this->role === 'user'
            && $this->package === 'pro'
            && in_array($this->account_status, ['active', 'trial']);
    }

    /**
     * Get all notes owned by this user.
     */
    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    /**
     * Get all notes shared with this user.
     */
    public function sharedNotes()
    {
        return $this->morphToMany(Note::class, 'shareable', 'note_shares');
    }

    /**
     * Check if user can access journal (Niche or Pro).
     */
    public function canAccessJournal(): bool
    {
        return $this->role === 'user'
            && in_array($this->package, ['niche', 'pro'])
            && in_array($this->account_status, ['active', 'trial']);
    }

    // ============ Permission System Methods ============

    /**
     * Check if user has access to a specific feature.
     *
     * @param string $feature Feature key from pagevoo_permissions config
     * @return bool
     */
    public function hasFeature(string $feature): bool
    {
        return app(\App\Services\PermissionService::class)->can($this, $feature);
    }

    /**
     * Get a numeric limit value for this user (e.g., max_pages, max_images).
     *
     * @param string $limit Limit key from pagevoo_permissions config
     * @return mixed (int|null for unlimited)
     */
    public function getLimit(string $limit)
    {
        return app(\App\Services\PermissionService::class)->getLimit($this, $limit);
    }

    /**
     * Get all permissions for this user's tier.
     *
     * @return array
     */
    public function getAllPermissions(): array
    {
        return app(\App\Services\PermissionService::class)->getAllPermissions($this);
    }

    /**
     * Get the account tier for this user.
     *
     * @return string (trial|brochure|niche|pro)
     */
    public function getAccountTier(): string
    {
        return $this->account_tier ?? 'trial';
    }

    /**
     * Get tier-specific usage information.
     *
     * @return array
     */
    public function getUsageInfo(): array
    {
        return app(\App\Services\PermissionService::class)->getUsageInfo($this);
    }

    /**
     * Get available template tiers for this user.
     *
     * @return array
     */
    public function getAvailableTemplateTiers(): array
    {
        return app(\App\Services\PermissionService::class)->getAvailableTemplateTiers($this);
    }
}
