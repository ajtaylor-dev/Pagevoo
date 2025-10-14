<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSection extends Model
{
    protected $fillable = [
        'user_page_id',
        'template_section_id',
        'type',
        'section_name',
        'section_id',
        'content',
        'css',
        'order'
    ];

    protected $casts = [
        'content' => 'array',
        'css' => 'array'
    ];

    public function userPage()
    {
        return $this->belongsTo(UserPage::class);
    }

    public function templateSection()
    {
        return $this->belongsTo(TemplateSection::class);
    }
}
