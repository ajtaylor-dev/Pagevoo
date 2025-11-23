<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\CollaboratorController;
use App\Http\Controllers\Api\V1\GroupController;
use App\Http\Controllers\Api\V1\NoteController;
use App\Http\Controllers\Api\V1\TemplateController;
use App\Http\Controllers\Api\V1\UserWebsiteController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\SectionLibraryController;
use App\Http\Controllers\PageLibraryController;
use App\Http\Controllers\Api\V1\ScriptFeatures\ContactFormController;
use App\Http\Controllers\Api\V1\DatabaseController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// API V1 Routes
Route::prefix('v1')->group(function () {

    // Health check endpoint
    Route::get('/health', [HealthController::class, 'index']);

    // Authentication endpoints (public)
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        // User permissions and usage info
        Route::get('/me/permissions', function () {
            $user = auth()->user();
            return response()->json([
                'permissions' => $user->getAllPermissions(),
                'usage' => $user->getUsageInfo(),
                'tier' => $user->getAccountTier(),
                'available_template_tiers' => $user->getAvailableTemplateTiers(),
            ]);
        });

        // Admin-only routes
        Route::middleware('admin')->group(function () {
            // User management
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::put('/users/{id}', [UserController::class, 'update']);
            Route::delete('/users/{id}', [UserController::class, 'destroy']);
            Route::post('/users/delete-inactive', [UserController::class, 'deleteInactiveUsers']);
            Route::post('/users/reset-to-factory', [UserController::class, 'resetToFactory']);
        });

        // Collaborator management (Pro users only)
        Route::prefix('collaborators')->group(function () {
            Route::get('/', [CollaboratorController::class, 'index']);
            Route::post('/', [CollaboratorController::class, 'store']);
            Route::put('/{id}', [CollaboratorController::class, 'update']);
            Route::delete('/{id}', [CollaboratorController::class, 'destroy']);
        });

        // Group management (Pro users only)
        Route::prefix('groups')->group(function () {
            Route::get('/', [GroupController::class, 'index']);
            Route::post('/', [GroupController::class, 'store']);
            Route::put('/{id}', [GroupController::class, 'update']);
            Route::delete('/{id}', [GroupController::class, 'destroy']);
            Route::post('/{id}/add-users', [GroupController::class, 'addUsers']);
            Route::post('/{id}/remove-users', [GroupController::class, 'removeUsers']);
        });

        // Journal/Notes management (Niche and Pro users only)
        Route::prefix('notes')->group(function () {
            Route::get('/', [NoteController::class, 'index']);
            Route::post('/', [NoteController::class, 'store']);
            Route::put('/{id}', [NoteController::class, 'update']);
            Route::delete('/{id}', [NoteController::class, 'destroy']);
        });

        // Template management
        Route::prefix('templates')->group(function () {
            // Public routes (active templates only)
            Route::get('/', [TemplateController::class, 'index']);
            Route::get('/{id}', [TemplateController::class, 'show']);

            // Admin-only routes
            Route::middleware('admin')->group(function () {
                Route::get('/admin/all', [TemplateController::class, 'adminIndex']);
                Route::post('/', [TemplateController::class, 'store']);
                Route::put('/{id}', [TemplateController::class, 'update']);
                Route::delete('/{id}', [TemplateController::class, 'destroy']);
                Route::post('/purge-all', [TemplateController::class, 'purgeAll']);
                Route::post('/{id}/upload-image', [TemplateController::class, 'uploadImage']);
                Route::post('/{id}/gallery/upload', [TemplateController::class, 'uploadGalleryImage']);
                Route::post('/{id}/gallery/delete', [TemplateController::class, 'deleteGalleryImage']);
                Route::post('/{id}/gallery/rename', [TemplateController::class, 'renameGalleryImage']);
            });
        });

        // User Website management
        Route::prefix('user-website')->group(function () {
            // Basic website operations
            Route::get('/', [UserWebsiteController::class, 'index']); // List all user's websites
            Route::get('/{id}', [UserWebsiteController::class, 'show']); // Get specific website
            Route::post('/initialize', [UserWebsiteController::class, 'initializeFromTemplate']);
            Route::post('/create-blank', [UserWebsiteController::class, 'createBlank']);
            Route::delete('/{id}', [UserWebsiteController::class, 'destroy']);

            // Save & Publish workflow
            Route::post('/save', [UserWebsiteController::class, 'save']); // First save (no ID)
            Route::post('/{id}/save', [UserWebsiteController::class, 'save']); // Update save (with ID)
            Route::post('/{id}/publish', [UserWebsiteController::class, 'publish'])->middleware('permission:publish_website');
            Route::post('/{id}/unpublish', [UserWebsiteController::class, 'unpublish']);

            // URLs
            Route::get('/preview-url', [UserWebsiteController::class, 'getPreviewUrl']);
            Route::get('/published-url', [UserWebsiteController::class, 'getPublishedUrl']);

            // Domain configuration
            Route::post('/configure-subdomain', [UserWebsiteController::class, 'configureSubdomain']);
            Route::post('/configure-custom-domain', [UserWebsiteController::class, 'configureCustomDomain'])->middleware('permission:custom_domain');

            // Storage usage
            Route::get('/storage-usage', [UserWebsiteController::class, 'getStorageUsage']);
        });

        // Section Library management
        Route::apiResource('section-library', SectionLibraryController::class);

        // Page Library management
        Route::apiResource('page-library', PageLibraryController::class);

        // Settings management (Admin only)
        Route::middleware('admin')->prefix('settings')->group(function () {
            Route::get('/', [SettingController::class, 'index']);
            Route::get('/upload', [SettingController::class, 'getUploadSettings']);
            Route::put('/upload', [SettingController::class, 'updateUploadSettings']);
            Route::get('/{key}', [SettingController::class, 'show']);
            Route::put('/{key}', [SettingController::class, 'update']);
        });

        // Permissions management (Admin only)
        Route::middleware('admin')->prefix('permissions')->group(function () {
            Route::get('/', function () {
                // Get permissions from database
                $permissions = DB::table('tier_permissions')->get();
                $data = [];
                foreach ($permissions as $perm) {
                    $data[$perm->tier] = json_decode($perm->permissions, true);
                }
                return response()->json([
                    'success' => true,
                    'data' => $data,
                ]);
            });

            Route::put('/', function (Illuminate\Http\Request $request) {
                // Update permissions in database
                $validated = $request->validate([
                    'tier' => 'required|in:trial,brochure,niche,pro',
                    'permissions' => 'required|array',
                ]);

                DB::table('tier_permissions')
                    ->where('tier', $validated['tier'])
                    ->update([
                        'permissions' => json_encode($validated['permissions']),
                        'updated_at' => now(),
                    ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Permissions updated successfully',
                ]);
            });
        });
    });

    // Script Features Routes
    Route::middleware('auth:sanctum')->prefix('script-features')->group(function () {

        // Contact Form Feature
        Route::prefix('contact-forms')->group(function () {
            // Form configuration (admin only)
            Route::get('/', [ContactFormController::class, 'index']);
            Route::post('/', [ContactFormController::class, 'store']);
            Route::get('/{id}', [ContactFormController::class, 'show']);
            Route::put('/{id}', [ContactFormController::class, 'update']);
            Route::delete('/{id}', [ContactFormController::class, 'destroy']);

            // Submissions management
            Route::get('/{id}/submissions', [ContactFormController::class, 'getSubmissions']);
            Route::post('/{formId}/submissions/{submissionId}/read', [ContactFormController::class, 'markAsRead']);
            Route::post('/{formId}/submissions/{submissionId}/spam', [ContactFormController::class, 'markAsSpam']);
            Route::delete('/{formId}/submissions/{submissionId}', [ContactFormController::class, 'deleteSubmission']);
        });

    });

    // Database Management Routes
    Route::middleware('auth:sanctum')->prefix('database')->group(function () {
        // Get database instance
        Route::get('/instance', [DatabaseController::class, 'show']);

        // Create database
        Route::post('/template/create', [DatabaseController::class, 'createTemplateDatabase']);
        Route::post('/website/create', [DatabaseController::class, 'createWebsiteDatabase']);

        // Copy template database to website
        Route::post('/copy-template', [DatabaseController::class, 'copyTemplateDatabase']);

        // Delete database
        Route::delete('/{id}', [DatabaseController::class, 'destroy']);

        // Backup and restore
        Route::post('/{id}/backup', [DatabaseController::class, 'backup']);
        Route::post('/{id}/restore', [DatabaseController::class, 'restore']);

        // Feature management
        Route::get('/{id}/features', [DatabaseController::class, 'getInstalledFeatures']);
        Route::post('/{id}/features/install', [DatabaseController::class, 'installFeature']);
        Route::post('/{id}/features/uninstall', [DatabaseController::class, 'uninstallFeature']);

        // Update size
        Route::post('/{id}/update-size', [DatabaseController::class, 'updateSize']);
    });

    // Public form submission endpoint (no auth required)
    Route::post('/v1/contact-forms/{id}/submit', [ContactFormController::class, 'submit']);

});
