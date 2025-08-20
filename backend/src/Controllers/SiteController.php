<?php
namespace Controllers;

use Core\Response;
use Models\Site;
use Services\SiteService;

class SiteController
{
    // POST /api/sites/create-demo
    public function createDemoForUser(): void {
        $uid = $_SESSION['uid'] ?? null;
        if (!$uid) { Response::json(['error'=>'Unauthorized'], 401); return; }

        // Avoid creating multiple active demos for the same user
        $existing = Site::findActiveDemoByUser((int)$uid);
        if ($existing) {
            Response::json([
                'ok' => true,
                'siteId' => (int)$existing['id'],
                'note' => 'Existing active demo reused'
            ]);
            return;
        }

        // Optional: allow client to pass a templateId
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $templateId = isset($input['templateId']) ? (int)$input['templateId'] : null;

        try {
            $siteId = SiteService::createDemoForUser((int)$uid, $templateId);
            Response::json(['ok'=>true, 'siteId'=>$siteId]);
        } catch (\Throwable $e) {
            Response::json(['error'=>'Failed to create demo: '.$e->getMessage()], 500);
        }
    }

    // GET /api/sites/mine
    public function mine(): void {
        $uid = $_SESSION['uid'] ?? null;
        if (!$uid) { Response::json(['error'=>'Unauthorized'], 401); return; }
        $sites = Site::findByUser((int)$uid);
        Response::json(['sites' => $sites]);
    }
}
