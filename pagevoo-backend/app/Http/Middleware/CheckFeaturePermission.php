<?php

namespace App\Http\Middleware;

use App\Services\PermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Check Feature Permission Middleware
 *
 * Protects routes based on user account tier permissions.
 *
 * Usage:
 * Route::post('/publish')->middleware('permission:publish_website');
 * Route::post('/export')->middleware('permission:export_section');
 */
class CheckFeaturePermission
{
    protected PermissionService $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $user = $request->user();

        // If no user (not authenticated), deny
        if (!$user) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'You must be logged in to access this feature.',
            ], 401);
        }

        // Check if user has permission for this feature
        if (!$this->permissionService->can($user, $feature)) {
            $requiredTier = $this->permissionService->getRequiredTierForFeature($feature);
            $currentTier = $this->permissionService->getAccountTier($user);

            return response()->json([
                'error' => 'Upgrade Required',
                'message' => "This feature requires a {$requiredTier} account or higher.",
                'feature' => $feature,
                'current_tier' => $currentTier,
                'required_tier' => $requiredTier,
                'upgrade_url' => '/pricing', // Frontend route to pricing page
            ], 403);
        }

        return $next($request);
    }
}
