<?php
namespace Models;
use Core\Database;

class Site {
    public static function create(array $data): int {
        $sql = "INSERT INTO sites (user_id, type, name, subdomain, template_id, db_name, db_user, db_pass, status, expires_at, archived_until)
                VALUES (:user_id, :type, :name, :subdomain, :template_id, :db_name, :db_user, :db_pass, :status, :expires_at, :archived_until)";
        Database::query($sql, [
            ':user_id' => $data['user_id'],
            ':type' => $data['type'] ?? 'demo',
            ':name' => $data['name'],
            ':subdomain' => $data['subdomain'] ?? null,
            ':template_id' => $data['template_id'] ?? null,
            ':db_name' => $data['db_name'],
            ':db_user' => $data['db_user'] ?? null,
            ':db_pass' => $data['db_pass'] ?? null,
            ':status' => $data['status'] ?? 'active',
            ':expires_at' => $data['expires_at'] ?? null,
            ':archived_until' => $data['archived_until'] ?? null,
        ]);
        return (int)Database::pdo()->lastInsertId();
    }

    public static function findByUser(int $userId): array {
        $stmt = Database::query("SELECT * FROM sites WHERE user_id = :uid ORDER BY created_at DESC", [':uid' => $userId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
