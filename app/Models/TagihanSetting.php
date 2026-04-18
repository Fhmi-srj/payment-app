<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TagihanSetting extends Model
{
    protected $fillable = ['key', 'nominal', 'nominal_wisudawan', 'nominal_non_wisudawan', 'aktif'];

    protected $casts = [
        'nominal' => 'integer',
        'nominal_wisudawan' => 'integer',
        'nominal_non_wisudawan' => 'integer',
        'aktif' => 'boolean',
    ];

    /**
     * Get all settings as a key => data map
     */
    public static function getAllAsMap()
    {
        $settings = self::all();
        $map = [];
        foreach ($settings as $s) {
            $map[$s->key] = [
                'nominal' => $s->nominal,
                'nominal_wisudawan' => $s->nominal_wisudawan,
                'nominal_non_wisudawan' => $s->nominal_non_wisudawan,
                'aktif' => $s->aktif,
            ];
        }
        return $map;
    }
}
