<?php

namespace App\Models\Booking;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookingStaff extends Model
{
    protected $connection = 'website';
    protected $table = 'booking_staff';

    protected $fillable = [
        'uas_user_id',
        'name',
        'email',
        'phone',
        'avatar',
        'bio',
        'title',
        'color',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(BookingService::class, 'booking_staff_services', 'staff_id', 'service_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'staff_id');
    }

    public function businessHours(): HasMany
    {
        return $this->hasMany(BookingBusinessHours::class, 'staff_id');
    }

    public function availability(): HasMany
    {
        return $this->hasMany(BookingAvailability::class, 'staff_id');
    }

    /**
     * Scope for active staff
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get initials for avatar fallback
     */
    public function getInitialsAttribute(): string
    {
        $words = explode(' ', $this->name);
        $initials = '';

        foreach ($words as $word) {
            $initials .= strtoupper(substr($word, 0, 1));
        }

        return substr($initials, 0, 2);
    }
}
