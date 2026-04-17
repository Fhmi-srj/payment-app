<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('santris', function (Blueprint $table) {
            $table->id();
            $table->enum('lembaga', ['MA ALHIKAM', 'ITS']);
            $table->string('nama');
            $table->string('kelas')->nullable();
            $table->string('alamat')->nullable();
            $table->integer('daftar_ulang')->default(0);
            $table->integer('syahriyah')->default(0);
            $table->integer('haflah')->default(0);
            $table->integer('seragam')->default(0);
            $table->integer('study_tour')->default(0);
            $table->integer('sekolah')->default(0);
            $table->integer('kartu_santri')->default(0);
            $table->enum('status', ['AKTIF', 'TIDAK AKTIF'])->default('AKTIF');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('santris');
    }
};
