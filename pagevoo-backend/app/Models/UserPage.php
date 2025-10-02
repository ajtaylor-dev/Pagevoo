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
        'is_homepage',
        'order'
    ];

    protected $casts = [
        'is_homepage' => 'boolean'
    ];

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
