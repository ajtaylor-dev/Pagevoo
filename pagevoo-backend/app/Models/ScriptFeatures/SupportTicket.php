<?php

namespace App\Models\ScriptFeatures;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportTicket extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'support_tickets';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'form_submission_id',
        'ticket_number',
        'category',
        'priority',
        'status',
        'assigned_to',
    ];

    /**
     * Get the form submission that owns the ticket.
     */
    public function formSubmission(): BelongsTo
    {
        return $this->belongsTo(FormSubmission::class, 'form_submission_id');
    }

    /**
     * Generate a unique ticket number.
     * Format: TICK-YYYYMMDD-XXXX
     */
    public static function generateTicketNumber(): string
    {
        $date = now()->format('Ymd');
        $count = self::whereDate('created_at', now())->count() + 1;
        $sequence = str_pad($count, 4, '0', STR_PAD_LEFT);

        return "TICK-{$date}-{$sequence}";
    }

    /**
     * Mark ticket as in progress.
     */
    public function markInProgress(): bool
    {
        return $this->update(['status' => 'in_progress']);
    }

    /**
     * Mark ticket as resolved.
     */
    public function markResolved(): bool
    {
        return $this->update(['status' => 'resolved']);
    }

    /**
     * Close the ticket.
     */
    public function close(): bool
    {
        return $this->update(['status' => 'closed']);
    }

    /**
     * Reopen a closed ticket.
     */
    public function reopen(): bool
    {
        return $this->update(['status' => 'open']);
    }

    /**
     * Assign ticket to a user.
     */
    public function assignTo(int $userId): bool
    {
        return $this->update(['assigned_to' => $userId]);
    }

    /**
     * Check if ticket is open.
     */
    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    /**
     * Check if ticket is closed.
     */
    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    /**
     * Check if ticket is assigned.
     */
    public function isAssigned(): bool
    {
        return !is_null($this->assigned_to);
    }
}
