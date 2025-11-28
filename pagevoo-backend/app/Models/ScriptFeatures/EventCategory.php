<?php

namespace App\Models\ScriptFeatures;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class EventCategory extends Model
{
    /**
     * The table associated with the model.
     * This will be in the per-user database (pagevoo_website_{user_id})
     *
     * @var string
     */
    protected $table = 'event_categories';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'website_id',
        'name',
        'slug',
        'description',
        'color',
        'order',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'order' => 'integer',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    /**
     * Get the events for this category.
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class, 'category_id');
    }

    /**
     * Get the count of published events in this category.
     */
    public function getPublishedEventsCountAttribute(): int
    {
        return $this->events()->where('status', 'published')->count();
    }

    /**
     * Get the count of upcoming events in this category.
     */
    public function getUpcomingEventsCountAttribute(): int
    {
        return $this->events()
            ->where('status', 'published')
            ->where('start_date', '>=', now()->toDateString())
            ->count();
    }

    /**
     * Scope to order by the order field.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order', 'asc')->orderBy('name', 'asc');
    }
}
