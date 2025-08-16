<?php
declare(strict_types=1);
require __DIR__ . '/../src/bootstrap.php';

use Core\Router;
use Controllers\AuthController;
use Controllers\AdminController;
use Controllers\SiteController;

$router = new Router();

$router->post('/api/auth/register', [AuthController::class, 'register']);
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->get('/api/auth/me', [AuthController::class, 'me']);
$router->post('/api/auth/logout', [AuthController::class, 'logout']);
$router->get('/api/auth/verify', [AuthController::class, 'verifyEmail']);

$router->post('/api/admin/users', [AdminController::class, 'createUser']);
$router->post('/api/sites/create-demo', [SiteController::class, 'createDemoForUser']);

$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
