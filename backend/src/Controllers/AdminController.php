<?php
namespace Controllers;
use Core\Response;

class AdminController {
    public function createUser(): void {
        Response::json(['ok'=>true, 'message'=>'Admin createUser stub']);
    }
}
