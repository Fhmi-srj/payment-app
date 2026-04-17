<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Change lembaga enum
        DB::statement("ALTER TABLE santris MODIFY COLUMN lembaga ENUM('MA ALHIKAM', 'ITS', 'MTS', 'MA') NOT NULL");
        DB::statement("UPDATE santris SET lembaga = 'MA' WHERE lembaga = 'MA ALHIKAM'");
        DB::statement("UPDATE santris SET lembaga = 'MTS' WHERE lembaga = 'ITS'");
        DB::statement("ALTER TABLE santris MODIFY COLUMN lembaga ENUM('MTS', 'MA') NOT NULL");

        // 2. Add new columns after kartu_santri
        Schema::table('santris', function (Blueprint $table) {
            $table->string('nis')->nullable()->after('kartu_santri');
            $table->string('ttl')->nullable()->after('nis');
            $table->string('jenis_kelamin')->nullable()->after('ttl');
            $table->string('agama')->nullable()->after('jenis_kelamin');
            $table->string('no_hp')->nullable()->after('agama');
            $table->string('tahun_masuk')->nullable()->after('no_hp');
            $table->string('ayah')->nullable()->after('tahun_masuk');
            $table->string('ibu')->nullable()->after('ayah');
            $table->string('kerja_ayah')->nullable()->after('ibu');
            $table->string('kerja_ibu')->nullable()->after('kerja_ayah');
        });
    }

    public function down(): void
    {
        Schema::table('santris', function (Blueprint $table) {
            $table->dropColumn([
                'nis', 'ttl', 'jenis_kelamin', 'agama',
                'no_hp', 'tahun_masuk', 'ayah', 'ibu',
                'kerja_ayah', 'kerja_ibu',
            ]);
        });

        DB::statement("ALTER TABLE santris MODIFY COLUMN lembaga ENUM('MTS', 'MA', 'MA ALHIKAM', 'ITS') NOT NULL");
        DB::statement("UPDATE santris SET lembaga = 'MA ALHIKAM' WHERE lembaga = 'MA'");
        DB::statement("UPDATE santris SET lembaga = 'ITS' WHERE lembaga = 'MTS'");
        DB::statement("ALTER TABLE santris MODIFY COLUMN lembaga ENUM('MA ALHIKAM', 'ITS') NOT NULL");
    }
};
