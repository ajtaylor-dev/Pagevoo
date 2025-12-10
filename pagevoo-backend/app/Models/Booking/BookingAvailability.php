<?php

namespace App\Models\Booking;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingAvailability extends Model
{
    protected $connection = 'website';
    protected $table = 'booking_availability';

    protected $fillable = [
        'staff_id',
        'date',
        'type',
        'start_time',
        'end_time',
        'reason',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(BookingStaff::class, 'staff_id');
    }

    /**
     * Check if this is an all-day entry
     */
    public function getIsAllDayAttribute(): bool
    {
        return is_null($this->start_time) && is_null($this->end_time);
    }

    /**
     * Scope for available entries
     */
    public function scopeAvailable($query)
    {
        return $query->where('type', 'available');
    }

    /**
     * Scope for unavailable entries
     */
    public function scopeUnavailable($query)
    {
        return $query->where('type', 'unavailable');
    }

    /**
     * Scope for a specific date
     */
    public function scopeForDate($query, $date)
    {
        return $query->where('date', $date);
    }
}
