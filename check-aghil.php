<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$santri = App\Models\Santri::where('nama', 'LIKE', '%AGHIL AMARUL FATIH%')->first();
if (!$santri) { 
    echo 'Santri tidak ditemukan'; 
    exit; 
}

echo "ID: " . $santri->id . "\n";
echo "Syahriyah Debt: " . $santri->syahriyah . "\n";

$transaksis = App\Models\Transaksi::with('items')->where('santri_id', $santri->id)->get();
foreach ($transaksis as $t) {
    echo "Transaksi ID: " . $t->id . " - total: " . $t->total . "\n";
    foreach ($t->items as $i) {
        echo "  - Item: " . $i->nama . " - Nominal: " . $i->nominal . " - Bulan: " . $i->bulan . "\n";
    }
}
