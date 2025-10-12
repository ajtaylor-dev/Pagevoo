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

        // Admin-only routes
        Route::middleware('admin')->group(function () {
            // User management
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::put('/users/{id}', [UserController::class, 'update']);
            Route::delete('/users/{id}', [UserController::class, 'destroy']);
            Route::post('/users/delete-inactive', [UserController::class, 'deleteInactiveUsers']);
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
                Route::post('/{id}/upload-image', [TemplateController::class, 'uploadImage']);
                Route::post('/{id}/gallery/upload', [TemplateController::class, 'uploadGalleryImage']);
                Route::post('/{id}/gallery/delete', [TemplateController::class, 'deleteGalleryImage']);
                Route::post('/{id}/gallery/rename', [TemplateController::class, 'renameGalleryImage']);
            });
        });

        // User Website management
        Route::prefix('user-website')->group(function () {
            Route::get('/', [UserWebsiteController::class, 'show']);
            Route::post('/initialize', [UserWebsiteController::class, 'initializeFromTemplate']);
            Route::put('/content', [UserWebsiteController::class, 'updateContent']);
            Route::post('/publish', [UserWebsiteController::class, 'publish']);
            Route::post('/unpublish', [UserWebsiteController::class, 'unpublish']);
        });
    });

    // Future API endpoints will go here

});
