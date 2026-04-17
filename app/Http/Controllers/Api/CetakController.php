<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use App\Models\Transaksi;
use Illuminate\Http\Request;

class CetakController extends Controller
{
    /**
     * Data for receipt (kwitansi) of a specific transaction
     */
    public function kwitansi(Transaksi $transaksi)
    {
        $transaksi->load(['santri', 'items', 'user']);

        return response()->json([
            'success' => true,
            'data' => [
                'transaksi' => $transaksi,
                'santri' => $transaksi->santri,
                'items' => $transaksi->items,
                'petugas' => $transaksi->user->name ?? '-',
            ],
        ]);
    }

    /**
     * Surat Keterangan Lunas for a santri
     */
    public function suratLunas(Santri $santri)
    {
        $moneyFields = ['daftar_ulang', 'syahriyah', 'haflah', 'seragam', 'study_tour', 'sekolah', 'kartu_santri'];
        $totalSisa = 0;
        foreach ($moneyFields as $f) {
            $totalSisa += $santri->$f;
        }

        $isLunas = $totalSisa <= 0;

        // Get all transaction history
        $riwayat = $santri->transaksis()
            ->with('items')
            ->orderBy('tanggal', 'asc')
            ->get();

        $totalDibayar = $riwayat->sum('total');

        return response()->json([
            'success' => true,
            'data' => [
                'santri' => $santri,
                'is_lunas' => $isLunas,
                'total_sisa' => $totalSisa,
                'total_dibayar' => $totalDibayar,
                'riwayat' => $riwayat,
            ],
        ]);
    }

    /**
     * Kartu pembayaran santri (all payment types with status)
     */
    public function kartuPembayaran(Santri $santri)
    {
        $moneyFields = [
            'daftar_ulang' => 'Daftar Ulang',
            'syahriyah' => 'Syahriyah',
            'haflah' => 'Haflah',
            'seragam' => 'Seragam',
            'study_tour' => 'Study Tour',
            'sekolah' => 'Sekolah',
            'kartu_santri' => 'Kartu Santri',
        ];

        $items = [];
        foreach ($moneyFields as $field => $label) {
            $items[] = [
                'jenis' => $label,
                'sisa' => $santri->$field,
                'lunas' => $santri->$field <= 0,
            ];
        }

        // Get all transactions with items
        $riwayat = $santri->transaksis()
            ->with('items')
            ->orderBy('tanggal', 'desc')
            ->get()
            ->map(function ($t) {
                return [
                    'tanggal' => $t->tanggal,
                    'total' => $t->total,
                    'metode' => $t->metode,
                    'items' => $t->items->map(fn($i) => ['nama' => $i->nama, 'nominal' => $i->nominal]),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'santri' => $santri,
                'items' => $items,
                'riwayat' => $riwayat,
            ],
        ]);
    }
}
