<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Santri extends Model
{
    protected $fillable = [
        'tahun_ajaran_id',
        'lembaga', 'nama', 'kelas', 'alamat',
        'daftar_ulang', 'syahriyah', 'haflah', 'seragam',
        'study_tour', 'sekolah', 'kartu_santri',
        'nis', 'ttl', 'jenis_kelamin', 'agama',
        'no_hp', 'tahun_masuk', 'ayah', 'ibu',
        'kerja_ayah', 'kerja_ibu',
        'yayasan', 'status',
    ];

    protected $casts = [
        'daftar_ulang' => 'integer',
        'syahriyah' => 'integer',
        'haflah' => 'integer',
        'seragam' => 'integer',
        'study_tour' => 'integer',
        'sekolah' => 'integer',
        'kartu_santri' => 'integer',
    ];

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function transaksis()
    {
        return $this->hasMany(Transaksi::class);
    }
}

