<?php
namespace Services;
use Core\Database;
use Models\User;
use Models\Token;
use Utils\Email;

class AuthService {
    public static function register(string $name, string $email, string $password, string $secretQ, string $secretA): int {
        $existing = User::findByEmail($email);
        if ($existing) throw new \Exception('Email already registered');
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $userId = User::create($name, $email, $hash, $secretQ, $secretA);

        if (($_ENV['APP_ENV'] ?? 'development') !== 'development') {
            $token = bin2hex(random_bytes(32));
            $expires = (new \DateTimeImmutable('+1 hour'))->format('Y-m-d H:i:s');
            Token::createEmailVerification($userId, $token, $expires);
            $verifyUrl = ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173') . '/verify?token=' . $token;
            Email::send($email, 'Verify your Pagevoo email', "Click to verify: $verifyUrl (expires in 1 hour)");
        } else {
            Database::query("UPDATE users SET email_verified = 1 WHERE id=:id", [':id'=>$userId]);
        }
        return $userId;
    }

    public static function login(string $email, string $password): array {
        $user = User::findByEmail($email);
        if (!$user || !password_verify($password, $user['password'])) {
            throw new \Exception('Invalid credentials');
        }
        if (!(int)$user['email_verified'] && (($_ENV['APP_ENV'] ?? 'development') !== 'development')) {
            throw new \Exception('Email not verified');
        }
        User::incrementLoginCount((int)$user['id']);
        $stmt = Database::query("SELECT login_count FROM users WHERE id=:id", [':id'=>$user['id']]);
        $count = (int)$stmt->fetchColumn();
        $requires2fa = ($count % 3 === 0);

        $_SESSION['uid_pending'] = $user['id'];
        $_SESSION['requires_2fa'] = $requires2fa && (($_ENV['APP_ENV'] ?? 'development') === 'production');

        return ['requires2fa' => $_SESSION['requires_2fa'] ?? false, 'user' => $user];
    }

    public static function completeLogin(int $userId): void {
        $_SESSION['uid'] = $userId;
        unset($_SESSION['uid_pending'], $_SESSION['requires_2fa']);
    }

    public static function logout(): void {
        session_destroy();
        session_start();
    }
}
