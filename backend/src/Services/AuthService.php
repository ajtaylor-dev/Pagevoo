<?php
namespace Services;
use Core\Database;
use Models\User;
use Models\Token;
use Utils\Email;
use Utils\TOTP;
use Services\SiteService;
use Services\SiteProvisioner;
use Models\Site;

class AuthService {

    private static function isDev(): bool {
        return (($_ENV['APP_ENV'] ?? 'development') === 'development');
    }

    private static function ensureTotpSecret(int $userId, string $email): string {
        $user = User::findById($userId);
        if (!empty($user['totp_secret'])) return $user['totp_secret'];

        $secret = self::generateBase32Secret(20);
        User::setTotpSecret($userId, $secret);

        // In dev, "email" (log) provisioning info so you can scan it
        $issuer = rawurlencode($_ENV['TOTP_ISSUER'] ?? 'Pagevoo');
        $label  = rawurlencode($email);
        $otpauth = "otpauth://totp/{$issuer}:{$label}?secret={$secret}&issuer={$issuer}&digits=6&period=30";
        Email::send($email, 'Pagevoo 2FA setup (dev)', "Add this account to your authenticator app:\n\nSecret: {$secret}\nOTPAuth: {$otpauth}");

        return $secret;
    }

    // Base32 (RFC 4648) without padding
    private static function generateBase32Secret(int $bytes = 20): string {
        $random = random_bytes($bytes);
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $bits = '';
        for ($i=0; $i<strlen($random); $i++) {
            $bits .= str_pad(decbin(ord($random[$i])), 8, '0', STR_PAD_LEFT);
        }
        $out = '';
        for ($i=0; $i < strlen($bits); $i += 5) {
            $chunk = substr($bits, $i, 5);
            if (strlen($chunk) < 5) $chunk = str_pad($chunk, 5, '0', STR_PAD_RIGHT);
            $out .= $alphabet[bindec($chunk)];
        }
        return $out;
    }

    public static function register(string $name, string $email, string $password, string $secretQ, string $secretA): int {
        $existing = User::findByEmail($email);
        if ($existing) throw new \Exception('Email already registered');
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $userId = User::create($name, $email, $hash, $secretQ, $secretA);

        if (!self::isDev()) {
            $token = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', time() + 3600);
            Token::createEmailVerification($userId, $token, $expires);
            $verifyUrl = (isset($_ENV['APP_URL']) ? rtrim($_ENV['APP_URL'],'/') : 'http://localhost') . '/api/auth/verify?token=' . $token;
            Email::send($email, 'Verify your Pagevoo email', "Verify your email within 1 hour:\n\n{$verifyUrl}");
        } else {
            // Dev bypass: mark email verified immediately
            User::setEmailVerified($userId);
        }
        
// Auto-create demo site on registration
try {
    $dbName = SiteProvisioner::createDemoDatabase($userId);
    Site::create($userId, 'demo', 'active', $dbName);
} catch (\Throwable $e) {
    // Non-fatal: user account exists even if site creation fails
    error_log('Demo site creation failed for user '.$userId.': '.$e->getMessage());
}


        return $userId;
    }

    public static function login(string $email, string $password, ?string $code = null): array {
        $user = User::findByEmail($email);
        if (!$user || !password_verify($password, $user['password'])) {
            throw new \Exception('Invalid credentials');
        }

        if (!self::isDev() && (int)$user['email_verified'] !== 1) {
            throw new \Exception('Please verify your email first');
        }

        // Provision a secret on first login so it's ready by the time we need it
        $secret = $user['totp_secret'] ?? null;
        if (empty($secret)) {
            $secret = self::ensureTotpSecret((int)$user['id'], $user['email']);
            $user['totp_secret'] = $secret;
        }

        $nextCount = (int)$user['login_count'] + 1;
        $requires2fa = !self::isDev() && !empty($user['totp_secret']) && ($nextCount % 3 === 0);

        if ($requires2fa) {
            if (!$code) {
                $_SESSION['uid_pending'] = (int)$user['id'];
                $_SESSION['requires_2fa'] = true;
                return ['requires2fa' => true];
            }
            if (!TOTP::verify($user['totp_secret'], $code)) {
                throw new \Exception('Invalid 2FA code');
            }
        }

        self::completeLogin((int)$user['id']);
        User::incrementLoginCount((int)$user['id']);

        $payload = ['id'=>(int)$user['id'], 'name'=>$user['name'], 'email'=>$user['email'], 'role'=>$user['role']];
        return ['ok'=>true, 'user'=>$payload];
    }

    public static function completeLogin(int $userId): void {
        $_SESSION['uid'] = $userId;
        unset($_SESSION['uid_pending'], $_SESSION['requires_2fa']);
    }

    public static function verifyPending2FA(string $code): array {
        if (empty($_SESSION['uid_pending'])) throw new \Exception('No 2FA challenge in progress');
        $user = User::findById((int)$_SESSION['uid_pending']);
        if (!$user || empty($user['totp_secret'])) throw new \Exception('No 2FA set up');
        if (!TOTP::verify($user['totp_secret'], $code)) throw new \Exception('Invalid 2FA code');
        self::completeLogin((int)$user['id']);
        User::incrementLoginCount((int)$user['id']);
        $payload = ['id'=>(int)$user['id'], 'name'=>$user['name'], 'email'=>$user['email'], 'role'=>$user['role']];
        return ['ok'=>true, 'user'=>$payload];
    }

    public static function twoFASetupData(int $userId): array {
        if (!self::isDev()) throw new \Exception('2FA setup endpoint disabled in production');
        $user = User::findById($userId);
        if (!$user) throw new \Exception('User not found');
        if (empty($user['totp_secret'])) {
            $secret = self::ensureTotpSecret((int)$user['id'], $user['email']);
            $user['totp_secret'] = $secret;
        }
        $issuer = rawurlencode($_ENV['TOTP_ISSUER'] ?? 'Pagevoo');
        $label  = rawurlencode($user['email']);
        $otpauth = "otpauth://totp/{$issuer}:{$label}?secret={$user['totp_secret']}&issuer={$issuer}&digits=6&period=30";
        return ['secret'=>$user['totp_secret'], 'otpauth'=>$otpauth];
    }

    public static function me(?int $userId): array {
        if (!$userId) return ['user'=>null];
        $user = User::findById($userId);
        if (!$user) return ['user'=>null];
        $payload = ['id'=>(int)$user['id'], 'name'=>$user['name'], 'email'=>$user['email'], 'role'=>$user['role']];
        return ['user'=>$payload];
    }

    public static function logout(): void {
        session_destroy();
        session_start();
    }
}
