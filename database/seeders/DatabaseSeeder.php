<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Santri;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create users
        User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Tata Usaha',
            'username' => 'tu',
            'password' => bcrypt('tu123'),
            'role' => 'tu',
        ]);

        // Create sample santri data
        $santris = [
            ['lembaga' => 'MA ALHIKAM', 'nama' => 'Ahmad Fauzi', 'kelas' => 'X-A', 'alamat' => 'Jl. Merdeka No. 1', 'daftar_ulang' => 500000, 'syahriyah' => 300000, 'haflah' => 200000, 'seragam' => 0, 'study_tour' => 150000, 'sekolah' => 0, 'kartu_santri' => 0, 'status' => 'AKTIF'],
            ['lembaga' => 'MA ALHIKAM', 'nama' => 'Siti Aisyah', 'kelas' => 'X-B', 'alamat' => 'Jl. Ahmad Yani No. 5', 'daftar_ulang' => 0, 'syahriyah' => 300000, 'haflah' => 0, 'seragam' => 250000, 'study_tour' => 0, 'sekolah' => 100000, 'kartu_santri' => 50000, 'status' => 'AKTIF'],
            ['lembaga' => 'MA ALHIKAM', 'nama' => 'Muhammad Rizki', 'kelas' => 'XI-A', 'alamat' => 'Jl. Sudirman No. 10', 'daftar_ulang' => 0, 'syahriyah' => 0, 'haflah' => 200000, 'seragam' => 0, 'study_tour' => 150000, 'sekolah' => 0, 'kartu_santri' => 0, 'status' => 'AKTIF'],
            ['lembaga' => 'ITS', 'nama' => 'Fatimah Zahra', 'kelas' => 'X-A', 'alamat' => 'Jl. Pahlawan No. 3', 'daftar_ulang' => 500000, 'syahriyah' => 250000, 'haflah' => 0, 'seragam' => 250000, 'study_tour' => 0, 'sekolah' => 100000, 'kartu_santri' => 50000, 'status' => 'AKTIF'],
            ['lembaga' => 'ITS', 'nama' => 'Abdullah Rahman', 'kelas' => 'XI-B', 'alamat' => 'Jl. Diponegoro No. 7', 'daftar_ulang' => 0, 'syahriyah' => 250000, 'haflah' => 200000, 'seragam' => 0, 'study_tour' => 150000, 'sekolah' => 0, 'kartu_santri' => 0, 'status' => 'AKTIF'],
            ['lembaga' => 'MA ALHIKAM', 'nama' => 'Nurul Hidayah', 'kelas' => 'XII-A', 'alamat' => 'Jl. Gatot Subroto No. 12', 'daftar_ulang' => 0, 'syahriyah' => 300000, 'haflah' => 0, 'seragam' => 0, 'study_tour' => 0, 'sekolah' => 0, 'kartu_santri' => 50000, 'status' => 'AKTIF'],
            ['lembaga' => 'ITS', 'nama' => 'Hasan Basri', 'kelas' => 'X-B', 'alamat' => 'Jl. Imam Bonjol No. 8', 'daftar_ulang' => 500000, 'syahriyah' => 0, 'haflah' => 0, 'seragam' => 250000, 'study_tour' => 150000, 'sekolah' => 100000, 'kartu_santri' => 0, 'status' => 'AKTIF'],
            ['lembaga' => 'MA ALHIKAM', 'nama' => 'Khadijah Amira', 'kelas' => 'XI-A', 'alamat' => 'Jl. Kartini No. 15', 'daftar_ulang' => 0, 'syahriyah' => 300000, 'haflah' => 200000, 'seragam' => 0, 'study_tour' => 0, 'sekolah' => 0, 'kartu_santri' => 0, 'status' => 'AKTIF'],
            ['lembaga' => 'ITS', 'nama' => 'Umar Faruq', 'kelas' => 'XII-A', 'alamat' => 'Jl. Veteran No. 20', 'daftar_ulang' => 0, 'syahriyah' => 0, 'haflah' => 0, 'seragam' => 0, 'study_tour' => 0, 'sekolah' => 0, 'kartu_santri' => 0, 'status' => 'TIDAK AKTIF'],
            ['lembaga' => 'MA ALHIKAM', 'nama' => 'Zainab Putri', 'kelas' => 'X-A', 'alamat' => 'Jl. RA Kartini No. 25', 'daftar_ulang' => 500000, 'syahriyah' => 300000, 'haflah' => 200000, 'seragam' => 250000, 'study_tour' => 150000, 'sekolah' => 100000, 'kartu_santri' => 50000, 'status' => 'AKTIF'],
        ];

        foreach ($santris as $santri) {
            Santri::create($santri);
        }
    }
}
