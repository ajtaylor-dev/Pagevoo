<?php
namespace Utils;
class Captcha {
    public static function verify(?string $token): bool {
        if (($_ENV['APP_ENV'] ?? 'development') !== 'production') {
            return !empty($token);
        }
        return false;
    }
}
