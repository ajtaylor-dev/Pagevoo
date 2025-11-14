<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SectionLibrary extends Model
{
    protected $table = 'section_library';

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'preview_image',
        'section_type',
        'section_data',
        'tags',
        'is_public',
        'is_pagevoo_official',
    ];

    protected $casts = [
        'section_data' => 'array',
        'tags' => 'array',
        'is_public' => 'boolean',
        'is_pagevoo_official' => 'boolean',
    ];

    /**
     * Get the user that owns the section library entry.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include public sections.
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope a query to filter by section type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('section_type', $type);
    }

    /**
     * Get the full URL for the preview image.
     */
    public function getPreviewImageUrlAttribute()
    {
        return $this->preview_image
            ? url('storage/' . $this->preview_image)
            : null;
    }
}
