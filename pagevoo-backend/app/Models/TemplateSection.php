<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemplateSection extends Model
{
    protected $fillable = [
        'template_page_id',
        'name',
        'type',
        'content',
        'order'
    ];

    protected $casts = [
        'content' => 'array'
    ];

    public function templatePage()
    {
        return $this->belongsTo(TemplatePage::class);
    }

    public function userSections()
    {
        return $this->hasMany(UserSection::class);
    }
}
