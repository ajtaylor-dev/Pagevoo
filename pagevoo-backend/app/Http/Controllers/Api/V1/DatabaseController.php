<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DatabaseInstance;
use App\Services\DatabaseManager;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Exception;

class DatabaseController extends Controller
{
    protected DatabaseManager $databaseManager;

    public function __construct(DatabaseManager $databaseManager)
    {
        $this->databaseManager = $databaseManager;
    }

    /**
     * Get database instance for current user or template.
     */
    public function show(Request $request): JsonResponse
    {
        $type = $request->input('type'); // 'template' or 'website'
        $referenceId = $request->input('reference_id');

        $instance = DatabaseInstance::where('type', $type)
            ->where('reference_id', $referenceId)
            ->first();

        if (!$instance) {
            return response()->json([
                'success' => false,
                'message' => 'Database instance not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $instance,
        ]);
    }

    /**
     * Create a new database for a template.
     */
    public function createTemplateDatabase(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'template_id' => 'required|integer|exists:templates,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $instance = $this->databaseManager->createTemplateDatabase($request->input('template_id'));

            return response()->json([
                'success' => true,
                'message' => 'Template database created successfully',
                'data' => $instance,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new database for a user website.
     */
    public function createWebsiteDatabase(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        try {
            $instance = $this->databaseManager->createWebsiteDatabase($userId);

            return response()->json([
                'success' => true,
                'message' => 'Website database created successfully',
                'data' => $instance,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Copy template database to user website when initializing from template.
     */
    public function copyTemplateDatabase(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'template_id' => 'required|integer|exists:templates,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = $request->user()->id;
        $templateId = $request->input('template_id');

        try {
            $instance = $this->databaseManager->copyTemplateDatabaseToWebsite($templateId, $userId);

            return response()->json([
                'success' => true,
                'message' => 'Template database copied successfully',
                'data' => $instance,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a database instance.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $instance = DatabaseInstance::findOrFail($id);

        // Check permissions
        if ($instance->isTemplateDatabase() && !$request->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Only admins can delete template databases',
            ], 403);
        }

        if ($instance->isWebsiteDatabase() && $instance->reference_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own database',
            ], 403);
        }

        try {
            $hardDelete = $request->input('hard_delete', false);
            $this->databaseManager->deleteDatabase($instance, $hardDelete);

            return response()->json([
                'success' => true,
                'message' => 'Database deleted successfully',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Backup a database.
     */
    public function backup(Request $request, int $id): JsonResponse
    {
        $instance = DatabaseInstance::findOrFail($id);

        // Check permissions
        if ($instance->isTemplateDatabase() && !$request->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Only admins can backup template databases',
            ], 403);
        }

        if ($instance->isWebsiteDatabase() && $instance->reference_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only backup your own database',
            ], 403);
        }

        try {
            $backupPath = $this->databaseManager->backupDatabase($instance);

            return response()->json([
                'success' => true,
                'message' => 'Database backed up successfully',
                'data' => [
                    'backup_path' => $backupPath,
                    'backup_time' => $instance->last_backup_at,
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Restore a database from backup.
     */
    public function restore(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'backup_path' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $instance = DatabaseInstance::findOrFail($id);

        // Check permissions
        if ($instance->isTemplateDatabase() && !$request->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Only admins can restore template databases',
            ], 403);
        }

        if ($instance->isWebsiteDatabase() && $instance->reference_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only restore your own database',
            ], 403);
        }

        try {
            $this->databaseManager->restoreDatabase($instance, $request->input('backup_path'));

            return response()->json([
                'success' => true,
                'message' => 'Database restored successfully',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get installed features for a database.
     */
    public function getInstalledFeatures(Request $request, int $id): JsonResponse
    {
        $instance = DatabaseInstance::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $instance->getInstalledFeatures(),
        ]);
    }

    /**
     * Install a feature on a database.
     */
    public function installFeature(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'feature_type' => 'required|string',
            'config' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $instance = DatabaseInstance::findOrFail($id);

        // Check permissions
        if ($instance->isTemplateDatabase() && !$request->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Only admins can install features on template databases',
            ], 403);
        }

        if ($instance->isWebsiteDatabase() && $instance->reference_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only install features on your own database',
            ], 403);
        }

        try {
            $this->databaseManager->installFeature(
                $instance,
                $request->input('feature_type'),
                $request->input('config', [])
            );

            return response()->json([
                'success' => true,
                'message' => 'Feature installed successfully',
                'data' => $instance->fresh(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Uninstall a feature from a database.
     */
    public function uninstallFeature(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'feature_type' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $instance = DatabaseInstance::findOrFail($id);

        // Check permissions
        if ($instance->isTemplateDatabase() && !$request->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Only admins can uninstall features from template databases',
            ], 403);
        }

        if ($instance->isWebsiteDatabase() && $instance->reference_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only uninstall features from your own database',
            ], 403);
        }

        try {
            $this->databaseManager->uninstallFeature(
                $instance,
                $request->input('feature_type')
            );

            return response()->json([
                'success' => true,
                'message' => 'Feature uninstalled successfully',
                'data' => $instance->fresh(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update database size.
     */
    public function updateSize(Request $request, int $id): JsonResponse
    {
        $instance = DatabaseInstance::findOrFail($id);

        try {
            $this->databaseManager->updateDatabaseSize($instance);

            return response()->json([
                'success' => true,
                'message' => 'Database size updated',
                'data' => [
                    'size_bytes' => $instance->fresh()->size_bytes,
                    'size_mb' => round($instance->fresh()->size_bytes / 1024 / 1024, 2),
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
