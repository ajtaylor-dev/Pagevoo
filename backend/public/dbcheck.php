<?php
require __DIR__ . '/../src/bootstrap.php';
use Core\Database;
$me = Database::query("SELECT DATABASE() AS db")->fetch();
$row = Database::query("SELECT id,email,role,email_verified,LEFT(password,4) AS hp,LENGTH(password) AS hl FROM users WHERE email='admin@pagevoo.com'")->fetch();
header('Content-Type: application/json');
echo json_encode(['db'=>$me['db'] ?? null, 'admin'=>$row], JSON_PRETTY_PRINT);