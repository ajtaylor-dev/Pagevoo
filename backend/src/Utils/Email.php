<?php
namespace Utils;
class Email
{
    public static function send(string $to, string $subject, string $body): void
    {
        $logDir = __DIR__ . '/../../storage/logs';
        if (!is_dir($logDir))
            mkdir($logDir, 0777, true);
        $msg = "TO: $to\nSUBJECT: $subject\n\n$body\n\n---\n";
        file_put_contents($logDir . '/mail.log', $msg, FILE_APPEND);
    }
}
