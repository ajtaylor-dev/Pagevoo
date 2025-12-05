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

    public function userPage()
    {
        return $this->belongsTo(UserPage::class);
    }

    public function templateSection()
    {
        return $this->belongsTo(TemplateSection::class);
    }
}
