<?php

namespace App\Models\Booking;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookingCategory extends Model
{
    protected $connection = 'website';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function services(): HasMany
    {
        return $this->hasMany(BookingService::class, 'category_id');
    }

    public function activeServices(): HasMany
    {
        return $this->hasMany(BookingService::class, 'category_id')->where('is_active', true);
    }
}
