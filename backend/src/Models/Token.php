<?php
namespace Models;
use Core\Database;

class Token {
    public static function createEmailVerification(int $userId, string $token, string $expiresAt): void {
        Database::query("INSERT INTO email_verifications (user_id, token, expires_at) VALUES (:u,:t,:x)", [
            ':u'=>$userId, ':t'=>$token, ':x'=>$expiresAt
        ]);
    }
    public static function findEmailVerification(string $token): ?array {
        $stmt = Database::query("SELECT * FROM email_verifications WHERE token = :t LIMIT 1", [':t'=>$token]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
    public static function consumeEmailVerification(int $id): void {
        Database::query("DELETE FROM email_verifications WHERE id=:id", [':id'=>$id]);
    }
}
