import React, { useState, useEffect, useRef } from 'react';
import { API_BASE, authFetch } from '../../config/api';
import Modal from '../../components/Modal';
import Pagination, { ITEMS_PER_PAGE_DEFAULT } from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';

const formatIDR = (n) => 'Rp' + parseInt(n || 0).toLocaleString('id-ID');
const moneyLabels = { daftar_ulang: 'Daftar Ulang', syahriyah: 'Syahriyah', haflah: 'Haflah', seragam: 'Seragam', study_tour: 'Study Tour', kartu_santri: 'Kartu Santri' };
const moneyFields = Object.keys(moneyLabels);

const BULAN_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function Tagihan() {
    const { user } = useAuth();
    const [santris, setSantris] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterLembaga, setFilterLembaga] = useState('');
    const [filterKelas, setFilterKelas] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [search, setSearch] = useState('');
    const [selectedSantri, setSelectedSantri] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [tagihanSettings, setTagihanSettings] = useState({});
    const [expandSyahriyah, setExpandSyahriyah] = useState(false);

    // Initial load
    useEffect(() => {
        const savedData = localStorage.getItem('tagihan_settings');
        if (savedData) setTagihanSettings(JSON.parse(savedData));
    }, []);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_DEFAULT);

    // Print report state
    const [showPrint, setShowPrint] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);
    const printRef = useRef(null);

    useEffect(() => { loadData(); loadSummary(); }, [filterLembaga, filterKelas, filterStatus, search]);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [filterLembaga, filterKelas, filterStatus, search]);

    const loadData = async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams();
            if (filterLembaga) p.append('lembaga', filterLembaga);
            if (filterKelas) p.append('kelas', filterKelas);
            if (filterStatus) p.append('status_bayar', filterStatus);
            if (search) p.append('search', search);
            const res = await authFetch(`${API_BASE}/tagihan?${p}`);
            const json = await res.json();
            if (json.success) setSantris(json.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadSummary = async () => {
        try {
            const res = await authFetch(`${API_BASE}/tagihan/summary`);
            const json = await res.json();
            if (json.success) setSummary(json.data);
        } catch (e) { console.error(e); }
    };

    const openDetail = async (santri) => {
        setSelectedSantri(santri);
        setDetailData(null);
        setDetailLoading(true);
        setShowDetail(true);
        try {
            const res = await authFetch(`${API_BASE}/tagihan/${santri.id}`);
            const json = await res.json();
            if (json.success) setDetailData(json.data);
        } catch (e) { console.error(e); }
        finally { setDetailLoading(false); }
    };

    const getTotalTagihan = (s) => moneyFields.reduce((sum, f) => sum + (s[f] || 0), 0);
    const isLunas = (s) => getTotalTagihan(s) <= 0;

    const resetFilters = () => {
        setFilterLembaga(''); setFilterKelas(''); setFilterStatus(''); setSearch('');
    };

    const loadReport = async () => {
        setReportLoading(true);
        setShowPrint(true);
        try {
            const p = new URLSearchParams();
            if (filterLembaga) p.append('lembaga', filterLembaga);
            if (filterKelas) p.append('kelas', filterKelas);
            if (filterStatus) p.append('status_bayar', filterStatus);
            if (search) p.append('search', search);
            if (tagihanSettings.syahriyah?.nominal) p.append('nominal_syahriyah', tagihanSettings.syahriyah.nominal);
            const res = await authFetch(`${API_BASE}/tagihan/report?${p}`);
            const json = await res.json();
            if (json.success) setReportData(json.data);
        } catch (e) { console.error(e); }
        finally { setReportLoading(false); }
    };

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>Laporan Tagihan Syahriyah</title>
            <style>
                @page { size: landscape; margin: 10mm; }
                body { font-family: Arial, sans-serif; font-size: 10px; margin: 0; padding: 0; }
                table { border-collapse: collapse; width: 100%; }
                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }
                th, td { border: 1px solid #333; padding: 3px 5px; text-align: center; }
                th { background: #166534; color: white; font-size: 9px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                td { font-size: 9px; }
                .kop-row td { border: none; padding: 0; }
                .kop-content { text-align: center; padding: 5px 0 8px 0; }
                .kop-content h2 { margin: 2px 0; font-size: 16px; font-weight: 800; color: #166534; }
                .kop-content p { margin: 0; font-size: 9px; color: #555; }
                .kop-line { height: 2px; background: #166534; margin: 6px 0 4px 0; }
                .footer-row td { border: none; padding: 0; }
            </style></head><body>
            ${content.innerHTML}
            </body></html>
        `);
        win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 300);
    };

    // ... (rest of Tagihan continues)

    // Pagination calculations
    const totalPages = Math.ceil(santris.length / itemsPerPage);
    const paginatedSantris = santris.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded-lg shadow p-3 border-l-4 border-blue-500">
                        <div className="text-[11px] text-gray-500 mb-1">Total Santri Aktif</div>
                        <div className="text-xl font-bold text-gray-800">{summary.total_santri}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-3 border-l-4 border-red-500">
                        <div className="text-[11px] text-gray-500 mb-1">Santri Nunggak</div>
                        <div className="text-xl font-bold text-red-600">{summary.santri_nunggak}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-3 border-l-4 border-green-500">
                        <div className="text-[11px] text-gray-500 mb-1">Santri Lunas</div>
                        <div className="text-xl font-bold text-green-600">{summary.santri_lunas}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-3 border-l-4 border-orange-500">
                        <div className="text-[11px] text-gray-500 mb-1">Total Tunggakan</div>
                        <div className="text-xl font-bold text-orange-600">{formatIDR(summary.total_tunggakan)}</div>
                    </div>
                </div>
            )}

            {/* Breakdown per Jenis */}
            {summary && summary.breakdown_jenis && summary.breakdown_jenis.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                    <h2 className="text-sm font-semibold text-gray-800 mb-3"><i className="fas fa-chart-pie mr-2 text-green-600"></i>Tunggakan per Jenis</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {summary.breakdown_jenis.map((b, idx) => (
                            <div key={idx} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                                <div className="text-xs font-medium text-gray-700">{b.jenis}</div>
                                <div className="text-sm font-bold text-orange-600 mt-1">{formatIDR(b.total_sisa)}</div>
                                <div className="text-[10px] text-gray-400">{b.jumlah_santri} santri</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[150px]">
                        <label className="block mb-1 text-xs font-medium text-gray-700">Cari Santri</label>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama santri..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div className="w-36">
                        <label className="block mb-1 text-xs font-medium text-gray-700">Lembaga</label>
                        <select value={filterLembaga} onChange={e => setFilterLembaga(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="">Semua</option>
                            <option value="MA ALHIKAM">MA ALHIKAM</option>
                            <option value="ITS">ITS</option>
                        </select>
                    </div>
                    <div className="w-36">
                        <label className="block mb-1 text-xs font-medium text-gray-700">Status Bayar</label>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="">Semua</option>
                            <option value="nunggak">Nunggak</option>
                            <option value="lunas">Lunas</option>
                        </select>
                    </div>
                    <button onClick={resetFilters} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                        <i className="fas fa-undo mr-1"></i>Reset
                    </button>
                    <button onClick={loadReport} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                        <i className="fas fa-print mr-1"></i>Cetak Laporan
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-green-50 text-green-800">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">No</th>
                                <th className="px-4 py-3 text-left font-semibold">Nama</th>
                                <th className="px-4 py-3 text-left font-semibold">Lembaga</th>
                                <th className="px-4 py-3 text-left font-semibold">Kelas</th>
                                <th className="px-4 py-3 text-right font-semibold">Total Tagihan</th>
                                <th className="px-4 py-3 text-center font-semibold">Status</th>
                                <th className="px-4 py-3 text-center font-semibold">Progres</th>
                                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400"><i className="fas fa-spinner fa-spin mr-1"></i>Memuat...</td></tr>
                            ) : paginatedSantris.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                    <i className="fas fa-inbox text-3xl mb-2 block"></i>Tidak ada data
                                </td></tr>
                            ) : paginatedSantris.map((s, idx) => {
                                const total = s.total_tagihan || getTotalTagihan(s);
                                const lunas = total <= 0;
                                const lunasCount = moneyFields.filter(f => (s[f] || 0) <= 0).length;
                                const progressPct = (lunasCount / moneyFields.length) * 100;

                                return (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                        <td className="px-4 py-3 font-medium">{s.nama}</td>
                                        <td className="px-4 py-3">{s.lembaga}</td>
                                        <td className="px-4 py-3">{s.kelas}</td>
                                        <td className={`px-4 py-3 text-right font-semibold ${lunas ? 'text-green-600' : 'text-red-600'}`}>
                                            {lunas ? 'LUNAS' : formatIDR(total)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${lunas ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${lunas ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {lunas ? 'Lunas' : 'Nunggak'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all ${progressPct >= 100 ? 'bg-green-500' : progressPct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                        style={{ width: `${progressPct}%` }}></div>
                                                </div>
                                                <span className="text-[10px] text-gray-400 w-8">{Math.round(progressPct)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => openDetail(s)} className="text-green-600 hover:text-green-800 text-xs">
                                                <i className="fas fa-eye mr-1"></i>Detail
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {!loading && santris.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={santris.length}
                        itemsPerPage={itemsPerPage}
                        onLimitChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }}
                    />
                )}
            </div>

            {/* Detail Modal */}
            <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} maxWidth="max-w-2xl">
                {detailLoading ? (
                    <div className="modal-loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Memuat detail tagihan...</span>
                    </div>
                ) : detailData ? (
                    <>
                        <div className="p-5 border-b flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-800 text-lg">{detailData.santri.nama}</h3>
                                <p className="text-xs text-gray-500">{detailData.santri.lembaga} · Kelas {detailData.santri.kelas}</p>
                            </div>
                            <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times fa-lg"></i></button>
                        </div>

                        <div className="p-5">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3"><i className="fas fa-list-alt mr-2 text-green-600"></i>Detail Tagihan</h4>
                            <div className="space-y-2 mb-6">
                                {detailData.breakdown.map((b, idx) => {
                                    const isSyahriyah = b.field === 'syahriyah';
                                    const nom = Number(tagihanSettings?.syahriyah?.nominal) || 400000;
                                    const blnBelum = isSyahriyah && nom > 0 ? Math.ceil(b.sisa / nom) : 0;
                                    return (
                                        <div key={idx} className="mb-2">
                                            <div 
                                                onClick={() => { if(isSyahriyah && !b.lunas) setExpandSyahriyah(!expandSyahriyah) }} 
                                                className={`flex items-center justify-between p-3 ${isSyahriyah && !b.lunas ? 'cursor-pointer hover:border-red-400' : ''} ${b.lunas ? 'bg-green-50 border border-green-200 rounded-lg' : 'bg-red-50 border border-red-200'}`}
                                                style={{ borderRadius: (isSyahriyah && !b.lunas && expandSyahriyah) ? '0.5rem 0.5rem 0 0' : '0.5rem' }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <i className={`fas ${b.lunas ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'}`}></i>
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {b.jenis} {isSyahriyah && !b.lunas && blnBelum > 0 ? <span className="ml-1 text-xs text-red-500 font-normal">({blnBelum} bulan belum lunas)</span> : ''}
                                                    </span>
                                                </div>
                                                <span className={`text-sm font-semibold ${b.lunas ? 'text-green-600' : 'text-red-600'}`}>
                                                    {b.lunas ? 'LUNAS' : formatIDR(b.sisa)}
                                                    {isSyahriyah && !b.lunas && <i className={`fas fa-chevron-${expandSyahriyah ? 'up' : 'down'} ml-3 text-red-400 transition-transform duration-200`}></i>}
                                                </span>
                                            </div>
                                            {isSyahriyah && !b.lunas && expandSyahriyah && (
                                                <div className="bg-[#fff1f2] border border-red-200 border-t-0 p-3 text-xs text-red-700 -mt-[1px]" style={{ borderRadius: '0 0 0.5rem 0.5rem' }}>
                                                    <div className="flex items-start gap-2">
                                                        <i className="fas fa-info-circle mt-0.5"></i>
                                                        <div>
                                                            <p>Rincian estimasi tunggakan: <strong>{blnBelum} bulan</strong> x {formatIDR(nom)}</p>
                                                            <p className="mt-1 text-gray-500 italic text-[10px]">*Jumlah bulan dihitung berdasarkan sisa nominal tagihan dibagi nominal default per bulan.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                <div className="flex justify-between p-3 bg-gray-100 rounded-lg mt-2 border-t-2 border-gray-300">
                                    <span className="font-bold text-gray-800">TOTAL TAGIHAN</span>
                                    <span className={`font-bold ${detailData.total_tagihan > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {detailData.total_tagihan > 0 ? formatIDR(detailData.total_tagihan) : 'LUNAS'}
                                    </span>
                                </div>
                            </div>

                            <h4 className="text-sm font-semibold text-gray-700 mb-3"><i className="fas fa-history mr-2 text-green-600"></i>Riwayat Pembayaran</h4>
                            {detailData.riwayat.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">Belum ada riwayat pembayaran</p>
                            ) : (
                                <div className="space-y-2">
                                    {detailData.riwayat.map((r, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <div className="text-xs font-medium text-gray-700">{new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                <div className="text-[10px] text-gray-400">{r.items.map(i => i.nama).join(', ')}</div>
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
                    </>
                ) : null}
            </Modal>

            {/* Print Report Modal */}
            <Modal isOpen={showPrint} onClose={() => setShowPrint(false)} maxWidth="max-w-7xl">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800"><i className="fas fa-print mr-2 text-green-600"></i>Laporan Tagihan Syahriyah</h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                            <i className="fas fa-print mr-1"></i>Cetak
                        </button>
                        <button onClick={() => setShowPrint(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times fa-lg"></i></button>
                    </div>
                </div>
                <div className="p-4 overflow-auto" style={{ maxHeight: '75vh' }}>
                    {reportLoading ? (
                        <div className="text-center py-8 text-gray-400"><i className="fas fa-spinner fa-spin mr-1"></i>Memuat data laporan...</div>
                    ) : (
                        <div ref={printRef}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '9px' }}>
                                {/* KOP inside thead — repeats on every printed page */}
                                <thead>
                                    <tr className="kop-row">
                                        <td colSpan={14} style={{ border: 'none', padding: 0 }}>
                                            <div className="kop-content" style={{ textAlign: 'center', padding: '5px 0 8px 0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                                    <img src="/logo pondok.png" alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                                                    <div>
                                                        <div style={{ fontSize: '9px', fontWeight: '600', color: '#166534', letterSpacing: '1px' }}>LAPORAN TAGIHAN SYAHRIYAH</div>
                                                        <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#166534', margin: '2px 0' }}>PONDOK PESANTREN NURUL HUDA AN-NAJAH</h2>
                                                        <p style={{ fontSize: '8px', color: '#555', margin: 0 }}>SIMBANGKULON, PEKALONGAN, JAWA TENGAH 51173</p>
                                                    </div>
                                                </div>
                                                <div style={{ height: '2px', background: '#166534', margin: '6px 0 2px 0' }} />
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th style={{ border: '1px solid #333', padding: '4px', background: '#166534', color: '#fff', width: '30px' }}>No</th>
                                        <th style={{ border: '1px solid #333', padding: '4px', background: '#166534', color: '#fff', textAlign: 'left', minWidth: '120px' }}>Nama</th>
                                        {BULAN_NAMES.map((b, i) => (
                                            <th key={i} style={{ border: '1px solid #333', padding: '4px', background: '#166534', color: '#fff', fontSize: '8px', width: '60px' }}>{b.substring(0, 3)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                {/* Footer inside tfoot — appears at bottom of last page */}
                                <tfoot>
                                    <tr className="footer-row">
                                        <td colSpan={14} style={{ border: 'none', padding: 0 }}>
                                            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                                                <div style={{ textAlign: 'center', width: '200px' }}>
                                                    <div style={{ fontSize: '10px' }}>Simbangkulon, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                                    <div style={{ marginTop: '50px', borderBottom: '1px solid #333', paddingBottom: '3px', fontWeight: '600' }}>
                                                        {user?.name || '...........................'}
                                                    </div>
                                                    <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>Petugas</div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                                <tbody>
                                    {reportData.map((s, idx) => (
                                        <tr key={s.id}>
                                            <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'center' }}>{idx + 1}</td>
                                            <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'left', fontWeight: '500' }}>{s.nama}</td>
                                            {Array.from({ length: 12 }, (_, m) => {
                                                const month = s.months[m];
                                                const isPaid = month && month.sisa <= 0;
                                                return (
                                                    <td key={m} style={{ border: '1px solid #999', padding: '3px', textAlign: 'center', color: isPaid ? '#16a34a' : '#dc2626', fontWeight: isPaid ? 'bold' : 'normal', fontSize: '8px' }}>
                                                        {isPaid ? '✓' : formatIDR(month?.sisa || 600000)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}

export default Tagihan;
