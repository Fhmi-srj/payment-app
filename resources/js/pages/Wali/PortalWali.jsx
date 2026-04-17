import React, { useState, useRef, useEffect, useCallback } from 'react';

const API_BASE = '/api';
const formatIDR = (n) => 'Rp' + parseInt(n || 0).toLocaleString('id-ID');

function PortalWali() {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedSantri, setSelectedSantri] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const sugRef = useRef(null);
    const debounceRef = useRef(null);

    // Close suggestions on outside click
    useEffect(() => {
        const handler = (e) => { if (sugRef.current && !sugRef.current.contains(e.target)) setShowSuggestions(false); };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    // Debounced autocomplete search
    const handleInputChange = useCallback((val) => {
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/wali/autocomplete?q=${encodeURIComponent(val)}`);
                const json = await res.json();
                if (json.success) {
                    setSuggestions(json.data || []);
                    setShowSuggestions(true);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }, 300);
    }, []);

    const selectSantri = async (santri) => {
        setSelectedSantri(santri);
        setQuery(santri.nama);
        setShowSuggestions(false);
        setSuggestions([]);
        // Auto-fetch detail
        setDetailLoading(true);
        try {
            const res = await fetch(`${API_BASE}/wali/detail/${santri.id}`);
            const json = await res.json();
            if (json.success) setDetail(json.data);
        } catch (e) { console.error(e); }
        finally { setDetailLoading(false); }
    };

    const clearSelection = () => {
        setSelectedSantri(null);
        setDetail(null);
        setQuery('');
        setSuggestions([]);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-green-700 to-emerald-600 text-white shadow-lg">
                <div className="max-w-4xl mx-auto px-4 py-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <img src="/logo pondok.png" alt="Logo" className="w-10 h-10" />
                        <div>
                            <h1 className="text-xl font-bold tracking-wide">Nurul Huda Payment</h1>
                            <p className="text-green-200 text-xs">Portal Wali Santri · An-Najjah</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Search Card with Autocomplete */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i className="fas fa-search text-green-600 text-2xl"></i>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">Cek Tagihan Santri</h2>
                        <p className="text-sm text-gray-500 mt-1">Ketik nama santri untuk melihat status tagihan dan riwayat pembayaran</p>
                    </div>
                    <div className="max-w-lg mx-auto relative" ref={sugRef}>
                        <div className="relative">
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input type="text" value={query}
                                onChange={e => handleInputChange(e.target.value)}
                                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                placeholder="Ketik nama santri (min. 2 huruf)..."
                                className="w-full border border-gray-300 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                autoComplete="off" />
                            {query && (
                                <button type="button" onClick={clearSelection} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                            {loading && (
                                <span className="absolute right-10 top-1/2 -translate-y-1/2 text-green-500">
                                    <i className="fas fa-spinner fa-spin"></i>
                                </span>
                            )}
                        </div>

                        {/* Autocomplete Dropdown */}
                        {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl max-h-[280px] overflow-y-auto z-50 shadow-xl">
                                {suggestions.length === 0 ? (
                                    <div className="p-4 text-center text-gray-400">
                                        <i className="fas fa-user-times text-xl mb-1 block"></i>
                                        <p className="text-sm">Tidak ditemukan</p>
                                    </div>
                                ) : suggestions.map(s => {
                                    const lunas = s.total_tagihan <= 0;
                                    return (
                                        <div key={s.id} className="flex items-center justify-between p-3 cursor-pointer border-b border-gray-50 hover:bg-green-50 last:border-b-0 transition-colors"
                                            onClick={() => selectSantri(s)}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${lunas ? 'bg-green-100' : 'bg-red-100'}`}>
                                                    <i className={`fas ${lunas ? 'fa-check text-green-600' : 'fa-exclamation text-red-600'} text-xs`}></i>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-800">{s.nama}</div>
                                                    <div className="text-[11px] text-gray-400">{s.lembaga} · Kelas {s.kelas}</div>
                                                </div>
                                            </div>
                                            <div className={`text-xs font-bold ${lunas ? 'text-green-600' : 'text-red-600'}`}>
                                                {lunas ? 'LUNAS ✓' : formatIDR(s.total_tagihan)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail View */}
                {selectedSantri && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-4 bg-green-50 border-b flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-green-800">{selectedSantri.nama}</h3>
                                <p className="text-xs text-green-600">{selectedSantri.lembaga} · Kelas {selectedSantri.kelas}</p>
                            </div>
                            <button onClick={clearSelection} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="p-8 text-center text-gray-400"><i className="fas fa-spinner fa-spin mr-2"></i>Memuat detail...</div>
                        ) : detail && (
                            <div className="p-6">
                                {/* Breakdown */}
                                <h4 className="text-sm font-semibold text-gray-700 mb-3"><i className="fas fa-receipt mr-2 text-green-600"></i>Detail Tagihan</h4>
                                <div className="space-y-2 mb-6">
                                    {detail.breakdown.map((b, idx) => (
                                        <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${b.lunas ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                            <div className="flex items-center gap-2">
                                                <i className={`fas ${b.lunas ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'} text-sm`}></i>
                                                <span className="text-sm text-gray-700">{b.jenis}</span>
                                            </div>
                                            <span className={`text-sm font-semibold ${b.lunas ? 'text-green-600' : 'text-red-600'}`}>
                                                {b.lunas ? 'LUNAS' : formatIDR(b.sisa)}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between p-3 bg-gray-100 rounded-lg border-t-2 border-gray-300 mt-2">
                                        <span className="font-bold text-gray-800">TOTAL</span>
                                        <span className={`font-bold ${detail.total_tagihan > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {detail.total_tagihan > 0 ? formatIDR(detail.total_tagihan) : 'LUNAS ✓'}
                                        </span>
                                    </div>
                                </div>

                                {/* History */}
                                <h4 className="text-sm font-semibold text-gray-700 mb-3"><i className="fas fa-history mr-2 text-green-600"></i>Riwayat Pembayaran</h4>
                                {detail.riwayat.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic text-center py-4">Belum ada riwayat pembayaran</p>
                                ) : (
                                    <div className="space-y-2">
                                        {detail.riwayat.map((r, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <div className="text-xs font-medium text-gray-700">
                                                        {new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-0.5">{r.items.map(i => i.nama).join(', ')}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-semibold text-green-600">{formatIDR(r.total)}</div>
                                                    <div className="text-[10px] text-gray-400">{r.metode}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Info */}
                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>Hubungi Tata Usaha untuk informasi lebih lanjut</p>
                    <p className="mt-1">© 2025 Pondok Pesantren Nurul Huda An-Najjah</p>
                </div>
            </main>
        </div>
    );
}

export default PortalWali;
