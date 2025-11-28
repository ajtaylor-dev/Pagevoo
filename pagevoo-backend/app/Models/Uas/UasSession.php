<?php

namespace App\Models\Uas;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UasSession extends Model
{
    protected $table = 'uas_sessions';

    protected $fillable = [
        'user_id',
        'token',
        'ip_address',
        'user_agent',
        'remember_me',
        'expires_at',
        'last_activity_at',
    ];

    protected $casts = [
        'remember_me' => 'boolean',
        'expires_at' => 'datetime',
        'last_activity_at' => 'datetime',
    ];

    /**
     * The user this session belongs to
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UasUser::class, 'user_id');
    }

    /**
     * Check if session has expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if session is valid
     */
    public function isValid(): bool
    {
        return !$this->isExpired() && $this->user && $this->user->isActive();
    }

    /**
     * Touch the last activity timestamp
     */
    public function touch(): bool
    {
        $this->last_activity_at = now();
        return $this->save();
    }

    /**
     * Generate a unique session token
     */
    public static function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Scope for valid (non-expired) sessions
     */
    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now());
    }

    /**
     * Clean up expired sessions
     */
    public static function cleanupExpired(): int
    {
        return static::where('expires_at', '<', now())->delete();
    }
}
