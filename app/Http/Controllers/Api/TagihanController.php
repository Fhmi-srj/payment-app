<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TagihanController extends Controller
{
    public function index(Request $request)
    {
        $moneyFields = ['daftar_ulang', 'syahriyah', 'haflah', 'seragam', 'study_tour', 'kartu_santri'];

        $query = Santri::where('status', 'AKTIF')
            ->select('*', DB::raw('(daftar_ulang + syahriyah + haflah + seragam + study_tour + kartu_santri) as total_tagihan'));

        // Filter lembaga
        if ($request->filled('lembaga')) {
            $query->where('lembaga', $request->lembaga);
        }

        // Filter kelas
        if ($request->filled('kelas')) {
            $query->where('kelas', $request->kelas);
        }

        // Filter status bayar
        if ($request->filled('status_bayar')) {
            if ($request->status_bayar === 'lunas') {
                foreach ($moneyFields as $f) {
                    $query->where($f, '<=', 0);
                }
            } elseif ($request->status_bayar === 'nunggak') {
                $query->where(function ($q) use ($moneyFields) {
                    foreach ($moneyFields as $f) {
                        $q->orWhere($f, '>', 0);
                    }
                });
            }
        }

        // Search
        if ($request->filled('search')) {
            $query->where('nama', 'like', '%' . $request->search . '%');
        }

        $santris = $query->orderByDesc('total_tagihan')->get();

        return response()->json([
            'success' => true,
            'data' => $santris,
        ]);
    }

    public function show(Santri $santri)
    {
        $moneyFields = [
            'daftar_ulang' => 'Daftar Ulang',
            'syahriyah' => 'Syahriyah',
            'haflah' => 'Haflah',
            'seragam' => 'Seragam',
            'study_tour' => 'Study Tour',
            'kartu_santri' => 'Kartu Santri',
        ];

        // Get nominal syahriyah per bulan from settings
        $syahriyahSetting = \App\Models\TagihanSetting::where('key', 'syahriyah')->first();
        $nominalPerBulan = $syahriyahSetting ? $syahriyahSetting->nominal : 400000;

        // Get paid months for this santri
        $paidMonths = DB::table('transaksi_items')
            ->join('transaksis', 'transaksis.id', '=', 'transaksi_items.transaksi_id')
            ->where('transaksis.santri_id', $santri->id)
            ->where('transaksi_items.nama', 'like', '%Syahriyah%')
            ->whereNotNull('transaksi_items.bulan')
            ->select('transaksi_items.bulan', DB::raw('SUM(transaksi_items.nominal) as total_paid'))
            ->groupBy('transaksi_items.bulan')
            ->get()
            ->keyBy('bulan');

        $bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        $breakdown = [];
        $totalTagihan = 0;
        foreach ($moneyFields as $field => $label) {
            $sisa = $santri->$field;
            $totalTagihan += $sisa;
            
            $item = [
                'jenis' => $label,
                'field' => $field,
                'sisa' => $sisa,
                'lunas' => $sisa <= 0,
            ];

            // Add monthly detail for syahriyah
            if ($field === 'syahriyah') {
                $bulanDetail = [];
                for ($m = 0; $m < 12; $m++) {
                    $paid = isset($paidMonths[$m]) ? (int) $paidMonths[$m]->total_paid : 0;
                    $sisaBulan = max(0, $nominalPerBulan - $paid);
                    $bulanDetail[] = [
                        'bulan' => $m,
                        'nama' => $bulanNames[$m],
                        'nominal' => $nominalPerBulan,
                        'paid' => $paid,
                        'sisa' => $sisaBulan,
                        'lunas' => $sisaBulan <= 0,
                    ];
                }
                $item['bulan_detail'] = $bulanDetail;
                $item['nominal_per_bulan'] = $nominalPerBulan;
            }

            $breakdown[] = $item;
        }

        // Get payment history for this santri
        $riwayat = $santri->transaksis()
            ->where('metode', '!=', 'Pemutihan')
            ->with('items')
            ->orderBy('tanggal', 'desc')
            ->limit(10)
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
                'santri' => $santri,
                'breakdown' => $breakdown,
                'total_tagihan' => $totalTagihan,
                'riwayat' => $riwayat,
            ],
        ]);
    }

    public function summary()
    {
        $moneyFields = ['daftar_ulang', 'syahriyah', 'haflah', 'seragam', 'study_tour', 'kartu_santri'];
        $aktif = Santri::where('status', 'AKTIF');

        $totalSantri = (clone $aktif)->count();
        $totalTunggakan = 0;
        foreach ($moneyFields as $f) {
            $totalTunggakan += (clone $aktif)->sum($f);
        }

        // Count nunggak
        $santriNunggak = (clone $aktif)->where(function ($q) use ($moneyFields) {
            foreach ($moneyFields as $f) {
                $q->orWhere($f, '>', 0);
            }
        })->count();

        $santriLunas = $totalSantri - $santriNunggak;

        // Breakdown per jenis
        $breakdownJenis = [];
        foreach ($moneyFields as $f) {
            $sisa = (clone $aktif)->where($f, '>', 0)->sum($f);
            $jumlah = (clone $aktif)->where($f, '>', 0)->count();
            if ($sisa > 0) {
                $breakdownJenis[] = [
                    'jenis' => str_replace('_', ' ', ucwords($f, '_')),
                    'field' => $f,
                    'total_sisa' => (int) $sisa,
                    'jumlah_santri' => $jumlah,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_santri' => $totalSantri,
                'santri_nunggak' => $santriNunggak,
                'santri_lunas' => $santriLunas,
                'total_tunggakan' => (int) $totalTunggakan,
                'breakdown_jenis' => $breakdownJenis,
            ],
        ]);
    }

    /**
     * Report: per-month syahriyah payment status for all filtered santri
     */
    public function report(Request $request)
    {
        $query = Santri::where('status', 'AKTIF');

        if ($request->filled('lembaga')) {
            $query->where('lembaga', $request->lembaga);
        }
        if ($request->filled('kelas')) {
            $query->where('kelas', $request->kelas);
        }
        if ($request->filled('status_bayar')) {
            $moneyFields = ['daftar_ulang', 'syahriyah', 'haflah', 'seragam', 'study_tour', 'kartu_santri'];
            if ($request->status_bayar === 'lunas') {
                foreach ($moneyFields as $f) {
                    $query->where($f, '<=', 0);
                }
            } elseif ($request->status_bayar === 'nunggak') {
                $query->where(function ($q) use ($moneyFields) {
                    foreach ($moneyFields as $f) {
                        $q->orWhere($f, '>', 0);
                    }
                });
            }
        }
        if ($request->filled('search')) {
            $query->where('nama', 'like', '%' . $request->search . '%');
        }

        $santris = $query->orderBy('nama')->get();

        // Get paid months from transaksi_items for these santris
        $santriIds = $santris->pluck('id');
        $paidMonths = DB::table('transaksi_items')
            ->join('transaksis', 'transaksis.id', '=', 'transaksi_items.transaksi_id')
            ->whereIn('transaksis.santri_id', $santriIds)
            ->where('transaksi_items.nama', 'like', '%Syahriyah%')
            ->whereNotNull('transaksi_items.bulan')
            ->select('transaksis.santri_id', 'transaksi_items.bulan', DB::raw('SUM(transaksi_items.nominal) as total_paid'))
            ->groupBy('transaksis.santri_id', 'transaksi_items.bulan')
            ->get();

        // Build a map: santri_id => [bulan => total_paid]
        $paidMap = [];
        foreach ($paidMonths as $pm) {
            $paidMap[$pm->santri_id][$pm->bulan] = (int) $pm->total_paid;
        }

        // Get nominal per bulan from settings database
        $syahriyahSetting = \App\Models\TagihanSetting::where('key', 'syahriyah')->first();
        $perBulan = $syahriyahSetting ? $syahriyahSetting->nominal : ($request->filled('nominal_syahriyah') ? (int) $request->nominal_syahriyah : 400000);

        $reportData = $santris->map(function ($s) use ($paidMap, $perBulan) {
            $months = [];
            $paid = $paidMap[$s->id] ?? [];
            for ($m = 0; $m < 12; $m++) {
                $paidAmount = $paid[$m] ?? 0;
                $sisa = max(0, $perBulan - $paidAmount);
                $months[$m] = [
                    'paid' => $paidAmount,
                    'sisa' => $sisa,
                ];
            }
            return [
                'id' => $s->id,
                'nama' => $s->nama,
                'lembaga' => $s->lembaga,
                'kelas' => $s->kelas,
                'months' => $months,
                'syahriyah_sisa' => $s->syahriyah,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $reportData,
        ]);
    }
}
