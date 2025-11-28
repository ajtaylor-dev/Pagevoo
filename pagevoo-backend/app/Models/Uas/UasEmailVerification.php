<?php

namespace App\Models\Uas;

use Illuminate\Database\Eloquent\Model;

class UasEmailVerification extends Model
{
    protected $table = 'uas_email_verifications';

    protected $fillable = [
        'email',
        'token',
        'registration_data',
        'expires_at',
    ];

    protected $casts = [
        'registration_data' => 'array',
        'expires_at' => 'datetime',
    ];

    /**
     * Check if verification has expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Generate a unique token
     */
    public static function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Scope for valid (non-expired) verifications
     */
    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now());
    }
}
