<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Uas\UasUser;
use App\Models\Uas\UasGroup;
use App\Models\Uas\UasSession;
use App\Models\Uas\UasEmailVerification;
use App\Models\Uas\UasPasswordReset;
use App\Models\Uas\UasSecurityQuestion;
use App\Models\Uas\UasUserSecurityAnswer;
use App\Models\Uas\UasSetting;
use App\Models\Uas\UasActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class UasAuthController extends Controller
{
    protected $connection;

    public function __construct(Request $request)
    {
        $this->connection = $request->get('db_connection', 'mysql');
    }

    // ==================== REGISTRATION ====================

    /**
     * Step 1: Initiate registration - sends verification email
     */
    public function initiateRegistration(Request $request): JsonResponse
    {
        // Check if registration is enabled
        $registrationEnabled = UasSetting::on($this->connection)->getValue('registration_enabled', 'true');
        if ($registrationEnabled !== 'true') {
            return response()->json(['error' => 'Registration is currently disabled'], 403);
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:8',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
        ]);

        // Check email doesn't already exist
        $exists = UasUser::on($this->connection)
            ->where('email', $validated['email'])
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Email already registered'], 422);
        }

        // Check for existing pending verification
        UasEmailVerification::on($this->connection)
            ->where('email', $validated['email'])
            ->delete();

        // Create verification record
        $token = UasEmailVerification::generateToken();
        $expiryHours = (int) UasSetting::on($this->connection)->getValue('password_reset_expiry_hours', '24');

        $verification = UasEmailVerification::on($this->connection)->create([
            'email' => $validated['email'],
            'token' => $token,
            'registration_data' => [
                'password' => Hash::make($validated['password']),
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
            ],
            'expires_at' => now()->addHours($expiryHours),
        ]);

        // TODO: Send verification email
        // Mail::to($validated['email'])->send(new VerifyEmailMail($token));

        UasActivityLog::on($this->connection)->log(
            'registration_initiated',
            null,
            $request->ip(),
            $request->userAgent(),
            ['email' => $validated['email']]
        );

        return response()->json([
            'message' => 'Verification email sent. Please check your inbox.',
            'token' => $token, // In production, remove this - only for testing
        ]);
    }

    /**
     * Step 2: Verify email token
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string|size:64',
        ]);

        $verification = UasEmailVerification::on($this->connection)
            ->where('token', $validated['token'])
            ->first();

        if (!$verification) {
            return response()->json(['error' => 'Invalid verification token'], 404);
        }

        if ($verification->isExpired()) {
            $verification->delete();
            return response()->json(['error' => 'Verification token has expired'], 410);
        }

        // Get security questions for next step
        $questions = UasSecurityQuestion::on($this->connection)
            ->active()
            ->get(['id', 'question']);

        return response()->json([
            'message' => 'Email verified. Please complete security questions.',
            'email' => $verification->email,
            'security_questions' => $questions,
        ]);
    }

    /**
     * Step 3: Complete registration with security answers
     */
    public function completeRegistration(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string|size:64',
            'security_answers' => 'required|array|size:3',
            'security_answers.*.question_id' => 'required|integer',
            'security_answers.*.answer' => 'required|string|min:2',
        ]);

        $verification = UasEmailVerification::on($this->connection)
            ->where('token', $validated['token'])
            ->first();

        if (!$verification || $verification->isExpired()) {
            return response()->json(['error' => 'Invalid or expired verification'], 400);
        }

        $registrationData = $verification->registration_data;

        // Get default group
        $defaultGroup = UasGroup::on($this->connection)->getDefaultGroup();
        if (!$defaultGroup) {
            $defaultGroup = UasGroup::on($this->connection)->where('slug', 'members')->first();
        }

        // Create user
        $user = UasUser::on($this->connection)->create([
            'email' => $verification->email,
            'password' => $registrationData['password'], // Already hashed
            'first_name' => $registrationData['first_name'],
            'last_name' => $registrationData['last_name'],
            'group_id' => $defaultGroup->id,
            'status' => 'active',
            'email_verified' => true,
            'email_verified_at' => now(),
        ]);

        // Save security answers
        foreach ($validated['security_answers'] as $answer) {
            $securityAnswer = new UasUserSecurityAnswer();
            $securityAnswer->setConnection($this->connection);
            $securityAnswer->user_id = $user->id;
            $securityAnswer->question_id = $answer['question_id'];
            $securityAnswer->setAnswer($answer['answer']);
            $securityAnswer->save();
        }

        // Delete verification record
        $verification->delete();

        UasActivityLog::on($this->connection)->log(
            'registration_completed',
            $user->id,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'message' => 'Registration complete. You can now log in.',
            'user' => $user->load('group'),
        ], 201);
    }

    // ==================== LOGIN / LOGOUT ====================

    /**
     * Login
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'remember_me' => 'nullable|boolean',
        ]);

        $user = UasUser::on($this->connection)
            ->where('email', $validated['email'])
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        // Check if banned
        if ($user->isBanned()) {
            UasActivityLog::on($this->connection)->log(
                'login_blocked_banned',
                $user->id,
                $request->ip(),
                $request->userAgent()
            );
            return response()->json(['error' => 'Account suspended. Please contact support.'], 403);
        }

        // Check if email verified
        if (!$user->email_verified) {
            return response()->json(['error' => 'Please verify your email before logging in'], 403);
        }

        // Check password
        if (!Hash::check($validated['password'], $user->password)) {
            UasActivityLog::on($this->connection)->log(
                'login_failed',
                $user->id,
                $request->ip(),
                $request->userAgent()
            );
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        // Create session
        $rememberMe = $validated['remember_me'] ?? false;
        $sessionLifetime = $rememberMe
            ? (int) UasSetting::on($this->connection)->getValue('remember_me_days', '30') * 24 * 60
            : (int) UasSetting::on($this->connection)->getValue('session_lifetime_minutes', '120');

        $session = UasSession::on($this->connection)->create([
            'user_id' => $user->id,
            'token' => UasSession::generateToken(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'remember_me' => $rememberMe,
            'expires_at' => now()->addMinutes($sessionLifetime),
            'last_activity_at' => now(),
        ]);

        // Update user last login
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        UasActivityLog::on($this->connection)->log(
            'login',
            $user->id,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'message' => 'Login successful',
            'user' => $user->load('group'),
            'session_token' => $session->token,
            'expires_at' => $session->expires_at,
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken() ?? $request->header('X-Session-Token');

        if ($token) {
            $session = UasSession::on($this->connection)
                ->where('token', $token)
                ->first();

            if ($session) {
                UasActivityLog::on($this->connection)->log(
                    'logout',
                    $session->user_id,
                    $request->ip(),
                    $request->userAgent()
                );
                $session->delete();
            }
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Get current session user
     */
    public function getCurrentUser(Request $request): JsonResponse
    {
        $token = $request->bearerToken() ?? $request->header('X-Session-Token');

        if (!$token) {
            return response()->json(['error' => 'No session token provided'], 401);
        }

        $session = UasSession::on($this->connection)
            ->where('token', $token)
            ->with('user.group')
            ->first();

        if (!$session || !$session->isValid()) {
            if ($session) {
                $session->delete();
            }
            return response()->json(['error' => 'Invalid or expired session'], 401);
        }

        // Touch session activity
        $session->touch();

        return response()->json([
            'user' => $session->user,
            'session' => [
                'expires_at' => $session->expires_at,
                'remember_me' => $session->remember_me,
            ],
        ]);
    }

    // ==================== PASSWORD RESET ====================

    /**
     * Step 1: Request password reset - sends email
     */
    public function requestPasswordReset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $user = UasUser::on($this->connection)
            ->where('email', $validated['email'])
            ->first();

        // Always return success to prevent email enumeration
        if (!$user) {
            return response()->json(['message' => 'If an account exists, a reset email will be sent']);
        }

        // Delete existing reset requests
        UasPasswordReset::on($this->connection)
            ->where('user_id', $user->id)
            ->delete();

        $expiryHours = (int) UasSetting::on($this->connection)->getValue('password_reset_expiry_hours', '24');

        $reset = UasPasswordReset::on($this->connection)->create([
            'user_id' => $user->id,
            'token' => UasPasswordReset::generateToken(),
            'expires_at' => now()->addHours($expiryHours),
        ]);

        // TODO: Send reset email
        // Mail::to($user->email)->send(new PasswordResetMail($reset->token));

        UasActivityLog::on($this->connection)->log(
            'password_reset_requested',
            $user->id,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'message' => 'If an account exists, a reset email will be sent',
            'token' => $reset->token, // Remove in production - for testing only
        ]);
    }

    /**
     * Step 2: Verify reset token from email
     */
    public function verifyResetToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string|size:64',
        ]);

        $reset = UasPasswordReset::on($this->connection)
            ->where('token', $validated['token'])
            ->with('user')
            ->first();

        if (!$reset || $reset->isExpired()) {
            return response()->json(['error' => 'Invalid or expired reset token'], 400);
        }

        // Mark email as verified
        $reset->update(['email_verified' => true]);

        // Get user's security questions
        $answers = UasUserSecurityAnswer::on($this->connection)
            ->where('user_id', $reset->user_id)
            ->with('question')
            ->get();

        $questions = $answers->map(fn($a) => [
            'id' => $a->question_id,
            'question' => $a->question->question,
        ]);

        return response()->json([
            'message' => 'Token verified. Please answer security questions.',
            'security_questions' => $questions,
        ]);
    }

    /**
     * Step 3: Verify security questions
     */
    public function verifySecurityQuestions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string|size:64',
            'answers' => 'required|array|size:3',
            'answers.*.question_id' => 'required|integer',
            'answers.*.answer' => 'required|string',
        ]);

        $reset = UasPasswordReset::on($this->connection)
            ->where('token', $validated['token'])
            ->first();

        if (!$reset || $reset->isExpired() || !$reset->email_verified) {
            return response()->json(['error' => 'Invalid reset request'], 400);
        }

        // Verify all answers
        $userAnswers = UasUserSecurityAnswer::on($this->connection)
            ->where('user_id', $reset->user_id)
            ->get()
            ->keyBy('question_id');

        foreach ($validated['answers'] as $answer) {
            $storedAnswer = $userAnswers->get($answer['question_id']);
            if (!$storedAnswer || !$storedAnswer->verifyAnswer($answer['answer'])) {
                UasActivityLog::on($this->connection)->log(
                    'password_reset_questions_failed',
                    $reset->user_id,
                    $request->ip(),
                    $request->userAgent()
                );
                return response()->json(['error' => 'One or more answers are incorrect'], 400);
            }
        }

        // Mark questions as verified
        $reset->update(['questions_verified' => true]);

        UasActivityLog::on($this->connection)->log(
            'password_reset_questions_verified',
            $reset->user_id,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'message' => 'Security questions verified. You can now set a new password.',
        ]);
    }

    /**
     * Step 4: Set new password
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string|size:64',
            'password' => 'required|min:8|confirmed',
        ]);

        $reset = UasPasswordReset::on($this->connection)
            ->where('token', $validated['token'])
            ->with('user')
            ->first();

        if (!$reset || $reset->isExpired() || !$reset->isFullyVerified()) {
            return response()->json(['error' => 'Invalid reset request'], 400);
        }

        // Update password
        $reset->user->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Invalidate all existing sessions
        UasSession::on($this->connection)
            ->where('user_id', $reset->user_id)
            ->delete();

        // Delete reset record
        $reset->delete();

        UasActivityLog::on($this->connection)->log(
            'password_reset_completed',
            $reset->user_id,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'message' => 'Password reset successful. You can now log in with your new password.',
        ]);
    }

    // ==================== SECURITY QUESTIONS ====================

    /**
     * Get available security questions
     */
    public function getSecurityQuestions(): JsonResponse
    {
        $questions = UasSecurityQuestion::on($this->connection)
            ->active()
            ->get(['id', 'question']);

        return response()->json($questions);
    }

    // ==================== PROFILE MANAGEMENT ====================

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $token = $request->bearerToken() ?? $request->header('X-Session-Token');

        if (!$token) {
            return response()->json(['error' => 'No session token provided'], 401);
        }

        $session = UasSession::on($this->connection)
            ->where('token', $token)
            ->with('user')
            ->first();

        if (!$session || !$session->isValid()) {
            return response()->json(['error' => 'Invalid or expired session'], 401);
        }

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'display_name' => 'sometimes|nullable|string|max:255',
            'email' => 'sometimes|email|max:255',
        ]);

        $user = $session->user;

        // Check if email is being changed and if it's already taken
        if (isset($validated['email']) && $validated['email'] !== $user->email) {
            $exists = UasUser::on($this->connection)
                ->where('email', $validated['email'])
                ->where('id', '!=', $user->id)
                ->exists();

            if ($exists) {
                return response()->json(['error' => 'Email already in use'], 422);
            }
        }

        $user->update($validated);

        UasActivityLog::on($this->connection)->log(
            'profile_updated',
            $user->id,
            $request->ip(),
            $request->userAgent(),
            ['fields' => array_keys($validated)]
        );

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh()->load('group'),
        ]);
    }

    /**
     * Change password (while logged in)
     */
    public function changePassword(Request $request): JsonResponse
    {
        $token = $request->bearerToken() ?? $request->header('X-Session-Token');

        if (!$token) {
            return response()->json(['error' => 'No session token provided'], 401);
        }

        $session = UasSession::on($this->connection)
            ->where('token', $token)
            ->with('user')
            ->first();

        if (!$session || !$session->isValid()) {
            return response()->json(['error' => 'Invalid or expired session'], 401);
        }

        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|min:8|confirmed',
        ]);

        $user = $session->user;

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            UasActivityLog::on($this->connection)->log(
                'password_change_failed',
                $user->id,
                $request->ip(),
                $request->userAgent()
            );
            return response()->json(['error' => 'Current password is incorrect'], 400);
        }

        // Update password
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        UasActivityLog::on($this->connection)->log(
            'password_changed',
            $user->id,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }

    /**
     * Update security questions
     */
    public function updateSecurityQuestions(Request $request): JsonResponse
    {
        $token = $request->bearerToken() ?? $request->header('X-Session-Token');

        if (!$token) {
            return response()->json(['error' => 'No session token provided'], 401);
        }

        $session = UasSession::on($this->connection)
            ->where('token', $token)
            ->first();

        if (!$session || !$session->isValid()) {
            return response()->json(['error' => 'Invalid or expired session'], 401);
        }

        $validated = $request->validate([
            'current_password' => 'required|string',
            'security_answers' => 'required|array|size:3',
            'security_answers.*.question_id' => 'required|integer',
            'security_answers.*.answer' => 'required|string|min:2',
        ]);

        $user = UasUser::on($this->connection)->find($session->user_id);

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['error' => 'Current password is incorrect'], 400);
        }

        // Delete existing security answers
        UasUserSecurityAnswer::on($this->connection)
            ->where('user_id', $user->id)
            ->delete();

        // Save new security answers
        foreach ($validated['security_answers'] as $answer) {
            $securityAnswer = new UasUserSecurityAnswer();
            $securityAnswer->setConnection($this->connection);
            $securityAnswer->user_id = $user->id;
            $securityAnswer->question_id = $answer['question_id'];
            $securityAnswer->setAnswer($answer['answer']);
            $securityAnswer->save();
        }

        UasActivityLog::on($this->connection)->log(
            'security_questions_updated',
            $user->id,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'message' => 'Security questions updated successfully',
        ]);
    }

    // ==================== SESSION MANAGEMENT ====================

    /**
     * Get all active sessions for the current user
     */
    public function getSessions(Request $request): JsonResponse
    {
        $token = $request->bearerToken() ?? $request->header('X-Session-Token');

        if (!$token) {
            return response()->json(['error' => 'No session token provided'], 401);
        }

        $currentSession = UasSession::on($this->connection)
            ->where('token', $token)
            ->first();

        if (!$currentSession || !$currentSession->isValid()) {
            return response()->json(['error' => 'Invalid or expired session'], 401);
        }

        $sessions = UasSession::on($this->connection)
            ->where('user_id', $currentSession->user_id)
            ->where('expires_at', '>', now())
            ->orderBy('last_activity_at', 'desc')
            ->get()
            ->map(function ($session) use ($token) {
                return [
                    'id' => $session->id,
                    'ip_address' => $session->ip_address,
                    'user_agent' => $session->user_agent,
                    'device' => $this->parseUserAgent($session->user_agent),
                    'created_at' => $session->created_at,
                    'last_activity_at' => $session->last_activity_at,
                    'expires_at' => $session->expires_at,
                    'is_current' => $session->token === $token,
                ];
            });

        return response()->json([
            'sessions' => $sessions,
        ]);
    }

    /**
     * Terminate a specific session
     */
    public function terminateSession(Request $request, int $sessionId): JsonResponse
    {
        $token = $request->bearerToken() ?? $request->header('X-Session-Token');

        if (!$token) {
            return response()->json(['error' => 'No session token provided'], 401);
        }

        $currentSession = UasSession::on($this->connection)
            ->where('token', $token)
            ->first();

        if (!$currentSession || !$currentSession->isValid()) {
            return response()->json(['error' => 'Invalid or expired session'], 401);
        }

        // Find the session to terminate
        $sessionToTerminate = UasSession::on($this->connection)
            ->where('id', $sessionId)
            ->where('user_id', $currentSession->user_id)
            ->first();

        if (!$sessionToTerminate) {
            return response()->json(['error' => 'Session not found'], 404);
        }

        // Prevent terminating current session through this endpoint
        if ($sessionToTerminate->token === $token) {
            return response()->json(['error' => 'Cannot terminate current session. Use logout instead.'], 400);
        }

        $sessionToTerminate->delete();

        UasActivityLog::on($this->connection)->log(
            'session_terminated',
            $currentSession->user_id,
            $request->ip(),
            $request->userAgent(),
            ['terminated_session_id' => $sessionId]
        );

        return response()->json([
            'message' => 'Session terminated successfully',
        ]);
    }

    /**
     * Terminate all sessions except current
     */
    public function terminateAllOtherSessions(Request $request): JsonResponse
    {
        $token = $request->bearerToken() ?? $request->header('X-Session-Token');

        if (!$token) {
            return response()->json(['error' => 'No session token provided'], 401);
        }

        $currentSession = UasSession::on($this->connection)
            ->where('token', $token)
            ->first();

        if (!$currentSession || !$currentSession->isValid()) {
            return response()->json(['error' => 'Invalid or expired session'], 401);
        }

        $count = UasSession::on($this->connection)
            ->where('user_id', $currentSession->user_id)
            ->where('token', '!=', $token)
            ->delete();

        UasActivityLog::on($this->connection)->log(
            'all_sessions_terminated',
            $currentSession->user_id,
            $request->ip(),
            $request->userAgent(),
            ['sessions_count' => $count]
        );

        return response()->json([
            'message' => "Terminated {$count} session(s)",
            'count' => $count,
        ]);
    }

    /**
     * Parse user agent to get device info
     */
    private function parseUserAgent(?string $userAgent): array
    {
        if (!$userAgent) {
            return ['browser' => 'Unknown', 'os' => 'Unknown', 'device' => 'Unknown'];
        }

        $browser = 'Unknown';
        $os = 'Unknown';
        $device = 'Desktop';

        // Detect browser
        if (str_contains($userAgent, 'Firefox')) {
            $browser = 'Firefox';
        } elseif (str_contains($userAgent, 'Edg')) {
            $browser = 'Edge';
        } elseif (str_contains($userAgent, 'Chrome')) {
            $browser = 'Chrome';
        } elseif (str_contains($userAgent, 'Safari')) {
            $browser = 'Safari';
        } elseif (str_contains($userAgent, 'Opera') || str_contains($userAgent, 'OPR')) {
            $browser = 'Opera';
        }

        // Detect OS
        if (str_contains($userAgent, 'Windows')) {
            $os = 'Windows';
        } elseif (str_contains($userAgent, 'Mac')) {
            $os = 'macOS';
        } elseif (str_contains($userAgent, 'Linux')) {
            $os = 'Linux';
        } elseif (str_contains($userAgent, 'Android')) {
            $os = 'Android';
            $device = 'Mobile';
        } elseif (str_contains($userAgent, 'iOS') || str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad')) {
            $os = 'iOS';
            $device = str_contains($userAgent, 'iPad') ? 'Tablet' : 'Mobile';
        }

        return [
            'browser' => $browser,
            'os' => $os,
            'device' => $device,
        ];
    }
}
