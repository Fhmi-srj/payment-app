<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Santri;
use PhpOffice\PhpSpreadsheet\IOFactory;

class SantriExcelSeeder extends Seeder
{
    public function run(): void
    {
        $filePath = base_path('DATA SANTRI.xlsx');

        if (!file_exists($filePath)) {
            $this->command->error("File DATA SANTRI.xlsx tidak ditemukan di root project!");
            return;
        }

        // Disable FK checks and truncate
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('transaksi_items')->truncate();
        DB::table('transaksis')->truncate();
        DB::table('santris')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $spreadsheet = IOFactory::load($filePath);
        $imported = 0;

        for ($i = 0; $i < $spreadsheet->getSheetCount(); $i++) {
            $sheet = $spreadsheet->getSheet($i);
            $title = $sheet->getTitle(); // e.g. "1 MTS PA", "2 MA PI", "1 MA PI"

            // Parse sheet title: "{kelas} {level} {gender}"
            $parts = explode(' ', trim($title));
            $kelas = $parts[0]; // "1", "2", "3"
            $level = $parts[1] ?? ''; // "MTS" or "MA"
            $gender = $parts[2] ?? ''; // "PA" or "PI"

            $lembaga = $level; // "MTS" or "MA"
            $defaultGender = ($gender === 'PA') ? 'Laki-laki' : 'Perempuan';

            $highestRow = $sheet->getHighestRow();
            $highestCol = $sheet->getHighestColumn();

            // Read header row to determine column mapping
            $headers = [];
            $c = 'A';
            while (true) {
                $val = strtoupper(trim($sheet->getCell($c . '1')->getValue()));
                $headers[$c] = $val;
                if ($c == $highestCol) break;
                $c++;
            }

            // Determine column positions based on headers
            $colMap = $this->buildColumnMap($headers);

            for ($row = 2; $row <= $highestRow; $row++) {
                $namaCol = $colMap['nama'] ?? null;
                if (!$namaCol) continue;

                $nama = trim($sheet->getCell($namaCol . $row)->getValue());
                if (empty($nama)) continue;

                $data = [
                    'lembaga'      => $lembaga,
                    'nama'         => $nama,
                    'kelas'        => $kelas,
                    'alamat'       => $this->getCellValue($sheet, $row, $colMap, 'alamat'),
                    'daftar_ulang' => 0,
                    'syahriyah'    => 0,
                    'haflah'       => 0,
                    'seragam'      => 0,
                    'study_tour'   => 0,
                    'sekolah'      => 0,
                    'kartu_santri' => 0,
                    'nis'          => $this->getCellValue($sheet, $row, $colMap, 'nis'),
                    'ttl'          => $this->getCellValue($sheet, $row, $colMap, 'ttl'),
                    'jenis_kelamin'=> $this->getCellValue($sheet, $row, $colMap, 'jenis_kelamin') ?: $defaultGender,
                    'agama'        => $this->getCellValue($sheet, $row, $colMap, 'agama'),
                    'no_hp'        => $this->getCellValue($sheet, $row, $colMap, 'no_hp'),
                    'tahun_masuk'  => $this->getCellValue($sheet, $row, $colMap, 'tahun_masuk'),
                    'ayah'         => $this->getCellValue($sheet, $row, $colMap, 'ayah'),
                    'ibu'          => $this->getCellValue($sheet, $row, $colMap, 'ibu'),
                    'kerja_ayah'   => $this->getCellValue($sheet, $row, $colMap, 'kerja_ayah'),
                    'kerja_ibu'    => $this->getCellValue($sheet, $row, $colMap, 'kerja_ibu'),
                    'status'       => 'AKTIF',
                ];

                Santri::create($data);
                $imported++;
            }

            $this->command->info("Sheet '{$title}': imported " . ($highestRow - 1) . " rows (lembaga={$lembaga}, kelas={$kelas}, gender={$defaultGender})");
        }

        $this->command->info("Total imported: {$imported} santri");
    }

    /**
     * Build a mapping from our field names to Excel column letters based on headers.
     */
    private function buildColumnMap(array $headers): array
    {
        $map = [];
        $headerMapping = [
            'NAMA'            => 'nama',
            'NIS'             => 'nis',
            'TEMPAT TANGGAL LAHIR' => 'ttl',
            'TTL'             => 'ttl',
            'ALAMAT'          => 'alamat',
            'AYAH'            => 'ayah',
            'IBU'             => 'ibu',
            'JENIS KELAMIN'   => 'jenis_kelamin',
            'AGAMA'           => 'agama',
            'NO HP'           => 'no_hp',
            'TAHUN MASUK'     => 'tahun_masuk',
            'KERJA AYAH'      => 'kerja_ayah',
            'KERJA IBU'       => 'kerja_ibu',
        ];

        foreach ($headers as $col => $headerVal) {
            $normalized = trim($headerVal);
            if (isset($headerMapping[$normalized])) {
                $map[$headerMapping[$normalized]] = $col;
            }
        }

        return $map;
    }

    private function getCellValue($sheet, int $row, array $colMap, string $field): ?string
    {
        if (!isset($colMap[$field])) return null;
        $val = trim($sheet->getCell($colMap[$field] . $row)->getValue());
        return $val !== '' ? $val : null;
    }
}
