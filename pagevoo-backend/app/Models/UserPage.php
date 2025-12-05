<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserPage extends Model
{
    protected $fillable = [
        'user_website_id',
        'template_page_id',
        'name',
        'slug',
        'page_id',
        'meta_description',
        'page_css',
        'is_homepage',
        'order',
        'is_system',
        'system_type',
        'feature_type',
    ];

    protected $casts = [
        'is_homepage' => 'boolean',
        'is_system' => 'boolean',
    ];

    /**
     * Check if this is a system page that cannot be deleted.
     */
    public function isSystemPage(): bool
    {
        return $this->is_system === true;
    }

    public function userWebsite()
    {
        return $this->belongsTo(UserWebsite::class);
    }

    public function templatePage()
    {
        return $this->belongsTo(TemplatePage::class);
    }

    public function sections()
    {
        return $this->hasMany(UserSection::class)->orderBy('order');
    }
}
