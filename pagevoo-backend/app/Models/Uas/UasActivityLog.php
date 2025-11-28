<?php

namespace App\Models\Uas;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UasActivityLog extends Model
{
    protected $table = 'uas_activity_log';

    protected $fillable = [
        'user_id',
        'action',
        'ip_address',
        'user_agent',
        'details',
    ];

    protected $casts = [
        'details' => 'array',
    ];

    /**
     * The user who performed the action
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UasUser::class, 'user_id');
    }

    /**
     * Log an activity
     */
    public static function log(
        string $action,
        ?int $userId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?array $details = null
    ): self {
        return static::create([
            'user_id' => $userId,
            'action' => $action,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'details' => $details,
        ]);
    }

    /**
     * Scope for a specific action type
     */
    public function scopeAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope for a specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}
