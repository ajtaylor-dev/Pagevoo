<?php

namespace App\Models\Uas;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UasUserSecurityAnswer extends Model
{
    protected $table = 'uas_user_security_answers';

    protected $fillable = [
        'user_id',
        'question_id',
        'answer_hash',
    ];

    protected $hidden = [
        'answer_hash',
    ];

    /**
     * The user this answer belongs to
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UasUser::class, 'user_id');
    }

    /**
     * The question this answers
     */
    public function question(): BelongsTo
    {
        return $this->belongsTo(UasSecurityQuestion::class, 'question_id');
    }

    /**
     * Verify an answer
     */
    public function verifyAnswer(string $answer): bool
    {
        return password_verify(strtolower(trim($answer)), $this->answer_hash);
    }

    /**
     * Set the answer (hashed)
     */
    public function setAnswer(string $answer): void
    {
        $this->answer_hash = password_hash(strtolower(trim($answer)), PASSWORD_DEFAULT);
    }
}
