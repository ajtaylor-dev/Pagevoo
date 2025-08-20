<?php
namespace Services;

use Core\Database;

class SiteProvisioner
{
    /**
     * Create a dedicated MySQL database for the site and seed minimal tables.
     * Returns the database name.
     */
    public static function createPerSiteDatabase(int $userId): string
    {
        // e.g., pv_site_u12_9f3a7c
        $prefix = $_ENV['SITE_DB_PREFIX'] ?? 'pv_site_';
        $uniq = substr(bin2hex(random_bytes(3)), 0, 6);
        $dbName = sprintf('%su%d_%s', $prefix, $userId, $uniq);

        // Create DB (requires CREATE privilege on server)
        $pdo = Database::pdo();
        $pdo->exec("CREATE DATABASE `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Seed minimal schema (pages, media, logs)
        $schema = <<<SQL
CREATE TABLE `$dbName`.pages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content MEDIUMTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `$dbName`.media (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_path VARCHAR(255) NOT NULL,
  size INT UNSIGNED DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `$dbName`.logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  message TEXT,
  ip VARCHAR(45),
  user_agent VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL;
        foreach (array_filter(array_map('trim', explode(';', $schema))) as $stmt) {
            if ($stmt) $pdo->exec($stmt);
        }

        return $dbName;
    }
}
