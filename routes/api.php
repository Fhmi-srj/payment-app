<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SantriController;
use App\Http\Controllers\Api\KasirController;
use App\Http\Controllers\Api\RiwayatController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LaporanController;
use App\Http\Controllers\Api\TagihanController;

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CetakController;
use App\Http\Controllers\Api\WaliController;
use App\Http\Controllers\Api\TahunAjaranController;
use App\Http\Controllers\Api\ActivityLogController;

// Public Auth Routes
Route::post('auth/login', [AuthController::class, 'login']);

// Public Wali Portal Routes
Route::get('wali/autocomplete', [WaliController::class, 'autocomplete']);
Route::post('wali/cek-tagihan', [WaliController::class, 'cekTagihan']);
Route::get('wali/detail/{santri}', [WaliController::class, 'detailTagihan']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/change-password', [AuthController::class, 'changePassword']);

    // Dashboard
    Route::get('dashboard/stats', [DashboardController::class, 'stats']);

    // Tahun Ajaran
    Route::get('tahun-ajaran', [TahunAjaranController::class, 'index']);
    Route::get('tahun-ajaran/active', [TahunAjaranController::class, 'active']);
    Route::post('tahun-ajaran', [TahunAjaranController::class, 'store']);
    Route::put('tahun-ajaran/{tahunAjaran}', [TahunAjaranController::class, 'update']);
    Route::delete('tahun-ajaran/{tahunAjaran}', [TahunAjaranController::class, 'destroy']);
    Route::post('tahun-ajaran/{tahunAjaran}/set-active', [TahunAjaranController::class, 'setActive']);

    // Santri (Data Induk)
    Route::post('santri/bulk-tagihan', [SantriController::class, 'bulkUpdateTagihan']);
    Route::apiResource('santri', SantriController::class);
    Route::post('santri/import', [SantriController::class, 'import']);
    Route::get('santri-export', [SantriController::class, 'export']);
    Route::post('santri/bulk-delete', [SantriController::class, 'bulkDelete']);
    Route::post('santri/bulk-status', [SantriController::class, 'bulkUpdateStatus']);

    // Kasir
    Route::get('kasir/search', [KasirController::class, 'search']);
    Route::post('kasir/bayar', [KasirController::class, 'bayar']);

    // Riwayat
    Route::get('riwayat', [RiwayatController::class, 'index']);
    Route::get('riwayat/export', [RiwayatController::class, 'export']);
    Route::get('riwayat/{transaksi}', [RiwayatController::class, 'show']);
    Route::delete('riwayat/{transaksi}', [RiwayatController::class, 'destroy']);

    // Laporan
    Route::get('laporan', [LaporanController::class, 'index']);
    Route::get('laporan/export', [LaporanController::class, 'export']);

    // Tagihan
    Route::get('tagihan', [TagihanController::class, 'index']);
    Route::get('tagihan/summary', [TagihanController::class, 'summary']);
    Route::get('tagihan/report', [TagihanController::class, 'report']);
    Route::get('tagihan/{santri}', [TagihanController::class, 'show']);

    // Users
    Route::get('users', [UserController::class, 'index']);
    Route::post('users', [UserController::class, 'store']);
    Route::put('users/{user}', [UserController::class, 'update']);
    Route::delete('users/{user}', [UserController::class, 'destroy']);

    // Cetak Dokumen
    Route::get('cetak/kwitansi/{transaksi}', [CetakController::class, 'kwitansi']);
    Route::get('cetak/surat-lunas/{santri}', [CetakController::class, 'suratLunas']);
    Route::get('cetak/kartu/{santri}', [CetakController::class, 'kartuPembayaran']);

    // Audit Log
    Route::get('audit-log', [ActivityLogController::class, 'index']);
    Route::get('audit-log/actions', [ActivityLogController::class, 'actions']);
});
