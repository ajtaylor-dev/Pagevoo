<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserWebsite extends Model
{
    protected $fillable = [
        'user_id',
        'template_id',
        'published_at'
    ];

    protected $casts = [
        'published_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    public function pages()
    {
        return $this->hasMany(UserPage::class)->orderBy('order');
    }
}
