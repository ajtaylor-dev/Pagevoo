<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemplateSection extends Model
{
    protected $fillable = [
        'template_page_id',
        'section_name',
        'section_id',
        'type',
        'content',
        'css',
        'order',
        'is_locked',
        'lock_type',
    ];

    protected $casts = [
        'content' => 'array',
        'css' => 'array',
        'is_locked' => 'boolean',
    ];

    /**
     * Check if this section is locked and cannot be deleted.
     */
    public function isLocked(): bool
    {
        return $this->is_locked === true;
    }

    public function templatePage()
    {
        return $this->belongsTo(TemplatePage::class);
    }

    public function userSections()
    {
        return $this->hasMany(UserSection::class);
    }
}
