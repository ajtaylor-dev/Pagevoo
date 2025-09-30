<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\JsonResponse;

/**
 * Health Check Controller
 *
 * Provides API health check endpoint
 */
class HealthController extends BaseController
{
    /**
     * Health check endpoint
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return $this->sendSuccess([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'service' => 'Pagevoo API',
        ], 'Pagevoo API is running');
    }
}
