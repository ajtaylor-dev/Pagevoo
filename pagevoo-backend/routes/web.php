<?php

use Illuminate\Support\Facades\Route;

// ========== STATIC HTML MARKETING PAGES ==========
// These pages serve Blade templates for SEO

Route::get('/', function () {
    return view('pages.home');
});

Route::get('/solutions', function () {
    return view('pages.solutions');
});

Route::get('/whats-included', function () {
    return view('pages.whats-included');
});

Route::get('/pricing', function () {
    return view('pages.pricing');
});

Route::get('/support', function () {
    return view('pages.support');
});

// ========== REACT SPA ROUTES ==========
// These routes serve the React application

// Auth pages (React)
Route::get('/login', function () {
    return view('react-app');
});

Route::get('/register', function () {
    return view('react-app');
});

// Dashboard pages (React, protected)
Route::get('/dashboard', function () {
    return view('react-app');
});

Route::get('/my-dashboard', function () {
    return view('react-app');
});

// Builder pages (React, protected)
Route::get('/template-builder', function () {
    return view('react-app');
});

Route::get('/website-builder', function () {
    return view('react-app');
});

// Template preview route - serves physical HTML files
Route::get('/preview/{template_slug}/{page?}', function ($template_slug, $page = 'index') {
    $filePath = public_path("template_directory/{$template_slug}/{$page}.html");

    if (!file_exists($filePath)) {
        abort(404, 'Template preview not found. Please save your template first.');
    }

    return response()->file($filePath);
});
