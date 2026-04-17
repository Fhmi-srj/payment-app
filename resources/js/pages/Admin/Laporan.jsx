import React, { useState, useEffect } from 'react';
import { API_BASE, authFetch } from '../../config/api';
import Pagination, { ITEMS_PER_PAGE_DEFAULT } from '../../components/Pagination';

const formatIDR = (n) => 'Rp' + parseInt(n || 0).toLocaleString('id-ID');
const jenisOptions = ['', 'Daftar Ulang', 'Syahriyah', 'Haflah', 'Seragam', 'Study Tour', 'Sekolah', 'Kartu Santri'];

function Laporan() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterLembaga, setFilterLembaga] = useState('');
    const [filterJenis, setFilterJenis] = useState('');
    const [filterDari, setFilterDari] = useState('');
    const [filterSampai, setFilterSampai] = useState('');
    const [filterPeriode, setFilterPeriode] = useState('harian');
    const [expandedPeriode, setExpandedPeriode] = useState(new Set());

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_DEFAULT);

    useEffect(() => { loadData(); }, [filterLembaga, filterJenis, filterDari, filterSampai, filterPeriode]);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [filterLembaga, filterJenis, filterDari, filterSampai, filterPeriode]);

    const loadData = async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams();
            if (filterLembaga) p.append('lembaga', filterLembaga);
            if (filterJenis) p.append('jenis', filterJenis);
            if (filterDari) p.append('dari_tanggal', filterDari);
            if (filterSampai) p.append('sampai_tanggal', filterSampai);
            p.append('periode', filterPeriode);
            const res = await authFetch(`${API_BASE}/laporan?${p}`);
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleExport = () => {
        const token = localStorage.getItem('auth_token');
        const p = new URLSearchParams();
        if (filterLembaga) p.append('lembaga', filterLembaga);
        if (filterDari) p.append('dari_tanggal', filterDari);
        if (filterSampai) p.append('sampai_tanggal', filterSampai);
        window.open(`${API_BASE}/laporan/export?${p}&token=${token}`, '_blank');
    };

    const resetFilters = () => {
        setFilterLembaga(''); setFilterJenis(''); setFilterDari(''); setFilterSampai(''); setFilterPeriode('harian');
    };

    const togglePeriode = (key) => {
        setExpandedPeriode(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const formatPeriodeLabel = (key) => {
        if (filterPeriode === 'bulanan') {
            const [y, m] = key.split('-');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            return `${months[parseInt(m) - 1]} ${y}`;
        }
        if (filterPeriode === 'tahunan') return `Tahun ${key}`;
        const d = new Date(key);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="w-32">
                        <label className="block mb-1 text-xs font-medium text-gray-700">Periode</label>
                        <select value={filterPeriode} onChange={e => setFilterPeriode(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="harian">Harian</option>
                            <option value="bulanan">Bulanan</option>
                            <option value="tahunan">Tahunan</option>
                        </select>
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
                    <div className="w-40">
                        <label className="block mb-1 text-xs font-medium text-gray-700">Jenis Tagihan</label>
                        <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                            {jenisOptions.map(j => <option key={j} value={j}>{j || 'Semua'}</option>)}
                        </select>
                    </div>
                    <div className="w-36">
                        <label className="block mb-1 text-xs font-medium text-gray-700">Dari</label>
                        <input type="date" value={filterDari} onChange={e => setFilterDari(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div className="w-36">
                        <label className="block mb-1 text-xs font-medium text-gray-700">Sampai</label>
                        <input type="date" value={filterSampai} onChange={e => setFilterSampai(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <button onClick={resetFilters} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                        <i className="fas fa-undo mr-1"></i>Reset
                    </button>
                    <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                        <i className="fas fa-file-excel mr-1"></i>Export
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40 text-gray-400"><i className="fas fa-spinner fa-spin mr-2"></i>Memuat...</div>
            ) : data && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-green-500">
                            <div className="text-[11px] text-gray-500 mb-1">Total Pemasukan</div>
                            <div className="text-lg font-bold text-green-600">{formatIDR(data.total_pemasukan)}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-emerald-500">
                            <div className="text-[11px] text-gray-500 mb-1">Jumlah Transaksi</div>
                            <div className="text-lg font-bold text-gray-800">{data.jumlah_transaksi}</div>
                        </div>
                    </div>

                    {/* Breakdown per Jenis */}
                    {data.breakdown_jenis && data.breakdown_jenis.length > 0 && (
                        <div className="bg-white rounded-lg shadow p-4 mb-4">
                            <h2 className="text-sm font-semibold text-gray-800 mb-3"><i className="fas fa-pie-chart mr-2 text-green-600"></i>Breakdown per Jenis Tagihan</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {data.breakdown_jenis.map((b, idx) => {
                                    const maxTotal = Math.max(...data.breakdown_jenis.map(x => x.total));
                                    const pct = maxTotal > 0 ? (b.total / maxTotal) * 100 : 0;
                                    return (
                                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-xs font-medium text-gray-700 mb-1">{b.nama}</div>
                                            <div className="text-sm font-bold text-green-600">{formatIDR(b.total)}</div>
                                            <div className="text-[10px] text-gray-400">{b.jumlah}x transaksi</div>
                                            <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2">
                                                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Grouped Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            {data.grouped.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <i className="fas fa-inbox text-3xl mb-2"></i>
                                    <p>Tidak ada data untuk filter yang dipilih</p>
                                </div>
                            ) : (
                                <>
                                    <table className="w-full text-sm">
                                        <thead className="bg-green-50 text-green-800">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold w-8"></th>
                                                <th className="px-4 py-3 text-left font-semibold">Periode</th>
                                                <th className="px-4 py-3 text-center font-semibold">Jumlah Transaksi</th>
                                                <th className="px-4 py-3 text-right font-semibold">Total Pemasukan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(() => {
                                                const totalPages = Math.ceil(data.grouped.length / itemsPerPage);
                                                const paginatedGrouped = data.grouped.slice(
                                                    (currentPage - 1) * itemsPerPage,
                                                    currentPage * itemsPerPage
                                                );
                                                return paginatedGrouped.map((g, idx) => (
                                                    <React.Fragment key={idx}>
                                                        <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => togglePeriode(g.periode)}>
                                                            <td className="px-4 py-3">
                                                                <i className={`fas fa-chevron-${expandedPeriode.has(g.periode) ? 'down' : 'right'} text-gray-400 text-xs`}></i>
                                                            </td>
                                                            <td className="px-4 py-3 font-medium">{formatPeriodeLabel(g.periode)}</td>
                                                            <td className="px-4 py-3 text-center">{g.jumlah_transaksi}</td>
                                                            <td className="px-4 py-3 text-right font-semibold text-green-600">{formatIDR(g.total)}</td>
                                                        </tr>
                                                        {expandedPeriode.has(g.periode) && g.transaksis.map((t, tidx) => (
                                                            <tr key={`${idx}-${tidx}`} className="bg-gray-50/50">
                                                                <td></td>
                                                                <td className="px-4 py-2 text-xs text-gray-500">{new Date(t.tanggal).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                                                <td className="px-4 py-2 text-xs">
                                                                    <span className="font-medium text-gray-700">{t.santri}</span>
                                                                    <span className="text-gray-400 ml-1">({t.lembaga})</span>
                                                                    <div className="text-[10px] text-gray-400 mt-0.5">{t.items.map(i => i.nama).join(', ')}</div>
                                                                </td>
                                                                <td className="px-4 py-2 text-xs text-right font-medium text-green-600">{formatIDR(t.total)}</td>
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>
                                    {data.grouped.length > 0 && (
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={Math.ceil(data.grouped.length / itemsPerPage)}
                                            onPageChange={setCurrentPage}
                                            totalItems={data.grouped.length}
                                            itemsPerPage={itemsPerPage}
                                            onLimitChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

export default Laporan;
