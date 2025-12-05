<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemplatePage extends Model
{
    protected $fillable = [
        'template_id',
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

    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    public function sections()
    {
        return $this->hasMany(TemplateSection::class)->orderBy('order');
    }

    public function userPages()
    {
        return $this->hasMany(UserPage::class);
    }
}
