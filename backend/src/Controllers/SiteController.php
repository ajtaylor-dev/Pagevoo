<?php
namespace Controllers;
use Core\Response;
use Models\Site;
use Services\SiteProvisioner;

class SiteController {
    public function createDemoForUser(): void {
        if (!isset($_SESSION['uid'])) { Response::json(['error'=>'Unauthorized'], 401); return; }
        $db = SiteProvisioner::createDemoDatabase((int)$_SESSION['uid']);
        $siteId = Site::create((int)$_SESSION['uid'], 'demo', 'active', $db);
        Response::json(['ok'=>true, 'siteId'=>$siteId, 'db'=>$db]);
    }
}
