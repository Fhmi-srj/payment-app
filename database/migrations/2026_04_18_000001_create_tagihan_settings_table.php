<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tagihan_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // daftar_ulang, syahriyah, haflah, seragam, study_tour, kartu_santri
            $table->integer('nominal')->default(0);
            $table->integer('nominal_wisudawan')->nullable(); // for haflah kelas 3
            $table->integer('nominal_non_wisudawan')->nullable(); // for haflah kelas 1 & 2
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tagihan_settings');
    }
};
