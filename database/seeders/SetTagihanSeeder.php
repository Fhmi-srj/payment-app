<?php

namespace Database\Seeders;

use App\Models\Santri;
use Illuminate\Database\Seeder;

class SetTagihanSeeder extends Seeder
{
    public function run(): void
    {
        $santris = Santri::all();
        $yayasanOptions = ['Simbangkulon', 'Non-Simbangkulon'];

        $count = ['Simbangkulon' => 0, 'Non-Simbangkulon' => 0];

        foreach ($santris as $santri) {
            $yayasan = $yayasanOptions[array_rand($yayasanOptions)];
            $count[$yayasan]++;

            // Monthly rate based on yayasan
            $monthlyRate = $yayasan === 'Simbangkulon' ? 400000 : 460000;

            // Jul 2025 - Feb 2026 = 8 months unpaid
            $monthsUnpaid = 8;

            $santri->update([
                'yayasan'      => $yayasan,
                'daftar_ulang' => 1925000,   // Non An-Najah rate
                'syahriyah'    => $monthlyRate * $monthsUnpaid,
                'seragam'      => 75000,     // Seragam Batik
                'kartu_santri' => 15000,     // KTS
                'haflah'       => 0,
                'study_tour'   => 0,
                'sekolah'      => 0,
            ]);
        }

        $this->command->info("Tagihan set for {$santris->count()} santri");
        $this->command->info("Simbangkulon: {$count['Simbangkulon']} (syahriyah: " . number_format(400000 * 8) . ")");
        $this->command->info("Non-Simbangkulon: {$count['Non-Simbangkulon']} (syahriyah: " . number_format(460000 * 8) . ")");
    }
}
