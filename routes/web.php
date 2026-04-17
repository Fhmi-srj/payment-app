<?php

use Illuminate\Support\Facades\Route;

// SPA catch-all route - serves React app for all routes
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
