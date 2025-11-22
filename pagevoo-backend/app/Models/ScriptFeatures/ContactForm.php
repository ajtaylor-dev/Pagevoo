<?php

namespace App\Models\ScriptFeatures;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactForm extends Model
{
    /**
     * The table associated with the model.
     * This will be in the per-user database (pagevoo_website_{user_id})
     *
     * @var string
     */
    protected $table = 'contact_forms';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'website_id',
        'name',
        'form_type',
        'recipient_email',
        'spam_protection',
        'storage_options',
        'auto_responder',
        'allow_attachments',
        'allowed_file_types',
        'styling',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'spam_protection' => 'array',
        'storage_options' => 'array',
        'auto_responder' => 'array',
        'allowed_file_types' => 'array',
        'styling' => 'array',
        'allow_attachments' => 'boolean',
    ];

    /**
     * Get the form submissions for this contact form.
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class, 'contact_form_id');
    }

    /**
     * Get unread submissions count.
     */
    public function getUnreadCountAttribute(): int
    {
        return $this->submissions()->where('status', 'new')->count();
    }

    /**
     * Check if this is a mass mailer form.
     */
    public function isMassMailer(): bool
    {
        return $this->form_type === 'mass_mailer';
    }

    /**
     * Check if this is a support ticket form.
     */
    public function isSupportForm(): bool
    {
        return $this->form_type === 'support';
    }

    /**
     * Check if spam protection is enabled.
     */
    public function hasSpamProtection(): bool
    {
        return !empty($this->spam_protection);
    }

    /**
     * Check if file attachments are allowed.
     */
    public function allowsAttachments(): bool
    {
        return $this->allow_attachments === true;
    }
}
