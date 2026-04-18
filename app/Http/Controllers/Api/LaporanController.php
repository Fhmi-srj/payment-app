<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Illuminate\Support\Facades\DB;

class LaporanController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaksi::with(['santri', 'items', 'user']);

        // Filter lembaga
        if ($request->filled('lembaga')) {
            $query->whereHas('santri', fn($q) => $q->where('lembaga', $request->lembaga));
        }

        // Filter kelas
        if ($request->filled('kelas')) {
            $query->whereHas('santri', fn($q) => $q->where('kelas', $request->kelas));
        }

        // Filter jenis tagihan
        if ($request->filled('jenis')) {
            $query->whereHas('items', fn($q) => $q->where('nama', 'like', '%' . $request->jenis . '%'));
        }

        // Filter date range
        if ($request->filled('dari_tanggal')) {
            $query->whereDate('tanggal', '>=', $request->dari_tanggal);
        }
        if ($request->filled('sampai_tanggal')) {
            $query->whereDate('tanggal', '<=', $request->sampai_tanggal);
        }

        // Hide Pemutihan transactions from reports
        $query->where('metode', '!=', 'Pemutihan');

        $transaksis = $query->orderBy('tanggal', 'desc')->get();

        // Group by period
        $periode = $request->get('periode', 'harian');
        $grouped = [];

        foreach ($transaksis as $t) {
            $key = match ($periode) {
                'bulanan' => $t->tanggal->format('Y-m'),
                'tahunan' => $t->tanggal->format('Y'),
                default => $t->tanggal->format('Y-m-d'),
            };

            if (!isset($grouped[$key])) {
                $grouped[$key] = ['periode' => $key, 'jumlah_transaksi' => 0, 'total' => 0, 'transaksis' => []];
            }
            $grouped[$key]['jumlah_transaksi']++;
            $grouped[$key]['total'] += $t->total;
            $grouped[$key]['transaksis'][] = [
                'id' => $t->id,
                'tanggal' => $t->tanggal,
                'santri' => $t->santri->nama ?? '-',
                'lembaga' => $t->santri->lembaga ?? '-',
                'kelas' => $t->santri->kelas ?? '-',
                'items' => $t->items->map(fn($i) => ['nama' => $i->nama, 'nominal' => $i->nominal]),
                'total' => $t->total,
                'metode' => $t->metode,
                'petugas' => $t->user->name ?? '-',
            ];
        }

        $totalPemasukan = $transaksis->sum('total');
        $jumlahTransaksi = $transaksis->count();

        // Breakdown per jenis tagihan
        $breakdownJenis = DB::table('transaksi_items')
            ->join('transaksis', 'transaksi_items.transaksi_id', '=', 'transaksis.id')
            ->when($request->filled('dari_tanggal'), fn($q) => $q->whereDate('transaksis.tanggal', '>=', $request->dari_tanggal))
            ->when($request->filled('sampai_tanggal'), fn($q) => $q->whereDate('transaksis.tanggal', '<=', $request->sampai_tanggal))
            ->where('transaksis.metode', '!=', 'Pemutihan')
            ->select('transaksi_items.nama', DB::raw('SUM(transaksi_items.nominal) as total'), DB::raw('COUNT(*) as jumlah'))
            ->groupBy('transaksi_items.nama')
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_pemasukan' => (int) $totalPemasukan,
                'jumlah_transaksi' => $jumlahTransaksi,
                'breakdown_jenis' => $breakdownJenis,
                'grouped' => array_values($grouped),
            ],
        ]);
    }

    public function export(Request $request)
    {
        $query = Transaksi::with(['santri', 'items', 'user']);

        if ($request->filled('lembaga')) {
            $query->whereHas('santri', fn($q) => $q->where('lembaga', $request->lembaga));
        }
        if ($request->filled('dari_tanggal')) {
            $query->whereDate('tanggal', '>=', $request->dari_tanggal);
        }
        if ($request->filled('sampai_tanggal')) {
            $query->whereDate('tanggal', '<=', $request->sampai_tanggal);
        }

        // Hide Pemutihan transactions from export
        $query->where('metode', '!=', 'Pemutihan');

        $transaksis = $query->orderBy('tanggal', 'desc')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Laporan Keuangan');

        // Header
        $headers = ['No', 'Tanggal', 'Nama Santri', 'Lembaga', 'Kelas', 'Jenis Pembayaran', 'Nominal', 'Metode', 'Petugas'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValue([$col + 1, 1], $header);
            $sheet->getStyle([$col + 1, 1])->getFont()->setBold(true);
        }

        $row = 2;
        $no = 1;
        foreach ($transaksis as $t) {
            foreach ($t->items as $item) {
                $sheet->setCellValue([1, $row], $no);
                $sheet->setCellValue([2, $row], $t->tanggal->format('d/m/Y H:i'));
                $sheet->setCellValue([3, $row], $t->santri->nama ?? '-');
                $sheet->setCellValue([4, $row], $t->santri->lembaga ?? '-');
                $sheet->setCellValue([5, $row], $t->santri->kelas ?? '-');
                $sheet->setCellValue([6, $row], $item->nama);
                $sheet->setCellValue([7, $row], $item->nominal);
                $sheet->setCellValue([8, $row], $t->metode);
                $sheet->setCellValue([9, $row], $t->user->name ?? '-');
                $row++;
                $no++;
            }
        }

        // Auto-width
        foreach (range(1, 9) as $col) {
            $sheet->getColumnDimensionByColumn($col)->setAutoSize(true);
        }

        $filename = 'laporan_keuangan_' . date('Y-m-d') . '.xlsx';
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
