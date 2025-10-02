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
        'owner_id',
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
        // TODO: Check if user has pro subscription
        // For now, just check if they have active/trial status
        return $this->role === 'user' && in_array($this->account_status, ['active', 'trial']);
    }
}
