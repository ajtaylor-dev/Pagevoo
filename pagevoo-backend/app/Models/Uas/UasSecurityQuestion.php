<?php

namespace App\Models\Uas;

use Illuminate\Database\Eloquent\Model;

class UasSecurityQuestion extends Model
{
    protected $table = 'uas_security_questions';

    protected $fillable = [
        'question',
        'order',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    /**
     * Scope for active questions only
     */
    public function scopeActive($query)
    {
        return $query->where('active', true)->orderBy('order');
    }
}
