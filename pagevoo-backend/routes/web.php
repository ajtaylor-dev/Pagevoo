<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Template preview route - serves physical HTML files
Route::get('/preview/{template_slug}/{page?}', function ($template_slug, $page = 'index') {
    $filePath = public_path("template_directory/{$template_slug}/{$page}.html");

    if (!file_exists($filePath)) {
        abort(404, 'Template preview not found. Please save your template first.');
    }

    return response()->file($filePath);
});
