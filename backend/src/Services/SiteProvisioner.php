<?php
namespace Services;
use Core\Database;

class SiteProvisioner {
    public static function createDemoDatabase(int $userId): string {
        $dbName = 'site_' . $userId . '_' . bin2hex(random_bytes(3));
        $pdo = Database::conn();
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `$dbName`.pages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL UNIQUE,
                content MEDIUMTEXT,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `$dbName`.media (
                id INT AUTO_INCREMENT PRIMARY KEY,
                path VARCHAR(500) NOT NULL,
                mime VARCHAR(100) NOT NULL,
                size INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `$dbName`.logs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                actor VARCHAR(100) NOT NULL,
                action VARCHAR(255) NOT NULL,
                meta JSON NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ");
        return $dbName;
    }
}
