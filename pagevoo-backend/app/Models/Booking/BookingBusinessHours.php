<?php

namespace App\Models\Booking;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingBusinessHours extends Model
{
    protected $connection = 'website';
    protected $table = 'booking_business_hours';

    protected $fillable = [
        'staff_id',
        'day_of_week',
        'is_open',
        'open_time',
        'close_time',
        'break_start',
        'break_end',
    ];

    protected $casts = [
        'is_open' => 'boolean',
        'open_time' => 'datetime:H:i',
        'close_time' => 'datetime:H:i',
        'break_start' => 'datetime:H:i',
        'break_end' => 'datetime:H:i',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(BookingStaff::class, 'staff_id');
    }

    /**
     * Get day name
     */
    public function getDayNameAttribute(): string
    {
        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return $days[$this->day_of_week] ?? '';
    }

    /**
     * Get short day name
     */
    public function getShortDayNameAttribute(): string
    {
        $days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return $days[$this->day_of_week] ?? '';
    }
}
