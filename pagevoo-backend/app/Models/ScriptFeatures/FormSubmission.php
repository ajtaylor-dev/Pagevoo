<?php

namespace App\Models\ScriptFeatures;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class FormSubmission extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'form_submissions';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'contact_form_id',
        'data',
        'attachments',
        'ip_address',
        'user_agent',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'data' => 'array',
        'attachments' => 'array',
    ];

    /**
     * Get the contact form that owns the submission.
     */
    public function contactForm(): BelongsTo
    {
        return $this->belongsTo(ContactForm::class, 'contact_form_id');
    }

    /**
     * Get the support ticket for this submission.
     */
    public function supportTicket(): HasOne
    {
        return $this->hasOne(SupportTicket::class, 'form_submission_id');
    }

    /**
     * Mark submission as read.
     */
    public function markAsRead(): bool
    {
        return $this->update(['status' => 'read']);
    }

    /**
     * Mark submission as spam.
     */
    public function markAsSpam(): bool
    {
        return $this->update(['status' => 'spam']);
    }

    /**
     * Archive the submission.
     */
    public function archive(): bool
    {
        return $this->update(['status' => 'archived']);
    }

    /**
     * Check if submission is unread.
     */
    public function isUnread(): bool
    {
        return $this->status === 'new';
    }

    /**
     * Check if submission is spam.
     */
    public function isSpam(): bool
    {
        return $this->status === 'spam';
    }

    /**
     * Get the submitter's email from data.
     */
    public function getEmailAttribute(): ?string
    {
        return $this->data['email'] ?? null;
    }

    /**
     * Get the submitter's name from data.
     */
    public function getNameAttribute(): ?string
    {
        return $this->data['name'] ?? null;
    }
}
