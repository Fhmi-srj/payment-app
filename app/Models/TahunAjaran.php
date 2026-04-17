<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TahunAjaran extends Model
{
    protected $fillable = ['nama', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function santris()
    {
        return $this->hasMany(Santri::class);
    }

    public function transaksis()
    {
        return $this->hasMany(Transaksi::class);
    }
}
