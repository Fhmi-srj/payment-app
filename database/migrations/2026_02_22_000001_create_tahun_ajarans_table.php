<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tahun_ajarans', function (Blueprint $table) {
            $table->id();
            $table->string('nama'); // e.g. "2024/2025"
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        // Add tahun_ajaran_id to santris
        Schema::table('santris', function (Blueprint $table) {
            $table->foreignId('tahun_ajaran_id')->nullable()->after('id')->constrained('tahun_ajarans')->nullOnDelete();
        });

        // Add tahun_ajaran_id to transaksis
        Schema::table('transaksis', function (Blueprint $table) {
            $table->foreignId('tahun_ajaran_id')->nullable()->after('id')->constrained('tahun_ajarans')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('transaksis', function (Blueprint $table) {
            $table->dropForeign(['tahun_ajaran_id']);
            $table->dropColumn('tahun_ajaran_id');
        });
        Schema::table('santris', function (Blueprint $table) {
            $table->dropForeign(['tahun_ajaran_id']);
            $table->dropColumn('tahun_ajaran_id');
        });
        Schema::dropIfExists('tahun_ajarans');
    }
};
