<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;

class SantriController extends Controller
{
    public function index(Request $request)
    {
        $query = Santri::query();

        if ($request->filled('search')) {
            $query->where('nama', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('lembaga')) {
            $query->where('lembaga', $request->lembaga);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('sort_by')) {
            $direction = $request->get('sort_dir', 'asc');
            $query->orderBy($request->sort_by, $direction);
        } else {
            $query->orderBy('nama', 'asc');
        }

        $santris = $query->get();

        return response()->json([
            'success' => true,
            'data' => $santris,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'lembaga' => 'required|in:MTS,MA',
            'nama' => 'required|string|max:255',
            'kelas' => 'nullable|string|max:50',
            'alamat' => 'nullable|string|max:255',
            'daftar_ulang' => 'nullable|integer|min:0',
            'syahriyah' => 'nullable|integer|min:0',
            'haflah' => 'nullable|integer|min:0',
            'seragam' => 'nullable|integer|min:0',
            'study_tour' => 'nullable|integer|min:0',
            'sekolah' => 'nullable|integer|min:0',
            'kartu_santri' => 'nullable|integer|min:0',
            'nis' => 'nullable|string|max:50',
            'ttl' => 'nullable|string|max:255',
            'jenis_kelamin' => 'nullable|string|max:20',
            'agama' => 'nullable|string|max:50',
            'no_hp' => 'nullable|string|max:30',
            'tahun_masuk' => 'nullable|string|max:20',
            'ayah' => 'nullable|string|max:255',
            'ibu' => 'nullable|string|max:255',
            'kerja_ayah' => 'nullable|string|max:255',
            'kerja_ibu' => 'nullable|string|max:255',
            'yayasan' => 'nullable|in:Simbangkulon,Non-Simbangkulon',
            'status' => 'nullable|in:AKTIF,TIDAK AKTIF',
        ]);

        $santri = Santri::create($request->all());

        ActivityLog::log('created', "Menambahkan santri: {$santri->nama}", $santri, null, $santri->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Santri berhasil ditambahkan',
            'data' => $santri,
        ], 201);
    }

    public function show(Santri $santri)
    {
        return response()->json([
            'success' => true,
            'data' => $santri,
        ]);
    }

    public function update(Request $request, Santri $santri)
    {
        $request->validate([
            'lembaga' => 'sometimes|in:MTS,MA',
            'nama' => 'sometimes|string|max:255',
            'kelas' => 'nullable|string|max:50',
            'alamat' => 'nullable|string|max:255',
            'daftar_ulang' => 'nullable|integer|min:0',
            'syahriyah' => 'nullable|integer|min:0',
            'haflah' => 'nullable|integer|min:0',
            'seragam' => 'nullable|integer|min:0',
            'study_tour' => 'nullable|integer|min:0',
            'sekolah' => 'nullable|integer|min:0',
            'kartu_santri' => 'nullable|integer|min:0',
            'nis' => 'nullable|string|max:50',
            'ttl' => 'nullable|string|max:255',
            'jenis_kelamin' => 'nullable|string|max:20',
            'agama' => 'nullable|string|max:50',
            'no_hp' => 'nullable|string|max:30',
            'tahun_masuk' => 'nullable|string|max:20',
            'ayah' => 'nullable|string|max:255',
            'ibu' => 'nullable|string|max:255',
            'kerja_ayah' => 'nullable|string|max:255',
            'kerja_ibu' => 'nullable|string|max:255',
            'yayasan' => 'nullable|in:Simbangkulon,Non-Simbangkulon',
            'status' => 'nullable|in:AKTIF,TIDAK AKTIF',
        ]);

        $oldValues = $santri->toArray();
        $santri->update($request->all());

        ActivityLog::log('updated', "Mengupdate santri: {$santri->nama}", $santri, $oldValues, $santri->fresh()->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Santri berhasil diupdate',
            'data' => $santri,
        ]);
    }

    public function destroy(Santri $santri)
    {
        ActivityLog::log('deleted', "Menghapus santri: {$santri->nama}", $santri, $santri->toArray());
        $santri->delete();

        return response()->json([
            'success' => true,
            'message' => 'Santri berhasil dihapus',
        ]);
    }

    public function bulkDelete(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer|exists:santris,id']);
        $count = Santri::whereIn('id', $request->ids)->count();
        Santri::whereIn('id', $request->ids)->delete();

        ActivityLog::log('deleted', "Menghapus {$count} santri secara bulk");

        return response()->json([
            'success' => true,
            'message' => "{$count} santri berhasil dihapus",
        ]);
    }

    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:santris,id',
            'status' => 'required|in:AKTIF,TIDAK AKTIF',
        ]);

        $count = Santri::whereIn('id', $request->ids)->update(['status' => $request->status]);

        ActivityLog::log('updated', "Mengubah status {$count} santri menjadi {$request->status} secara bulk");

        return response()->json([
            'success' => true,
            'message' => "{$count} santri berhasil diupdate",
        ]);
    }

    public function bulkUpdateTagihan(Request $request)
    {
        $request->validate([
            'settings' => 'required|array'
        ]);

        $updatedCount = 0;
        foreach ($request->settings as $key => $data) {
            $nominal = intval($data['nominal'] ?? 0);
            $aktif = filter_var($data['aktif'] ?? true, FILTER_VALIDATE_BOOLEAN);

            $validFields = ['daftar_ulang', 'syahriyah', 'haflah', 'seragam', 'study_tour', 'kartu_santri'];
            
            if ($key === 'haflah' && $aktif) {
                $nominalWisudawan = intval($data['nominal_wisudawan'] ?? 0);
                $nominalNonWisudawan = intval($data['nominal_non_wisudawan'] ?? 0);
                
                if ($nominalWisudawan >= 0) {
                    $count = Santri::where('kelas', '3')->where('haflah', '>', $nominalWisudawan)->update(['haflah' => $nominalWisudawan]);
                    $updatedCount += $count;
                }
                if ($nominalNonWisudawan >= 0) {
                    $count = Santri::whereIn('kelas', ['1', '2'])->where('haflah', '>', $nominalNonWisudawan)->update(['haflah' => $nominalNonWisudawan]);
                    $updatedCount += $count;
                }
            } else if (in_array($key, $validFields) && $aktif && $nominal >= 0) {
                // Update tagihan yang lebih besar dari nominal baru
                // "jika tagihan awal kurang dari nominal baru maka tidak berubah"
                $count = Santri::where($key, '>', $nominal)->update([$key => $nominal]);
                $updatedCount += $count;
            }
        }

        ActivityLog::log('updated', "Melakukan update massal penyesuaian nominal tagihan default");

        return response()->json([
            'success' => true,
            'message' => "Update massal berhasil disinkronisasi ke data santri",
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls',
        ]);

        $file = $request->file('file');
        $spreadsheet = IOFactory::load($file->getPathname());
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray();

        // Skip header row
        $imported = 0;
        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];
            if (empty($row[1])) continue; // Skip empty nama

            Santri::create([
                'lembaga'      => $row[0] ?? 'MTS',
                'nama'         => $row[1],
                'kelas'        => $row[2] ?? null,
                'alamat'       => $row[3] ?? null,
                'daftar_ulang' => intval($row[4] ?? 0),
                'syahriyah'    => intval($row[5] ?? 0),
                'haflah'       => intval($row[6] ?? 0),
                'seragam'      => intval($row[7] ?? 0),
                'study_tour'   => intval($row[8] ?? 0),
                'sekolah'      => intval($row[9] ?? 0),
                'kartu_santri' => intval($row[10] ?? 0),
                'nis'          => $row[11] ?? null,
                'ttl'          => $row[12] ?? null,
                'jenis_kelamin'=> $row[13] ?? null,
                'agama'        => $row[14] ?? null,
                'no_hp'        => $row[15] ?? null,
                'tahun_masuk'  => $row[16] ?? null,
                'ayah'         => $row[17] ?? null,
                'ibu'          => $row[18] ?? null,
                'kerja_ayah'   => $row[19] ?? null,
                'kerja_ibu'    => $row[20] ?? null,
                'status'       => $row[21] ?? 'AKTIF',
            ]);
            $imported++;
        }

        ActivityLog::log('imported', "Mengimport {$imported} data santri dari Excel");

        return response()->json([
            'success' => true,
            'message' => "$imported data santri berhasil diimport",
            'count'   => $imported,
        ]);
    }

    public function export(Request $request)
    {
        $query = Santri::query();

        if ($request->filled('search')) {
            $query->where('nama', 'like', '%' . $request->search . '%');
        }
        if ($request->filled('lembaga')) {
            $query->where('lembaga', $request->lembaga);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('kelas')) {
            $query->where('kelas', $request->kelas);
        }
        if ($request->filled('yayasan')) {
            $query->where('yayasan', $request->yayasan);
        }
        if ($request->filled('jenis_kelamin')) {
            $query->where('jenis_kelamin', $request->jenis_kelamin);
        }

        if ($request->filled('sort_by')) {
            $direction = $request->get('sort_dir', 'asc');
            $query->orderBy($request->sort_by, $direction);
        } else {
            $query->orderBy('nama', 'asc');
        }

        $santris = $query->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Header
        $headers = ['Lembaga', 'Nama', 'Kelas', 'Alamat', 'Daftar Ulang', 'Syahriyah', 'Haflah', 'Seragam', 'Study Tour', 'Sekolah', 'Kartu Santri', 'NIS', 'TTL', 'Jenis Kelamin', 'Agama', 'No HP', 'Tahun Masuk', 'Ayah', 'Ibu', 'Kerja Ayah', 'Kerja Ibu', 'Status'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValue([$col + 1, 1], $header);
        }

        // Data
        foreach ($santris as $idx => $santri) {
            $row = $idx + 2;
            $sheet->setCellValue([1, $row], $santri->lembaga);
            $sheet->setCellValue([2, $row], $santri->nama);
            $sheet->setCellValue([3, $row], $santri->kelas);
            $sheet->setCellValue([4, $row], $santri->alamat);
            $sheet->setCellValue([5, $row], $santri->daftar_ulang);
            $sheet->setCellValue([6, $row], $santri->syahriyah);
            $sheet->setCellValue([7, $row], $santri->haflah);
            $sheet->setCellValue([8, $row], $santri->seragam);
            $sheet->setCellValue([9, $row], $santri->study_tour);
            $sheet->setCellValue([10, $row], $santri->sekolah);
            $sheet->setCellValue([11, $row], $santri->kartu_santri);
            $sheet->setCellValue([12, $row], $santri->nis);
            $sheet->setCellValue([13, $row], $santri->ttl);
            $sheet->setCellValue([14, $row], $santri->jenis_kelamin);
            $sheet->setCellValue([15, $row], $santri->agama);
            $sheet->setCellValue([16, $row], $santri->no_hp);
            $sheet->setCellValue([17, $row], $santri->tahun_masuk);
            $sheet->setCellValue([18, $row], $santri->ayah);
            $sheet->setCellValue([19, $row], $santri->ibu);
            $sheet->setCellValue([20, $row], $santri->kerja_ayah);
            $sheet->setCellValue([21, $row], $santri->kerja_ibu);
            $sheet->setCellValue([22, $row], $santri->status);
        }

        ActivityLog::log('exported', "Mengexport {$santris->count()} data santri ke Excel");

        $filename = 'data_santri_' . date('Y-m-d') . '.xlsx';
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}

