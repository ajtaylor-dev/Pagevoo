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
        if ($key === false) {
            $b32 = self::base32Decode($secret);
            $key = $b32 !== null ? $b32 : $secret;
        }
        $binTime = pack('N*', 0) . pack('N*', $timeStep);
        $hash = hash_hmac('sha1', $binTime, $key, true);
        $offset = ord($hash[19]) & 0xf;
        $truncatedHash  = (ord($hash[$offset]) & 0x7f) << 24;
        $truncatedHash |= (ord($hash[$offset + 1]) & 0xff) << 16;
        $truncatedHash |= (ord($hash[$offset + 2]) & 0xff) << 8;
        $truncatedHash |= (ord($hash[$offset + 3]) & 0xff);
        $code = $truncatedHash % (10 ** $digits);
        return str_pad((string)$code, $digits, '0', STR_PAD_LEFT);
    }
    private static function base32Decode(string $b32): ?string {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $b32 = strtoupper($b32);
        $b32 = rtrim($b32, '=');
        $bits = '';
        for ($i = 0; $i < strlen($b32); $i++) {
            $val = strpos($alphabet, $b32[$i]);
            if ($val === false) return null;
            $bits .= str_pad(decbin($val), 5, '0', STR_PAD_LEFT);
        }
        $bytes = '';
        for ($i = 0; $i + 8 <= strlen($bits); $i += 8) {
            $bytes .= chr(bindec(substr($bits, $i, 8)));
        }
        return $bytes;
    }
}
