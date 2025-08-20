<?php
declare(strict_types=1);
spl_autoload_register(function ($class) {
    $prefixes = [ 'Core\\' => __DIR__ . '/Core/', 'Controllers\\' => __DIR__ . '/Controllers/', 'Models\\' => __DIR__ . '/Models/', 'Services\\' => __DIR__ . '/Services/', 'Utils\\' => __DIR__ . '/Utils/', ];
    foreach ($prefixes as $prefix => $baseDir) {
        $len = strlen($prefix);
        if (strncmp($prefix, $class, $len) !== 0) continue;
        $relativeClass = substr($class, $len);
        $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
        if (file_exists($file)) require $file;
    }
});
require __DIR__ . '/../config/config.php';
session_set_cookie_params([ 'httponly' => true, 'secure' => ($_ENV['APP_ENV'] ?? 'development') === 'production', 'samesite' => 'Lax' ]);
session_start();
