<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    protected $fillable = [
        'santri_id', 'user_id', 'tahun_ajaran_id', 'tanggal', 'total', 'metode',
    ];

    protected $casts = [
        'tanggal' => 'datetime',
        'total' => 'integer',
    ];

    public function santri()
    {
        return $this->belongsTo(Santri::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(TransaksiItem::class);
    }
}
