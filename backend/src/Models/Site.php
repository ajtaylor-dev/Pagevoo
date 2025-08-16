<?php
namespace Models;
use Core\Database;

class Site {
    public static function create(int $userId, string $type, string $status, ?string $dbName = null): int {
        Database::query("INSERT INTO sites (user_id, type, status, db_name) VALUES (:u,:t,:s,:d)", [
            ':u'=>$userId, ':t'=>$type, ':s'=>$status, ':d'=>$dbName
        ]);
        return (int)Database::conn()->lastInsertId();
    }
}
