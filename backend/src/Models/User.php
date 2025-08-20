<?php
namespace Models;
use Core\Database;
use PDO;
class User
{
    public static function create(string $name, string $email, string $passwordHash, string $secretQ, string $secretA): int
    {
        Database::query("INSERT INTO users (name, email, password, secret_question, secret_answer) VALUES (:n,:e,:p,:sq,:sa)", [':n' => $name, ':e' => $email, ':p' => $passwordHash, ':sq' => $secretQ, ':sa' => $secretA]);
        return (int) Database::conn()->lastInsertId();
    }
    public static function findByEmail(string $email): ?array
    {
        $stmt = Database::query("SELECT * FROM users WHERE email = :e LIMIT 1", [':e' => $email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }
    public static function findById(int $id): ?array
    {
        $stmt = Database::query("SELECT * FROM users WHERE id = :id", [':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }
    public static function setEmailVerified(int $id): void
    {
        Database::query("UPDATE users SET email_verified = 1 WHERE id=:id", [':id' => $id]);
    }
    public static function incrementLoginCount(int $id): void
    {
        Database::query("UPDATE users SET login_count = login_count + 1 WHERE id=:id", [':id' => $id]);
    }
    public static function setTotpSecret(int $id, string $secret): void {
    \Core\Database::query("UPDATE users SET totp_secret = :s WHERE id=:id", [':s' => $secret, ':id' => $id]);
}

}