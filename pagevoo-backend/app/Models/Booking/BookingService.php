<?php

namespace App\Models\Booking;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookingService extends Model
{
    protected $connection = 'website';

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'featured_image',
        'type',
        'duration_minutes',
        'buffer_before_minutes',
        'buffer_after_minutes',
        'capacity',
        'min_party_size',
        'max_party_size',
        'pricing_type',
        'price',
        'currency',
        'allow_pay_online',
        'allow_pay_at_venue',
        'require_deposit',
        'deposit_amount',
        'deposit_type',
        'require_login',
        'min_advance_hours',
        'max_advance_days',
        'cancellation_hours',
        'require_staff',
        'allow_staff_selection',
        'allow_recurring',
        'recurring_options',
        'order',
        'is_active',
    ];

    protected $casts = [
        'allow_pay_online' => 'boolean',
        'allow_pay_at_venue' => 'boolean',
        'require_deposit' => 'boolean',
        'require_login' => 'boolean',
        'require_staff' => 'boolean',
        'allow_staff_selection' => 'boolean',
        'allow_recurring' => 'boolean',
        'is_active' => 'boolean',
        'recurring_options' => 'array',
        'price' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(BookingCategory::class, 'category_id');
    }

    public function staff(): BelongsToMany
    {
        return $this->belongsToMany(BookingStaff::class, 'booking_staff_services', 'service_id', 'staff_id');
    }

    public function resources(): HasMany
    {
        return $this->hasMany(BookingResource::class, 'service_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'service_id');
    }

    /**
     * Get formatted price with currency symbol
     */
    public function getFormattedPriceAttribute(): string
    {
        if ($this->pricing_type === 'free') {
            return 'Free';
        }

        $symbols = [
            'GBP' => '£',
            'USD' => '$',
            'EUR' => '€',
        ];

        $symbol = $symbols[$this->currency] ?? $this->currency;
        $suffix = '';

        switch ($this->pricing_type) {
            case 'per_person':
                $suffix = '/person';
                break;
            case 'hourly':
                $suffix = '/hour';
                break;
        }

        return $symbol . number_format($this->price, 2) . $suffix;
    }

    /**
     * Get formatted duration
     */
    public function getFormattedDurationAttribute(): string
    {
        $hours = floor($this->duration_minutes / 60);
        $minutes = $this->duration_minutes % 60;

        if ($hours > 0 && $minutes > 0) {
            return "{$hours}h {$minutes}m";
        } elseif ($hours > 0) {
            return "{$hours} hour" . ($hours > 1 ? 's' : '');
        } else {
            return "{$minutes} minutes";
        }
    }

    /**
     * Scope for active services
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for appointments
     */
    public function scopeAppointments($query)
    {
        return $query->where('type', 'appointment');
    }

    /**
     * Scope for reservations
     */
    public function scopeReservations($query)
    {
        return $query->where('type', 'reservation');
    }
}
