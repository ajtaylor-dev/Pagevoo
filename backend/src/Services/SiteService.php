<?php
namespace Services;

use Models\Site;

class SiteService
{
    public static function createDemoForUser(int $userId, ?int $templateId = null): int
    {
        $dbName = SiteProvisioner::createPerSiteDatabase($userId);

        $name = 'My Demo Site';
        $subdomain = null; // local dev may not use subdomains; keep null, or set like "demo-u{$userId}"
        $expiresAt = date('Y-m-d H:i:s', time() + 24 * 3600); // 24h
        // Archived-until left NULL here; will be set by the cleanup job when archiving.

        $siteId = Site::create([
            'user_id' => $userId,
            'type' => 'demo',
            'name' => $name,
            'subdomain' => $subdomain,
            'template_id' => $templateId,
            'db_name' => $dbName,
            'db_user' => null,
            'db_pass' => null,
            'status' => 'active',
            'expires_at' => $expiresAt,
            'archived_until' => null,
        ]);

        return $siteId;
    }
}
