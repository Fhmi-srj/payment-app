<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;

class TahunAjaranController extends Controller
{
    public function index()
    {
        $tahunAjarans = TahunAjaran::orderByDesc('is_active')->orderByDesc('nama')->get();
        return response()->json(['success' => true, 'data' => $tahunAjarans]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:20|unique:tahun_ajarans,nama',
        ]);

        $tahunAjaran = TahunAjaran::create([
            'nama' => $request->nama,
            'is_active' => TahunAjaran::count() === 0, // first one is active
        ]);

        return response()->json(['success' => true, 'message' => 'Tahun ajaran berhasil ditambahkan', 'data' => $tahunAjaran], 201);
    }

    public function update(Request $request, TahunAjaran $tahunAjaran)
    {
        $request->validate([
            'nama' => 'sometimes|string|max:20|unique:tahun_ajarans,nama,' . $tahunAjaran->id,
        ]);

        $tahunAjaran->update($request->only('nama'));

        return response()->json(['success' => true, 'message' => 'Tahun ajaran berhasil diupdate', 'data' => $tahunAjaran]);
    }

    public function destroy(TahunAjaran $tahunAjaran)
    {
        if ($tahunAjaran->is_active) {
            return response()->json(['success' => false, 'message' => 'Tidak dapat menghapus tahun ajaran yang sedang aktif'], 422);
        }

        $tahunAjaran->delete();
        return response()->json(['success' => true, 'message' => 'Tahun ajaran berhasil dihapus']);
    }

    public function setActive(TahunAjaran $tahunAjaran)
    {
        TahunAjaran::where('is_active', true)->update(['is_active' => false]);
        $tahunAjaran->update(['is_active' => true]);

        return response()->json(['success' => true, 'message' => "Tahun ajaran {$tahunAjaran->nama} diaktifkan", 'data' => $tahunAjaran]);
    }

    public function active()
    {
        $active = TahunAjaran::where('is_active', true)->first();
        return response()->json(['success' => true, 'data' => $active]);
    }
}
