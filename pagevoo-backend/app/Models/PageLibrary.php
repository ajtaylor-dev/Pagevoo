<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageLibrary extends Model
{
    protected $table = 'page_library';

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'preview_image',
        'meta_description',
        'meta_keywords',
        'page_data',
        'site_css',
        'tags',
        'is_public',
    ];

    protected $casts = [
        'page_data' => 'array',
        'tags' => 'array',
        'is_public' => 'boolean',
    ];

    /**
     * Get the user that owns the page library entry.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include public pages.
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
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

    /**
     * Get the count of sections in this page.
     */
    public function getSectionCountAttribute()
    {
        return isset($this->page_data['sections'])
            ? count($this->page_data['sections'])
            : 0;
    }
}
