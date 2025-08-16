<?php
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        [$k, $v] = array_map('trim', explode('=', $line, 2));
        $_ENV[$k] = $v;
    }
}

$_ENV += [
    'APP_ENV' => 'development',
    'DB_HOST' => '127.0.0.1',
    'DB_NAME' => 'pagevoo_core',
    'DB_USER' => 'root',
    'DB_PASS' => '',
    'RECAPTCHA_SECRET' => '',
    'EMAIL_FROM' => 'no-reply@pagevoo.test'
];
