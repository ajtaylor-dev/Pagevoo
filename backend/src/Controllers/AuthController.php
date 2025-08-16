<?php
namespace Controllers;
use Core\Response;
use Services\AuthService;
use Utils\Captcha;

class AuthController {
    public function register(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $required = ['name','email','password','secretQ','secretA','captcha'];
        foreach ($required as $r) if (empty($input[$r])) { Response::json(['error'=>"Missing $r"], 422); return; }
        if (!Captcha::verify($input['captcha'])) { Response::json(['error'=>'CAPTCHA failed'], 400); return; }
        try {
            $uid = AuthService::register($input['name'], $input['email'], $input['password'], $input['secretQ'], $input['secretA']);
            Response::json(['ok'=>true, 'userId'=>$uid]);
        } catch (\Exception $e) {
            Response::json(['error'=>$e->getMessage()], 400);
        }
    }

    public function login(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        foreach (['email','password'] as $r) if (empty($input[$r])) { Response::json(['error'=>"Missing $r"], 422); return; }
        try {
            $res = AuthService::login($input['email'], $input['password']);
            if (!($_SESSION['requires_2fa'] ?? false)) {
                AuthService::completeLogin((int)$res['user']['id']);
            } else {
                if (!empty($input['code'])) {
                    if (($_ENV['APP_ENV'] ?? 'development') !== 'production' || preg_match('/^\\d{6}$/', $input['code'])) {
                        AuthService::completeLogin((int)$res['user']['id']);
                    } else {
                        Response::json(['error'=>'Invalid 2FA code'], 401);
                        return;
                    }
                }
            }
            Response::json(['ok'=>true]);
        } catch (\Exception $e) {
            Response::json(['error'=>$e->getMessage()], 401);
        }
    }

    public function me(): void {
        if (!isset($_SESSION['uid'])) { Response::json(['user'=>null]); return; }
        $user = \Models\User::findById((int)$_SESSION['uid']);
        if ($user) unset($user['password'], $user['secret_answer'], $user['secret_question']);
        Response::json(['user'=>$user]);
    }

    public function logout(): void {
        \Services\AuthService::logout();
        Response::json(['ok'=>true]);
    }

    public function verifyEmail(): void {
        $token = $_GET['token'] ?? '';
        if (!$token) { Response::json(['error'=>'Token required'], 400); return; }
        $row = \Models\Token::findEmailVerification($token);
        if (!$row) { Response::json(['error'=>'Invalid token'], 400); return; }
        if (strtotime($row['expires_at']) < time()) { Response::json(['error'=>'Token expired'], 400); return; }
        \Models\User::setEmailVerified((int)$row['user_id']);
        \Models\Token::consumeEmailVerification((int)$row['id']);
        Response::json(['ok'=>true]);
    }
}
