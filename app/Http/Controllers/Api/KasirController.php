<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KasirController extends Controller
{
    public function search(Request $request)
    {
        $query = Santri::where('status', 'AKTIF');

        if ($request->filled('q')) {
            $query->where('nama', 'like', '%' . $request->q . '%');
        }

        $santris = $query->orderBy('nama')->limit(20)->get();

        return response()->json([
            'success' => true,
            'data' => $santris,
        ]);
    }

    public function bayar(Request $request)
    {
        $request->validate([
            'santri_id' => 'required|exists:santris,id',
            'items' => 'required|array|min:1',
            'items.*.nama' => 'required|string',
            'items.*.nominal' => 'required|integer|min:1',
            'items.*.bulan' => 'nullable',
            'metode' => 'required|in:Cash,Transfer',
        ]);

        $santri = Santri::findOrFail($request->santri_id);

        DB::beginTransaction();
        try {
            $total = collect($request->items)->sum('nominal');

            // Create transaksi
            $transaksi = Transaksi::create([
                'santri_id' => $santri->id,
                'user_id' => $request->user()->id,
                'tanggal' => now(),
                'total' => $total,
                'metode' => $request->metode,
            ]);

            // Create items
            foreach ($request->items as $item) {
                $transaksi->items()->create([
                    'nama' => $item['nama'],
                    'nominal' => $item['nominal'],
                    'bulan' => $item['bulan'] ?? null,
                ]);

                // Reduce santri's tagihan based on item name
                $fieldMap = [
                    'Daftar Ulang' => 'daftar_ulang',
                    'Syahriyah' => 'syahriyah',
                    'Haflah' => 'haflah',
                    'Seragam' => 'seragam',
                    'Study Tour' => 'study_tour',
                    'Sekolah' => 'sekolah',
                    'Kartu Santri' => 'kartu_santri',
                ];

                // Check if this is a tagihan tambahan item
                $itemName = $item['nama'];
                if (isset($fieldMap[$itemName])) {
                    $field = $fieldMap[$itemName];
                    $santri->$field = max(0, $santri->$field - $item['nominal']);
                }

                // For bulanan (Syahriyah monthly), reduce from syahriyah
                if (str_contains($itemName, 'Syahriyah -')) {
                    $santri->syahriyah = max(0, $santri->syahriyah - $item['nominal']);
                }
            }

            $santri->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berhasil disimpan',
                'data' => $transaksi->load('items', 'santri'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses pembayaran: ' . $e->getMessage(),
            ], 500);
        }
    }
}
