<?php

namespace App\Models\ScriptFeatures;

use Illuminate\Database\Eloquent\Model;

class EventSettings extends Model
{
    /**
     * The table associated with the model.
     * This will be in the per-user database (pagevoo_website_{user_id})
     *
     * @var string
     */
    protected $table = 'event_settings';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'website_id',
        'events_per_page',
        'show_past_events',
        'show_location',
        'show_time',
        'show_category',
        'show_description',
        'show_featured_image',
        'show_organizer',
        'show_price',
        'date_format',
        'time_format',
        'default_view',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'events_per_page' => 'integer',
        'show_past_events' => 'boolean',
        'show_location' => 'boolean',
        'show_time' => 'boolean',
        'show_category' => 'boolean',
        'show_description' => 'boolean',
        'show_featured_image' => 'boolean',
        'show_organizer' => 'boolean',
        'show_price' => 'boolean',
    ];

    /**
     * Get default settings.
     */
    public static function getDefaults(): array
    {
        return [
            'events_per_page' => 10,
            'show_past_events' => false,
            'show_location' => true,
            'show_time' => true,
            'show_category' => true,
            'show_description' => true,
            'show_featured_image' => true,
            'show_organizer' => false,
            'show_price' => true,
            'date_format' => 'M d, Y',
            'time_format' => 'g:i A',
            'default_view' => 'list',
        ];
    }
}
