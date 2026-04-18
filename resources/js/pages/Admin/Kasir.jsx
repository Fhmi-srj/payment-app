import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE, authFetch } from '../../config/api';
import Swal from 'sweetalert2';

const baseProducts = [
    { key: 'daftar_ulang', label: 'Daftar Ulang', icon: 'fas fa-file-signature' },
    { key: 'haflah', label: 'Haflah', icon: 'fas fa-graduation-cap' },
    { key: 'seragam', label: 'Seragam', icon: 'fas fa-tshirt' },
    { key: 'study_tour', label: 'Study Tour', icon: 'fas fa-bus' },
    { key: 'kartu_santri', label: 'Kartu Santri', icon: 'fas fa-id-card' },
];
const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const formatIDR = (num) => 'Rp' + parseInt(num || 0).toLocaleString('id-ID');
const parseIDR = (str) => parseInt(String(str).replace(/\D/g, '')) || 0;

function Kasir() {
    const [selectedSantri, setSelectedSantri] = useState(null);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeCards, setActiveCards] = useState({});
    const [cardValues, setCardValues] = useState({});
    const [receiptData, setReceiptData] = useState(null);
    
    // Load tagihan settings from API instead of localStorage
    const [tagihanSettings, setTagihanSettings] = useState({});
    const [settingsLoading, setSettingsLoading] = useState(true);
    
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await authFetch(`${API_BASE}/settings/tagihan`);
                const json = await res.json();
                if (json.success && json.data) {
                    setTagihanSettings(json.data);
                }
            } catch (e) { console.error('Failed to load tagihan settings:', e); }
            finally { setSettingsLoading(false); }
        };
        loadSettings();
    }, []);
    
    const showSyahriyah = !tagihanSettings['syahriyah'] || tagihanSettings['syahriyah'].aktif !== false;
    const [metode, setMetode] = useState('Cash');
    const [showShortcuts, setShowShortcuts] = useState(false);
    const sugRef = useRef(null);
    const searchInputRef = useRef(null);
    
    const activeProducts = baseProducts.filter(p => !tagihanSettings[p.key] || tagihanSettings[p.key].aktif !== false);

    useEffect(() => {
        const handler = (e) => { if (sugRef.current && !sugRef.current.contains(e.target)) setShowSuggestions(false); };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const onKey = (e) => {
            // Skip if inside input/textarea/select
            const tag = document.activeElement?.tagName;
            const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

            if ((e.ctrlKey && e.key === '/') || (!isInput && e.key === 'F1')) {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'Escape') {
                if (showShortcuts) setShowShortcuts(false);
                else { clearSelection(); searchInputRef.current?.blur(); }
            } else if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                submitTransaction();
            } else if (e.ctrlKey && e.key === 'm') {
                e.preventDefault();
                setMetode(prev => prev === 'Cash' ? 'Transfer' : 'Cash');
            } else if (!isInput && e.key === '?') {
                e.preventDefault();
                setShowShortcuts(prev => !prev);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [showShortcuts]);

    const searchSantri = async (q) => {
        setQuery(q);
        if (q.length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
        try {
            const res = await authFetch(`${API_BASE}/kasir/search?q=${encodeURIComponent(q)}`);
            const json = await res.json();
            setSuggestions(json.data || []);
            setShowSuggestions(true);
        } catch (e) { console.error(e); }
    };

    const selectSantri = async (s) => {
        setQuery(s.nama);
        setShowSuggestions(false);
        setActiveCards({});
        setCardValues({});
        // Fetch full detail with paid months
        try {
            const res = await authFetch(`${API_BASE}/kasir/detail/${s.id}`);
            const json = await res.json();
            if (json.success && json.data) {
                setSelectedSantri(json.data);
            } else {
                setSelectedSantri(s);
            }
        } catch (e) {
            console.error('Failed to load santri detail:', e);
            setSelectedSantri(s);
        }
    };

    const clearSelection = () => {
        setSelectedSantri(null);
        setQuery('');
        setSuggestions([]);
        setActiveCards({});
        setCardValues({});
    };

    const getTagihan = (key) => selectedSantri ? (selectedSantri[key] || 0) : 0;
    const isLunas = (key) => getTagihan(key) <= 0;

    const toggleCard = (cardKey) => {
        if (!selectedSantri) {
            Swal.fire({ title: 'Pilih Santri', text: 'Pilih nama santri terlebih dahulu sebelum memilih produk.', icon: 'warning', confirmButtonColor: '#16a34a', confirmButtonText: 'OK' });
            return;
        }
        setActiveCards(prev => {
            const next = { ...prev };
            if (next[cardKey]) {
                delete next[cardKey];
                setCardValues(v => { const nv = { ...v }; delete nv[cardKey]; return nv; });
            } else {
                next[cardKey] = true;
                // Auto-fill with tagihan amount for tambahan, or per-bulan for monthly
                const parts = cardKey.split('-');
                if (parts.length === 1) {
                    setCardValues(v => ({ ...v, [cardKey]: getTagihan(cardKey).toLocaleString('id-ID') }));
                } else {
                    const pk = parts[0];
                    const perBulan = (tagihanSettings[pk] && tagihanSettings[pk].nominal) ? Number(tagihanSettings[pk].nominal) : (pk === 'syahriyah' ? 400000 : 0);
                    setCardValues(v => ({ ...v, [cardKey]: perBulan.toLocaleString('id-ID') }));
                }
            }
            return next;
        });
    };

    const updateCardValue = (cardKey, val) => {
        const num = val.replace(/\D/g, '');
        setCardValues(prev => ({ ...prev, [cardKey]: num ? parseInt(num).toLocaleString('id-ID') : '' }));
        if (num && parseInt(num) > 0) setActiveCards(prev => ({ ...prev, [cardKey]: true }));
        else setActiveCards(prev => { const next = { ...prev }; delete next[cardKey]; return next; });
    };

    const getSummaryItems = () => {
        const items = [];
        Object.keys(activeCards).forEach(cardKey => {
            const nominal = parseIDR(cardValues[cardKey] || '0');
            if (nominal <= 0) return;
            const parts = cardKey.split('-');
            let label;
            if (parts.length === 1) {
                label = baseProducts.find(p => p.key === cardKey)?.label || cardKey;
            } else {
                label = `Syahriyah ${bulan[parseInt(parts[1])]}`;
            }
            items.push({ key: cardKey, label, nominal, produk: parts[0], bulan: parts.length > 1 ? parseInt(parts[1]) : null });
        });
        return items;
    };

    const summaryItems = getSummaryItems();
    const total = summaryItems.reduce((s, i) => s + i.nominal, 0);

    const submitTransaction = async () => {
        if (!selectedSantri) {
            Swal.fire({ title: 'Pilih Santri', text: 'Pilih nama santri terlebih dahulu.', icon: 'warning', confirmButtonColor: '#16a34a', confirmButtonText: 'OK' });
            return;
        }
        if (total <= 0) {
            Swal.fire({ title: 'Total Kosong', text: 'Total pembayaran harus lebih dari 0.', icon: 'warning', confirmButtonColor: '#16a34a', confirmButtonText: 'OK' });
            return;
        }
        try {
            const items = summaryItems.map(i => ({ nama: i.label, key: i.produk, nominal: i.nominal, bulan: i.bulan }));
            const res = await authFetch(`${API_BASE}/kasir/bayar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ santri_id: selectedSantri.id, items, metode, total })
            });
            const json = await res.json();
            if (json.success) {
                // Prepare receipt data
                const profil = JSON.parse(localStorage.getItem('profil_pondok') || '{}');
                const receipt = {
                    namaPondok: profil.nama_pondok || 'Pondok Pesantren Nurul Huda An-Najjah',
                    alamat: profil.alamat || '',
                    telepon: profil.telepon || '',
                    santriNama: selectedSantri.nama,
                    santriKelas: selectedSantri.kelas || '-',
                    santriLembaga: selectedSantri.lembaga || '-',
                    items: summaryItems.map(i => ({ label: i.label, nominal: i.nominal })),
                    total,
                    metode,
                    tanggal: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
                    waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    noTransaksi: json.data?.id ? `TRX-${String(json.data.id).padStart(6, '0')}` : '-',
                    kasir: json.data?.santri?.nama || 'Admin',
                };
                setReceiptData(receipt);

                // Auto print after short delay to let React render the receipt
                setTimeout(() => {
                    window.print();
                    
                    Swal.fire({
                        title: '<i class="fas fa-check-circle text-green-500"></i> Transaksi Berhasil!',
                        html: `<div class="text-left p-4 bg-gray-50 rounded-lg mt-3">
                            <div class="flex justify-between py-2 border-b"><span class="text-gray-600">Santri:</span><span class="font-semibold">${selectedSantri.nama}</span></div>
                            <div class="flex justify-between py-2 border-b"><span class="text-gray-600">Lembaga:</span><span class="font-semibold">${selectedSantri.lembaga}</span></div>
                            <div class="flex justify-between py-2 border-b"><span class="text-gray-600">Metode:</span><span class="font-semibold">${metode}</span></div>
                            <div class="flex justify-between py-2 text-lg"><span class="text-gray-600 font-semibold">Total:</span><span class="font-bold text-green-600">${formatIDR(total)}</span></div>
                        </div><p class="text-sm text-gray-500 mt-3"><i class="fas fa-sync-alt mr-1"></i> Data Induk & Riwayat telah diperbarui.</p>`,
                        icon: 'success', confirmButtonColor: '#16a34a', confirmButtonText: '<i class="fas fa-check mr-1"></i> Selesai'
                    });
                    clearSelection();
                }, 300);
            } else {
                Swal.fire({ title: 'Gagal', text: json.message || 'Transaksi gagal', icon: 'error' });
            }
        } catch (e) { Swal.fire({ title: 'Error', text: 'Terjadi kesalahan', icon: 'error' }); }
    };

    const renderProductCard = (key, label, icon, type) => {
        const noSantri = !selectedSantri;
        const lunas = !noSantri && isLunas(key);
        const tagihan = getTagihan(key);
        const cardKey = key;
        const active = activeCards[cardKey];
        const disabled = noSantri || lunas;

        return (
            <div key={key}
                className={`produk-card flex flex-col items-center border rounded-lg p-2 cursor-pointer transition-all text-center relative
                    ${disabled ? 'bg-gray-100 border-gray-300 opacity-60' : active ? 'bg-[#dcfce7] border-[#16a34a] shadow-[0_0_0_2px_rgba(22,163,74,0.3)]' : 'bg-white border-gray-200 hover:border-green-400 hover:bg-green-50'}`}
                onClick={() => noSantri ? toggleCard(cardKey) : !lunas && toggleCard(cardKey)}>
                {icon && <i className={`${icon} ${active ? 'text-[#16a34a]' : 'text-gray-400'} text-lg mb-1`}></i>}
                <span className="text-xs font-medium mb-1">{label}</span>
                <div className={`text-xs font-semibold tagihan-amount ${noSantri ? 'text-gray-400' : lunas ? 'text-green-600' : 'text-red-600'}`}>
                    {noSantri ? '-' : lunas ? 'LUNAS' : formatIDR(type === 'tambahan' ? tagihan : (key === 'syahriyah' ? (tagihanSettings[key]?.nominal ? Number(tagihanSettings[key].nominal) : 400000) : 0))}
                </div>
                <input type="text" inputMode="numeric"
                    className="w-full text-center rounded px-1 py-1 bg-gray-100 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 mt-1"
                    placeholder="Bayar" readOnly={!active}
                    value={cardValues[cardKey] || ''}
                    onClick={e => { e.stopPropagation(); if (noSantri) { Swal.fire({ title: 'Pilih Santri', text: 'Pilih nama santri terlebih dahulu.', icon: 'warning', confirmButtonColor: '#16a34a' }); } }}
                    onChange={e => updateCardValue(cardKey, e.target.value)}
                />
                {lunas && <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[15deg] bg-[#16a34a] text-white text-[0.6rem] font-bold px-2 py-0.5 rounded">LUNAS</span>}
            </div>
        );
    };

    const renderMonthCard = (produkKey, monthIdx) => {
        const noSantri = !selectedSantri;
        const perBulan = (tagihanSettings[produkKey] && tagihanSettings[produkKey].nominal) ? Number(tagihanSettings[produkKey].nominal) : (produkKey === 'syahriyah' ? 200000 : 0);
        
        // Check if this specific month is paid from API data
        const bulanData = selectedSantri?.syahriyah_bulan?.[monthIdx];
        const monthLunas = !noSantri && bulanData?.lunas === true;
        const monthSisa = bulanData ? bulanData.sisa : perBulan;
        
        const cardKey = `${produkKey}-${monthIdx}`;
        const active = activeCards[cardKey];
        const disabled = noSantri || monthLunas;

        return (
            <div key={cardKey}
                className={`produk-card month-card flex flex-col items-center border rounded-lg p-2 cursor-pointer transition-all text-center relative
                    ${disabled ? 'bg-gray-100 border-gray-300 opacity-60' : active ? 'bg-[#dcfce7] border-[#16a34a] shadow-[0_0_0_2px_rgba(22,163,74,0.3)]' : 'bg-white border-gray-200 hover:border-green-400 hover:bg-green-50'}`}
                onClick={() => noSantri ? toggleCard(cardKey) : !monthLunas && toggleCard(cardKey)}>
                <span className="text-xs font-medium mb-1">{bulan[monthIdx]}</span>
                <div className={`text-xs font-semibold ${noSantri ? 'text-gray-400' : monthLunas ? 'text-green-600' : 'text-red-600'}`}>
                    {noSantri ? '-' : monthLunas ? 'LUNAS' : formatIDR(monthSisa)}
                </div>
                <input type="text" inputMode="numeric"
                    className="w-full text-center rounded px-1 py-1 bg-gray-100 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 mt-1"
                    placeholder="Bayar" readOnly={!active}
                    value={cardValues[cardKey] || ''}
                    onClick={e => { e.stopPropagation(); if (noSantri) { Swal.fire({ title: 'Pilih Santri', text: 'Pilih nama santri terlebih dahulu.', icon: 'warning', confirmButtonColor: '#16a34a' }); } }}
                    onChange={e => updateCardValue(cardKey, e.target.value)}
                />
                {monthLunas && <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[15deg] bg-[#16a34a] text-white text-[0.6rem] font-bold px-2 py-0.5 rounded">LUNAS</span>}
            </div>
        );
    };

    return (
        <>

            {/* ROW 1: Data Santri */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 relative z-10">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]" ref={sugRef}>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Nama Santri</label>
                        <div className="relative">
                            <input type="text" value={query} onChange={e => searchSantri(e.target.value)} autoComplete="off"
                                ref={searchInputRef}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Ketik nama santri..." />
                            {query && (
                                <button type="button" onClick={clearSelection} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                            {showSuggestions && (
                                <div className="suggestions-list absolute top-full left-0 right-0 bg-white border border-[#d1d5db] rounded-lg max-h-[200px] overflow-y-auto z-50 shadow-lg">
                                    {suggestions.length === 0 ? (
                                        <div className="p-3 text-gray-500 text-center">Tidak ada hasil ditemukan</div>
                                    ) : suggestions.map(s => (
                                        <div key={s.id} className="suggestion-item p-2 px-3 cursor-pointer border-b border-gray-100 hover:bg-[#dcfce7] last:border-b-0" onClick={() => selectSantri(s)}>
                                            <div className="font-medium text-gray-800">{s.nama}</div>
                                            <div className="text-xs text-gray-500">{s.lembaga || '-'} - Kelas {s.kelas || '-'}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="w-28">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Kelas</label>
                        <input type="text" value={selectedSantri?.kelas || ''} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50" />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Alamat</label>
                        <input type="text" value={selectedSantri?.alamat || ''} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50" />
                    </div>
                    <div className="w-32">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Lembaga</label>
                        <input type="text" value={selectedSantri?.lembaga || ''} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50" />
                    </div>
                </div>
            </div>

            {/* ROW 2: Three Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* COLUMN 1: Tagihan Tambahan */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg shadow p-4 h-full">
                        <h2 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b">
                            <i className="fas fa-receipt mr-2 text-green-600"></i>Tagihan Tambahan
                        </h2>
                        {activeProducts.length === 0 ? (
                            <p className="text-xs text-gray-400 italic mt-4 text-center">Semua tagihan tambahan non-aktif.</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {activeProducts.map(p => renderProductCard(p.key, p.label, p.icon, 'tambahan'))}
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMN 2: Tagihan Bulanan */}
                <div className="lg:col-span-5">
                    <div className="bg-white rounded-lg shadow p-4 h-full">
                        <h2 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b">
                            <i className="fas fa-calendar-alt mr-2 text-green-600"></i>Tagihan Bulanan
                        </h2>
                        {(!showSyahriyah) ? (
                            <p className="text-xs text-gray-400 italic mt-4 text-center">Tagihan bulanan saat ini dinonaktifkan.</p>
                        ) : (
                            <>
                                {showSyahriyah && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {bulan.map((_, idx) => renderMonthCard('syahriyah', idx))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* COLUMN 3: Ringkasan Pembayaran */}
                <div className="lg:col-span-4">
                    <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200 h-full flex flex-col">
                        <h2 className="text-base font-semibold text-green-800 mb-3 pb-2 border-b border-green-200">
                            <i className="fas fa-calculator mr-2"></i>Ringkasan Pembayaran
                        </h2>
                        <ul className="text-sm text-gray-700 space-y-1 flex-grow overflow-y-auto mb-3" style={{ maxHeight: '200px' }}>
                            {summaryItems.length === 0 ? (
                                <li className="text-gray-400 italic">Pilih produk untuk melihat ringkasan</li>
                            ) : summaryItems.map(i => (
                                <li key={i.key} className="flex justify-between bg-green-100 rounded px-2 py-1">
                                    <span className="truncate mr-2">{i.label}</span>
                                    <span className="font-medium whitespace-nowrap">{formatIDR(i.nominal)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="border-t border-green-200 pt-3 space-y-3">
                            <div className="flex justify-between text-xl font-bold text-green-800">
                                <span>Total</span>
                                <span>{formatIDR(total)}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span>Metode Pembayaran</span>
                                <select value={metode} onChange={e => setMetode(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                                    <option value="Cash">Cash</option>
                                    <option value="Transfer">Transfer</option>
                                </select>
                            </div>
                            <button type="button" onClick={submitTransaction}
                                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                                <i className="fas fa-check-circle mr-2"></i>Selesaikan Transaksi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <button onClick={() => setShowShortcuts(!showShortcuts)} className="fixed bottom-4 right-4 w-8 h-8 bg-gray-800 text-white rounded-full text-xs font-bold shadow-lg hover:bg-gray-700 z-40" title="Keyboard Shortcuts (?)">?</button>
            {showShortcuts && (
                <div className="fixed bottom-14 right-4 bg-gray-800 text-white text-xs rounded-xl shadow-2xl p-4 z-50 w-56">
                    <div className="font-semibold mb-2 text-sm">Keyboard Shortcuts</div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between"><span>Cari santri</span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">Ctrl /</kbd></div>
                        <div className="flex justify-between"><span>Reset</span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">Esc</kbd></div>
                        <div className="flex justify-between"><span>Bayar</span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">Ctrl ↵</kbd></div>
                        <div className="flex justify-between"><span>Toggle metode</span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">Ctrl M</kbd></div>
                        <div className="flex justify-between"><span>Show / hide</span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">?</kbd></div>
                    </div>
                </div>
            )}

            {/* Hidden Thermal Receipt - only visible during print */}
            {receiptData && createPortal(
                <div id="thermal-receipt" className="thermal-receipt">
                    <div className="receipt-header">
                        <div className="receipt-title">{receiptData.namaPondok}</div>
                        {receiptData.alamat && <div className="receipt-subtitle">{receiptData.alamat}</div>}
                        {receiptData.telepon && <div className="receipt-subtitle">Telp: {receiptData.telepon}</div>}
                    </div>
                    <div className="receipt-divider">================================</div>
                    <div className="receipt-info">
                        <div className="receipt-row"><span>No</span><span>{receiptData.noTransaksi}</span></div>
                        <div className="receipt-row"><span>Tgl</span><span>{receiptData.tanggal}</span></div>
                        <div className="receipt-row"><span>Jam</span><span>{receiptData.waktu}</span></div>
                    </div>
                    <div className="receipt-divider">--------------------------------</div>
                    <div className="receipt-info">
                        <div className="receipt-row"><span>Santri</span><span>{receiptData.santriNama}</span></div>
                        <div className="receipt-row"><span>Kelas</span><span>{receiptData.santriKelas}</span></div>
                        <div className="receipt-row"><span>Lembaga</span><span>{receiptData.santriLembaga}</span></div>
                    </div>
                    <div className="receipt-divider">================================</div>
                    <div className="receipt-items">
                        {receiptData.items.map((item, idx) => (
                            <div key={idx} className="receipt-item">
                                <div className="receipt-item-name">{item.label}</div>
                                <div className="receipt-item-price">{formatIDR(item.nominal)}</div>
                            </div>
                        ))}
                    </div>
                    <div className="receipt-divider">================================</div>
                    <div className="receipt-total">
                        <div className="receipt-row"><span><strong>TOTAL</strong></span><span><strong>{formatIDR(receiptData.total)}</strong></span></div>
                        <div className="receipt-row"><span>Metode</span><span>{receiptData.metode}</span></div>
                    </div>
                    <div className="receipt-divider">--------------------------------</div>
                    <div className="receipt-footer">
                        <div>Terima kasih atas pembayarannya</div>
                        <div>Semoga Allah membalas kebaikan Anda</div>
                        <div style={{marginTop: '4px', fontSize: '8px'}}>*** Struk ini adalah bukti pembayaran sah ***</div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default Kasir;
