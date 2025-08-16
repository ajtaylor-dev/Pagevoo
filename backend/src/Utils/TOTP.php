<?php
namespace Utils;
class TOTP {
    public static function verify(string $secret, string $code, int $timestep = 30, int $digits = 6): bool {
        $t = floor(time() / $timestep);
        for ($i = -1; $i <= 1; $i++) {
            if (self::totp($secret, $t + $i, $digits) === $code) return true;
        }
        return false;
    }
    public static function totp(string $secret, int $timeStep, int $digits = 6): string {
        $key = base64_decode($secret, true);
        if ($key === false) $key = $secret;
        $binTime = pack('N*', 0) . pack('N*', $timeStep);
        $hash = hash_hmac('sha1', $binTime, $key, true);
        $offset = ord($hash[19]) & 0xf;
        $truncatedHash = (ord($hash[$offset]) & 0x7f) << 24 |
                         (ord($hash[$offset + 1]) & 0xff) << 16 |
                         (ord($hash[$offset + 2]) & 0xff) << 8 |
                         (ord($hash[$offset + 3]) & 0xff);
        $code = $truncatedHash % (10 ** $digits);
        return str_pad((string)$code, $digits, '0', STR_PAD_LEFT);
    }
}
