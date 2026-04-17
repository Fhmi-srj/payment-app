<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        $now = Carbon::now();

        // Santri counts
        $santriAktif = Santri::where('status', 'AKTIF')->count();
        $santriNonaktif = Santri::where('status', 'TIDAK AKTIF')->count();

        // Pemasukan
        $pemasukanHariIni = Transaksi::whereDate('tanggal', $now->toDateString())->sum('total');
        $pemasukanBulanIni = Transaksi::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->sum('total');
        $pemasukanTahunIni = Transaksi::whereYear('tanggal', $now->year)->sum('total');

        // Total tunggakan (sum of all remaining tagihan across active santri)
        $moneyFields = ['daftar_ulang', 'syahriyah', 'haflah', 'seragam', 'study_tour', 'sekolah', 'kartu_santri'];
        $tunggakanQuery = Santri::where('status', 'AKTIF');
        $totalTunggakan = 0;
        foreach ($moneyFields as $field) {
            $totalTunggakan += (clone $tunggakanQuery)->sum($field);
        }

        // Tunggakan breakdown by jenis (for pie chart)
        $tunggakanBreakdown = [];
        $moneyLabels = [
            'daftar_ulang' => 'Daftar Ulang',
            'syahriyah' => 'Syahriyah',
            'haflah' => 'Haflah',
            'seragam' => 'Seragam',
            'study_tour' => 'Study Tour',
            'sekolah' => 'Sekolah',
            'kartu_santri' => 'Kartu Santri',
        ];
        foreach ($moneyFields as $field) {
            $amount = Santri::where('status', 'AKTIF')->sum($field);
            if ($amount > 0) {
                $tunggakanBreakdown[] = [
                    'jenis' => $moneyLabels[$field],
                    'total' => (int) $amount,
                ];
            }
        }

        // Lunas vs Nunggak ratio
        $santriLunas = Santri::where('status', 'AKTIF')
            ->whereRaw('(daftar_ulang + syahriyah + haflah + seragam + study_tour + sekolah + kartu_santri) <= 0')
            ->count();
        $santriNunggak = $santriAktif - $santriLunas;

        // Pemasukan per lembaga
        $pemasukanPerLembaga = Transaksi::join('santris', 'transaksis.santri_id', '=', 'santris.id')
            ->whereMonth('transaksis.tanggal', $now->month)
            ->whereYear('transaksis.tanggal', $now->year)
            ->select('santris.lembaga', DB::raw('SUM(transaksis.total) as total'))
            ->groupBy('santris.lembaga')
            ->get()
            ->map(fn($row) => ['lembaga' => $row->lembaga, 'total' => (int) $row->total]);

        // Transaksi count bulan ini
        $transaksiCountBulanIni = Transaksi::whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->count();

        // Rata-rata per transaksi bulan ini
        $rataRataTransaksi = $transaksiCountBulanIni > 0 ? (int) ($pemasukanBulanIni / $transaksiCountBulanIni) : 0;

        // Chart: pemasukan 12 bulan terakhir
        $chartBulanan = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $amount = Transaksi::whereMonth('tanggal', $month->month)
                ->whereYear('tanggal', $month->year)
                ->sum('total');
            $chartBulanan[] = [
                'bulan' => $month->translatedFormat('M Y'),
                'bulan_short' => $month->translatedFormat('M'),
                'total' => (int) $amount,
            ];
        }

        // 5 transaksi terbaru
        $transaksiTerbaru = Transaksi::with(['santri:id,nama,lembaga', 'items:id,transaksi_id,nama,nominal'])
            ->orderBy('tanggal', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'tanggal' => $t->tanggal,
                    'santri_nama' => $t->santri->nama ?? '-',
                    'lembaga' => $t->santri->lembaga ?? '-',
                    'total' => $t->total,
                    'metode' => $t->metode,
                    'items' => $t->items->pluck('nama')->join(', '),
                ];
            });

        // 5 santri dengan tunggakan tertinggi
        $santriNunggakList = Santri::where('status', 'AKTIF')
            ->select('id', 'nama', 'lembaga', 'kelas',
                DB::raw('(daftar_ulang + syahriyah + haflah + seragam + study_tour + sekolah + kartu_santri) as total_tunggakan'))
            ->having('total_tunggakan', '>', 0)
            ->orderByDesc('total_tunggakan')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'santri_aktif' => $santriAktif,
                'santri_nonaktif' => $santriNonaktif,
                'santri_lunas' => $santriLunas,
                'santri_nunggak' => $santriNunggak,
                'pemasukan_hari_ini' => (int) $pemasukanHariIni,
                'pemasukan_bulan_ini' => (int) $pemasukanBulanIni,
                'pemasukan_tahun_ini' => (int) $pemasukanTahunIni,
                'total_tunggakan' => (int) $totalTunggakan,
                'tunggakan_breakdown' => $tunggakanBreakdown,
                'pemasukan_per_lembaga' => $pemasukanPerLembaga,
                'transaksi_count_bulan_ini' => $transaksiCountBulanIni,
                'rata_rata_transaksi' => $rataRataTransaksi,
                'chart_bulanan' => $chartBulanan,
                'transaksi_terbaru' => $transaksiTerbaru,
                'santri_nunggak_list' => $santriNunggakList,
            ],
        ]);
    }
}
