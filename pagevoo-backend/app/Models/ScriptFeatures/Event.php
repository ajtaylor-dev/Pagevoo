<?php

namespace App\Models\ScriptFeatures;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Carbon\Carbon;

class Event extends Model
{
    /**
     * The table associated with the model.
     * This will be in the per-user database (pagevoo_website_{user_id})
     *
     * @var string
     */
    protected $table = 'events';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'website_id',
        'title',
        'slug',
        'description',
        'content',
        'featured_image',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'is_all_day',
        'location',
        'location_url',
        'latitude',
        'longitude',
        'is_online',
        'online_url',
        'category_id',
        'status',
        'is_featured',
        'is_recurring',
        'recurrence_type',
        'recurrence_interval',
        'recurrence_end_date',
        'parent_event_id',
        'organizer_name',
        'organizer_email',
        'organizer_phone',
        'ticket_url',
        'price',
        'price_text',
        'capacity',
        'seo_meta',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'recurrence_end_date' => 'date',
        'is_all_day' => 'boolean',
        'is_online' => 'boolean',
        'is_featured' => 'boolean',
        'is_recurring' => 'boolean',
        'recurrence_interval' => 'integer',
        'capacity' => 'integer',
        'price' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'seo_meta' => 'array',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($event) {
            if (empty($event->slug)) {
                $event->slug = Str::slug($event->title);
            }
        });
    }

    /**
     * Get the category for this event.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(EventCategory::class, 'category_id');
    }

    /**
     * Get the parent event (for recurring instances).
     */
    public function parentEvent(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'parent_event_id');
    }

    /**
     * Get recurring instances of this event.
     */
    public function recurringInstances(): HasMany
    {
        return $this->hasMany(Event::class, 'parent_event_id');
    }

    /**
     * Check if the event is upcoming.
     */
    public function getIsUpcomingAttribute(): bool
    {
        return $this->start_date >= now()->toDateString();
    }

    /**
     * Check if the event is ongoing.
     */
    public function getIsOngoingAttribute(): bool
    {
        $today = now()->toDateString();
        $endDate = $this->end_date ?? $this->start_date;
        return $this->start_date <= $today && $endDate >= $today;
    }

    /**
     * Check if the event is past.
     */
    public function getIsPastAttribute(): bool
    {
        $endDate = $this->end_date ?? $this->start_date;
        return $endDate < now()->toDateString();
    }

    /**
     * Check if the event spans multiple days.
     */
    public function getIsMultiDayAttribute(): bool
    {
        return $this->end_date && $this->end_date > $this->start_date;
    }

    /**
     * Get formatted date range string.
     */
    public function getFormattedDateRangeAttribute(): string
    {
        $format = 'M j, Y';

        if ($this->is_multi_day) {
            return $this->start_date->format($format) . ' - ' . $this->end_date->format($format);
        }

        return $this->start_date->format($format);
    }

    /**
     * Get formatted time range string.
     */
    public function getFormattedTimeRangeAttribute(): ?string
    {
        if ($this->is_all_day) {
            return 'All Day';
        }

        if (!$this->start_time) {
            return null;
        }

        $startTime = Carbon::parse($this->start_time)->format('g:i A');

        if ($this->end_time) {
            $endTime = Carbon::parse($this->end_time)->format('g:i A');
            return $startTime . ' - ' . $endTime;
        }

        return $startTime;
    }

    /**
     * Get the display price text.
     */
    public function getDisplayPriceAttribute(): ?string
    {
        if ($this->price_text) {
            return $this->price_text;
        }

        if ($this->price !== null) {
            if ($this->price == 0) {
                return 'Free';
            }
            return '$' . number_format($this->price, 2);
        }

        return null;
    }

    /**
     * Check if the event has a location.
     */
    public function hasLocation(): bool
    {
        return !empty($this->location) || ($this->is_online && !empty($this->online_url));
    }

    /**
     * Get the location display text.
     */
    public function getLocationDisplayAttribute(): ?string
    {
        if ($this->is_online && $this->location) {
            return $this->location . ' (Online)';
        }

        if ($this->is_online) {
            return 'Online Event';
        }

        return $this->location;
    }

    /**
     * Scope to only include published events.
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Scope to only include upcoming events.
     */
    public function scopeUpcoming($query)
    {
        return $query->where('start_date', '>=', now()->toDateString());
    }

    /**
     * Scope to only include past events.
     */
    public function scopePast($query)
    {
        return $query->where(function ($q) {
            $q->where('end_date', '<', now()->toDateString())
              ->orWhere(function ($q2) {
                  $q2->whereNull('end_date')
                     ->where('start_date', '<', now()->toDateString());
              });
        });
    }

    /**
     * Scope to only include featured events.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope to filter by category.
     */
    public function scopeInCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * Scope to filter events by date range.
     */
    public function scopeDateBetween($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
              ->orWhereBetween('end_date', [$startDate, $endDate])
              ->orWhere(function ($q2) use ($startDate, $endDate) {
                  $q2->where('start_date', '<=', $startDate)
                     ->where('end_date', '>=', $endDate);
              });
        });
    }

    /**
     * Scope to order by start date (upcoming first).
     */
    public function scopeOrderByDate($query, $direction = 'asc')
    {
        return $query->orderBy('start_date', $direction)
                     ->orderBy('start_time', $direction);
    }
}
