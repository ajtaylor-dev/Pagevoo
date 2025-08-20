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
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $code = $input['code'] ?? null;
        if (!$email || !$password) { Response::json(['error'=>'Email and password required'], 422); return; }
        try {
            $res = AuthService::login($email, $password, $code);
            Response::json($res);
        } catch (\Exception $e) {
            Response::json(['error'=>$e->getMessage()], 401);
        }
    }

    public function me(): void {
        $uid = $_SESSION['uid'] ?? null;
        $res = AuthService::me($uid ? (int)$uid : null);
        Response::json($res);
    }

    public function logout(): void {
        AuthService::logout();
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
        try {
    $dbName = \Services\SiteProvisioner::createDemoDatabase((int)$row['user_id']);
    \Models\Site::create((int)$row['user_id'], 'demo', 'active', $dbName);
} catch (\Throwable $e) {
    error_log('Demo site creation (post-verify) failed for user '.$row['user_id'].': '.$e->getMessage());
}
        Response::json(['ok'=>true]);
    }

    public function verify2fa(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $code = $input['code'] ?? null;
        if (!$code) { Response::json(['error'=>'Code required'], 422); return; }
        try {
            $res = AuthService::verifyPending2FA($code);
            Response::json($res);
        } catch (\Exception $e) {
            Response::json(['error'=>$e->getMessage()], 401);
        }
    }

    public function twofaSetup(): void {
        $uid = $_SESSION['uid'] ?? null;
        if (!$uid) { Response::json(['error'=>'Unauthorized'], 401); return; }
        try {
            $res = AuthService::twoFASetupData((int)$uid);
            Response::json($res);
        } catch (\Exception $e) {
            Response::json(['error'=>$e->getMessage()], 400);
        }
    }
}
