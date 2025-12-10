<?php

namespace App\Models\Booking;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Booking extends Model
{
    protected $connection = 'website';
    protected $table = 'bookings';

    protected $fillable = [
        'booking_reference',
        'service_id',
        'staff_id',
        'resource_id',
        'uas_user_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'customer_notes',
        'booking_date',
        'start_time',
        'end_time',
        'party_size',
        'is_recurring',
        'recurring_pattern',
        'recurring_parent_id',
        'recurring_end_date',
        'status',
        'cancellation_reason',
        'cancelled_at',
        'total_price',
        'deposit_paid',
        'amount_paid',
        'payment_status',
        'payment_method',
        'payment_reference',
        'admin_notes',
        'reminder_sent',
        'reminder_sent_at',
    ];

    protected $casts = [
        'booking_date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'recurring_end_date' => 'date',
        'cancelled_at' => 'datetime',
        'reminder_sent_at' => 'datetime',
        'is_recurring' => 'boolean',
        'reminder_sent' => 'boolean',
        'total_price' => 'decimal:2',
        'deposit_paid' => 'decimal:2',
        'amount_paid' => 'decimal:2',
    ];

    /**
     * Boot function to auto-generate booking reference
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($booking) {
            if (empty($booking->booking_reference)) {
                $booking->booking_reference = 'BK-' . strtoupper(Str::random(8));
            }
        });
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(BookingService::class, 'service_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(BookingStaff::class, 'staff_id');
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(BookingResource::class, 'resource_id');
    }

    public function recurringParent(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'recurring_parent_id');
    }

    public function recurringChildren(): HasMany
    {
        return $this->hasMany(Booking::class, 'recurring_parent_id');
    }

    /**
     * Get formatted date
     */
    public function getFormattedDateAttribute(): string
    {
        return $this->booking_date->format('D, M j, Y');
    }

    /**
     * Get formatted time range
     */
    public function getFormattedTimeAttribute(): string
    {
        $start = date('g:i A', strtotime($this->start_time));
        $end = date('g:i A', strtotime($this->end_time));
        return "{$start} - {$end}";
    }

    /**
     * Get status badge color
     */
    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'pending' => 'yellow',
            'confirmed' => 'green',
            'cancelled' => 'red',
            'no_show' => 'gray',
            'completed' => 'blue',
            default => 'gray',
        };
    }

    /**
     * Get payment status badge color
     */
    public function getPaymentStatusColorAttribute(): string
    {
        return match ($this->payment_status) {
            'not_required' => 'gray',
            'pending' => 'yellow',
            'deposit_paid' => 'blue',
            'paid' => 'green',
            'refunded' => 'red',
            'partial_refund' => 'orange',
            default => 'gray',
        };
    }

    /**
     * Check if booking can be cancelled
     */
    public function canBeCancelled(): bool
    {
        if (in_array($this->status, ['cancelled', 'completed', 'no_show'])) {
            return false;
        }

        // Check cancellation window
        $service = $this->service;
        if ($service) {
            $bookingDateTime = $this->booking_date->setTimeFromTimeString($this->start_time);
            $cancellationDeadline = $bookingDateTime->subHours($service->cancellation_hours);
            return now()->lt($cancellationDeadline);
        }

        return true;
    }

    /**
     * Check if booking is upcoming
     */
    public function getIsUpcomingAttribute(): bool
    {
        $bookingDateTime = $this->booking_date->setTimeFromTimeString($this->start_time);
        return $bookingDateTime->gt(now()) && !in_array($this->status, ['cancelled', 'no_show']);
    }

    /**
     * Check if booking is past
     */
    public function getIsPastAttribute(): bool
    {
        $bookingDateTime = $this->booking_date->setTimeFromTimeString($this->end_time);
        return $bookingDateTime->lt(now());
    }

    /**
     * Scope for upcoming bookings
     */
    public function scopeUpcoming($query)
    {
        return $query->where('booking_date', '>=', now()->toDateString())
            ->whereNotIn('status', ['cancelled', 'no_show']);
    }

    /**
     * Scope for today's bookings
     */
    public function scopeToday($query)
    {
        return $query->where('booking_date', now()->toDateString());
    }

    /**
     * Scope for pending bookings
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for confirmed bookings
     */
    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    /**
     * Scope by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('booking_date', [$startDate, $endDate]);
    }
}
