<?php
namespace Core;
class Router {
    private array $routes = ['GET'=>[], 'POST'=>[], 'PUT'=>[], 'DELETE'=>[]];
    public function get(string $path, $handler) { $this->routes['GET'][$path] = $handler; }
    public function post(string $path, $handler) { $this->routes['POST'][$path] = $handler; }
    public function dispatch(string $method, string $uri): void {
        $path = parse_url($uri, PHP_URL_PATH);
        $handler = $this->routes[$method][$path] ?? null;
        if (!$handler) { http_response_code(404); header('Content-Type: application/json'); echo json_encode(['error'=>'Not Found','path'=>$path]); return; }
        if (is_array($handler)) { [$class, $methodName] = $handler; $instance = new $class; call_user_func([$instance, $methodName]); }
        else { $handler(); }
    }
}
