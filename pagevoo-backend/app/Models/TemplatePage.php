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
        'order'
    ];

    protected $casts = [
        'is_homepage' => 'boolean'
    ];

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
