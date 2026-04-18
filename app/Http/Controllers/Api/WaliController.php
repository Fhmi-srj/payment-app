<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WaliController extends Controller
{
    /**
     * Autocomplete santri names for typeahead (public)
     */
    public function autocomplete(Request $request)
    {
        $q = $request->get('q', '');
        if (strlen($q) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $santris = Santri::where('status', 'AKTIF')
            ->where('nama', 'like', '%' . $q . '%')
            ->select('id', 'nama', 'lembaga', 'kelas',
                DB::raw('(daftar_ulang + syahriyah + haflah + seragam + study_tour + sekolah + kartu_santri) as total_tagihan'))
            ->orderBy('nama')
            ->limit(10)
            ->get();

        return response()->json(['success' => true, 'data' => $santris]);
    }

    /**
     * Search santri by name for wali portal (public access with simple auth)
     */
    public function cekTagihan(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|min:3',
        ]);

        $santris = Santri::where('status', 'AKTIF')
            ->where('nama', 'like', '%' . $request->nama . '%')
            ->select('id', 'nama', 'lembaga', 'kelas',
                DB::raw('(daftar_ulang + syahriyah + haflah + seragam + study_tour + sekolah + kartu_santri) as total_tagihan'))
            ->orderBy('nama')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $santris,
        ]);
    }

    /**
     * Get detail tagihan for a specific santri
     */
    public function detailTagihan(Santri $santri)
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

        $breakdown = [];
        $totalTagihan = 0;
        foreach ($moneyFields as $field => $label) {
            $sisa = $santri->$field;
            $totalTagihan += $sisa;
            $breakdown[] = [
                'jenis' => $label,
                'sisa' => $sisa,
                'lunas' => $sisa <= 0,
            ];
        }

        // Get payment history
        $riwayat = $santri->transaksis()
            ->where('metode', '!=', 'Pemutihan')
            ->with('items:id,transaksi_id,nama,nominal,bulan')
            ->orderBy('tanggal', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'tanggal' => $t->tanggal,
                    'total' => $t->total,
                    'metode' => $t->metode,
                    'items' => $t->items->map(fn($i) => ['nama' => $i->nama, 'nominal' => $i->nominal]),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'santri' => $santri->only('id', 'nama', 'lembaga', 'kelas'),
                'breakdown' => $breakdown,
                'total_tagihan' => $totalTagihan,
                'riwayat' => $riwayat,
            ],
        ]);
    }
}
