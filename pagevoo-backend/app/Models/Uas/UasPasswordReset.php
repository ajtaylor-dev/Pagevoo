<?php

namespace App\Models\Uas;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UasPasswordReset extends Model
{
    protected $table = 'uas_password_resets';

    protected $fillable = [
        'user_id',
        'token',
        'email_verified',
        'questions_verified',
        'expires_at',
    ];

    protected $casts = [
        'email_verified' => 'boolean',
        'questions_verified' => 'boolean',
        'expires_at' => 'datetime',
    ];

    /**
     * The user requesting password reset
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UasUser::class, 'user_id');
    }

    /**
     * Check if reset has expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if reset is fully verified (email + questions)
     */
    public function isFullyVerified(): bool
    {
        return $this->email_verified && $this->questions_verified;
    }

    /**
     * Generate a unique token
     */
    public static function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Scope for valid (non-expired) resets
     */
    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now());
    }
}
