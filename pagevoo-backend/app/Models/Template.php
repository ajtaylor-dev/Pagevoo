<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    protected $fillable = [
        'name',
        'template_slug',
        'description',
        'business_type',
        'preview_image',
        'is_active',
        'created_by',
        'exclusive_to',
        'technologies',
        'features',
        'custom_css',
        'images'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'technologies' => 'array',
        'features' => 'array',
        'images' => 'array'
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function pages()
    {
        return $this->hasMany(TemplatePage::class)->orderBy('order');
    }

    public function userWebsites()
    {
        return $this->hasMany(UserWebsite::class);
    }
}
