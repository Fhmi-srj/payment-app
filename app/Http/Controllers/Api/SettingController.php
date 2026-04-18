<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TagihanSetting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get all tagihan settings as a map
     */
    public function tagihanIndex()
    {
        $settings = TagihanSetting::getAllAsMap();

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Save/update tagihan settings
     */
    public function tagihanStore(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
        ]);

        $validKeys = ['daftar_ulang', 'syahriyah', 'haflah', 'seragam', 'study_tour', 'kartu_santri'];

        $prefixMap = [
            'daftar_ulang' => 'Daftar Ulang',
            'syahriyah' => 'Syahriyah',
            'haflah' => 'Haflah',
            'seragam' => 'Seragam',
            'study_tour' => 'Study Tour',
            'kartu_santri' => 'Kartu Santri',
        ];

        $updateMode = $request->update_mode ?? 'reset';

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            foreach ($request->settings as $key => $data) {
                if (!in_array($key, $validKeys)) continue;

                $oldSetting = TagihanSetting::where('key', $key)->first();
                $isChanged = false;
                
                $oldWisuda = 0; $oldNonWisuda = 0; $oldNominal = 0;

                if ($key === 'haflah') {
                    $oldWisuda = $oldSetting ? $oldSetting->nominal_wisudawan : 0;
                    $oldNonWisuda = $oldSetting ? $oldSetting->nominal_non_wisudawan : 0;
                    $newWisuda = intval($data['nominal_wisudawan'] ?? 0);
                    $newNonWisuda = intval($data['nominal_non_wisudawan'] ?? 0);
                    if ($oldSetting && ($oldWisuda !== $newWisuda || $oldNonWisuda !== $newNonWisuda)) {
                        $isChanged = true;
                    }
                } else {
                    $oldNominal = $oldSetting ? $oldSetting->nominal : 0;
                    $newNominal = intval($data['nominal'] ?? 0);
                    if ($oldSetting && $oldNominal !== $newNominal) {
                        $isChanged = true;
                    }
                }

                if ($isChanged) {
                    $prefix = $prefixMap[$key] ?? $key;
                    
                    if ($updateMode === 'reset') {
                        // Decrement total on parent transactions first
                        $itemsToDelete = \Illuminate\Support\Facades\DB::table('transaksi_items')->where('nama', 'LIKE', $prefix . '%')->get();
                        foreach ($itemsToDelete as $item) {
                            \Illuminate\Support\Facades\DB::table('transaksis')
                                ->where('id', $item->transaksi_id)
                                ->decrement('total', $item->nominal);
                        }
                        
                        // Delete the specific items
                        \Illuminate\Support\Facades\DB::table('transaksi_items')->where('nama', 'LIKE', $prefix . '%')->delete();
                        
                        // Delete any transactions that now have 0 or negative total
                        \Illuminate\Support\Facades\DB::table('transaksis')->where('total', '<=', 0)->delete();
                    } elseif ($updateMode === 'keep') {
                        // Penyesuaian/Pemutihan Sistem
                        if ($key === 'haflah') {
                            $diffWisuda = $newWisuda - $oldWisuda;
                            $diffNonWisuda = $newNonWisuda - $oldNonWisuda;
                            if ($diffWisuda > 0 || $diffNonWisuda > 0) {
                                $paidSantris = \Illuminate\Support\Facades\DB::table('transaksi_items')
                                    ->join('transaksis', 'transaksis.id', '=', 'transaksi_items.transaksi_id')
                                    ->join('santris', 'santris.id', '=', 'transaksis.santri_id')
                                    ->where('transaksi_items.nama', 'LIKE', $prefix . '%')
                                    ->select('transaksis.santri_id', 'santris.kelas', \Illuminate\Support\Facades\DB::raw('SUM(transaksi_items.nominal) as total_paid'))
                                    ->groupBy('transaksis.santri_id', 'santris.kelas')
                                    ->having('total_paid', '>', 0)
                                    ->get();

                                $pemutihanItems = [];
                                foreach ($paidSantris as $ps) {
                                    $diff = ($ps->kelas == '3') ? $diffWisuda : $diffNonWisuda;
                                    if ($diff > 0) {
                                        $transaksiId = \Illuminate\Support\Facades\DB::table('transaksis')->insertGetId([
                                            'santri_id' => $ps->santri_id,
                                            'user_id' => auth()->id() ?? 1,
                                            'tanggal' => now(),
                                            'total' => $diff,
                                            'metode' => 'Pemutihan',
                                            'created_at' => now(),
                                            'updated_at' => now(),
                                        ]);
                                        $pemutihanItems[] = [
                                            'transaksi_id' => $transaksiId,
                                            'nama' => "{$prefix} (Pemutihan)",
                                            'nominal' => $diff,
                                            'bulan' => null,
                                        ];
                                    }
                                }
                                if (count($pemutihanItems) > 0) {
                                    \Illuminate\Support\Facades\DB::table('transaksi_items')->insert($pemutihanItems);
                                }
                            }
                        } else {
                            $diff = $newNominal - $oldNominal;
                            if ($diff > 0) {
                                if ($key === 'syahriyah') {
                                    $paidMonths = \Illuminate\Support\Facades\DB::table('transaksi_items')
                                        ->join('transaksis', 'transaksis.id', '=', 'transaksi_items.transaksi_id')
                                        ->where('transaksi_items.nama', 'LIKE', $prefix . '%')
                                        ->whereNotNull('transaksi_items.bulan')
                                        ->select('transaksis.santri_id', 'transaksi_items.bulan', \Illuminate\Support\Facades\DB::raw('SUM(transaksi_items.nominal) as total_paid'))
                                        ->groupBy('transaksis.santri_id', 'transaksi_items.bulan')
                                        ->having('total_paid', '>', 0)
                                        ->get();

                                    $pemutihanItems = [];
                                    $bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                                    foreach ($paidMonths as $pm) {
                                        $transaksiId = \Illuminate\Support\Facades\DB::table('transaksis')->insertGetId([
                                            'santri_id' => $pm->santri_id,
                                            'user_id' => auth()->id() ?? 1,
                                            'tanggal' => now(),
                                            'total' => $diff,
                                            'metode' => 'Pemutihan',
                                            'created_at' => now(),
                                            'updated_at' => now(),
                                        ]);
                                        $bName = $bulanNames[$pm->bulan] ?? $pm->bulan;
                                        $pemutihanItems[] = [
                                            'transaksi_id' => $transaksiId,
                                            'nama' => "Syahriyah {$bName} (Pemutihan)",
                                            'nominal' => $diff,
                                            'bulan' => $pm->bulan,
                                        ];
                                    }
                                    if (count($pemutihanItems) > 0) {
                                        \Illuminate\Support\Facades\DB::table('transaksi_items')->insert($pemutihanItems);
                                    }
                                } else {
                                    $paidSantris = \Illuminate\Support\Facades\DB::table('transaksi_items')
                                        ->join('transaksis', 'transaksis.id', '=', 'transaksi_items.transaksi_id')
                                        ->where('transaksi_items.nama', 'LIKE', $prefix . '%')
                                        ->select('transaksis.santri_id', \Illuminate\Support\Facades\DB::raw('SUM(transaksi_items.nominal) as total_paid'))
                                        ->groupBy('transaksis.santri_id')
                                        ->having('total_paid', '>', 0)
                                        ->get();

                                    $pemutihanItems = [];
                                    foreach ($paidSantris as $ps) {
                                        $transaksiId = \Illuminate\Support\Facades\DB::table('transaksis')->insertGetId([
                                            'santri_id' => $ps->santri_id,
                                            'user_id' => auth()->id() ?? 1,
                                            'tanggal' => now(),
                                            'total' => $diff,
                                            'metode' => 'Pemutihan',
                                            'created_at' => now(),
                                            'updated_at' => now(),
                                        ]);
                                        $pemutihanItems[] = [
                                            'transaksi_id' => $transaksiId,
                                            'nama' => "{$prefix} (Pemutihan)",
                                            'nominal' => $diff,
                                            'bulan' => null,
                                        ];
                                    }
                                    if (count($pemutihanItems) > 0) {
                                        \Illuminate\Support\Facades\DB::table('transaksi_items')->insert($pemutihanItems);
                                    }
                                }
                            }
                        }
                    }
                }

                TagihanSetting::updateOrCreate(
                    ['key' => $key],
                    [
                        'nominal' => intval($data['nominal'] ?? 0),
                        'nominal_wisudawan' => isset($data['nominal_wisudawan']) ? intval($data['nominal_wisudawan']) : null,
                        'nominal_non_wisudawan' => isset($data['nominal_non_wisudawan']) ? intval($data['nominal_non_wisudawan']) : null,
                        'aktif' => filter_var($data['aktif'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    ]
                );
            }
            \Illuminate\Support\Facades\DB::commit();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal update: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan tagihan berhasil disimpan',
            'data' => TagihanSetting::getAllAsMap(),
        ]);
    }
}
