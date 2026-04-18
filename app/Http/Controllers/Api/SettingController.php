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

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            foreach ($request->settings as $key => $data) {
                if (!in_array($key, $validKeys)) continue;

                $oldSetting = TagihanSetting::where('key', $key)->first();
                $isChanged = false;

                if ($key === 'haflah') {
                    $oldWisuda = $oldSetting ? $oldSetting->nominal_wisudawan : null;
                    $oldNonWisuda = $oldSetting ? $oldSetting->nominal_non_wisudawan : null;
                    $newWisuda = intval($data['nominal_wisudawan'] ?? 0);
                    $newNonWisuda = intval($data['nominal_non_wisudawan'] ?? 0);
                    if ($oldSetting && ($oldWisuda !== $newWisuda || $oldNonWisuda !== $newNonWisuda)) {
                        $isChanged = true;
                    }
                } else {
                    $oldNominal = $oldSetting ? $oldSetting->nominal : null;
                    $newNominal = intval($data['nominal'] ?? 0);
                    if ($oldSetting && $oldNominal !== $newNominal) {
                        $isChanged = true;
                    }
                }

                if ($isChanged) {
                    $prefix = $prefixMap[$key] ?? $key;
                    
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
