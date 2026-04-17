<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class RiwayatController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaksi::with(['santri', 'items', 'user']);

        if ($request->filled('search')) {
            $query->whereHas('santri', function ($q) use ($request) {
                $q->where('nama', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('lembaga')) {
            $query->whereHas('santri', function ($q) use ($request) {
                $q->where('lembaga', $request->lembaga);
            });
        }

        if ($request->filled('dari_tanggal')) {
            $query->whereDate('tanggal', '>=', $request->dari_tanggal);
        }

        if ($request->filled('sampai_tanggal')) {
            $query->whereDate('tanggal', '<=', $request->sampai_tanggal);
        }

        $transaksis = $query->orderBy('tanggal', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $transaksis,
        ]);
    }

    public function show(Transaksi $transaksi)
    {
        $transaksi->load(['santri', 'items', 'user']);

        return response()->json([
            'success' => true,
            'data' => $transaksi,
        ]);
    }

    public function export(Request $request)
    {
        $query = Transaksi::with(['santri', 'items']);

        if ($request->filled('lembaga')) {
            $query->whereHas('santri', function ($q) use ($request) {
                $q->where('lembaga', $request->lembaga);
            });
        }

        if ($request->filled('dari_tanggal')) {
            $query->whereDate('tanggal', '>=', $request->dari_tanggal);
        }

        if ($request->filled('sampai_tanggal')) {
            $query->whereDate('tanggal', '<=', $request->sampai_tanggal);
        }

        $transaksis = $query->orderBy('tanggal', 'desc')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Header
        $headers = ['No', 'Tanggal', 'Nama Santri', 'Lembaga', 'Item Pembayaran', 'Total', 'Metode'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValue([$col + 1, 1], $header);
        }

        // Data
        foreach ($transaksis as $idx => $transaksi) {
            $row = $idx + 2;
            $itemNames = $transaksi->items->pluck('nama')->join(', ');
            $sheet->setCellValue([1, $row], $idx + 1);
            $sheet->setCellValue([2, $row], $transaksi->tanggal->format('d/m/Y H:i'));
            $sheet->setCellValue([3, $row], $transaksi->santri->nama ?? '-');
            $sheet->setCellValue([4, $row], $transaksi->santri->lembaga ?? '-');
            $sheet->setCellValue([5, $row], $itemNames);
            $sheet->setCellValue([6, $row], $transaksi->total);
            $sheet->setCellValue([7, $row], $transaksi->metode);
        }

        $filename = 'riwayat_transaksi_' . date('Y-m-d') . '.xlsx';
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function destroy(Transaksi $transaksi)
    {
        $fieldMap = [
            'Daftar Ulang' => 'daftar_ulang',
            'Syahriyah' => 'syahriyah',
            'Haflah' => 'haflah',
            'Seragam' => 'seragam',
            'Study Tour' => 'study_tour',
            'Sekolah' => 'sekolah',
            'Kartu Santri' => 'kartu_santri',
        ];

        // Reverse the payment: add back amounts to santri
        $santri = $transaksi->santri;
        if ($santri) {
            foreach ($transaksi->items as $item) {
                $itemName = $item->nama;
                if (isset($fieldMap[$itemName])) {
                    $santri->{$fieldMap[$itemName]} += $item->nominal;
                }
                // For monthly Syahriyah items like "Syahriyah - Januari"
                if (str_contains($itemName, 'Syahriyah -')) {
                    $santri->syahriyah += $item->nominal;
                }
            }
            $santri->save();
        }

        // Delete items then transaction
        $transaksi->items()->delete();
        $transaksi->delete();

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil dihapus',
        ]);
    }
}
