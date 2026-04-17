import React, { useState, useEffect, useRef } from 'react';
import { API_BASE, authFetch } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import Swal from 'sweetalert2';
import Modal from '../../components/Modal';
import Pagination, { ITEMS_PER_PAGE_DEFAULT } from '../../components/Pagination';

const formatIDR = (num) => 'Rp' + parseInt(num || 0).toLocaleString('id-ID');

function Riwayat() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [transaksis, setTransaksis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterNama, setFilterNama] = useState('');
    const [filterLembaga, setFilterLembaga] = useState('');
    const [filterDari, setFilterDari] = useState('');
    const [filterSampai, setFilterSampai] = useState('');

    // Receipt preview
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptLoading, setReceiptLoading] = useState(false);
    const [selectedTransaksi, setSelectedTransaksi] = useState(null);
    const printRef = useRef();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_DEFAULT);

    useEffect(() => { loadTransaksis(); }, [filterNama, filterLembaga, filterDari, filterSampai]);
    useEffect(() => { setCurrentPage(1); }, [filterNama, filterLembaga, filterDari, filterSampai]);

    const loadTransaksis = async () => {
        try {
            const params = new URLSearchParams();
            if (filterNama) params.append('search', filterNama);
            if (filterLembaga) params.append('lembaga', filterLembaga);
            if (filterDari) params.append('dari_tanggal', filterDari);
            if (filterSampai) params.append('sampai_tanggal', filterSampai);
            const res = await authFetch(`${API_BASE}/riwayat?${params}`);
            const data = await res.json();
            setTransaksis(data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const resetFilters = () => {
        setFilterNama('');
        setFilterLembaga('');
        setFilterDari('');
        setFilterSampai('');
    };

    // Print kuitansi preview
    const handlePrintKuitansi = async (t) => {
        setSelectedTransaksi(null);
        setReceiptLoading(true);
        setShowReceipt(true);
        try {
            const res = await authFetch(`${API_BASE}/cetak/kwitansi/${t.id}`);
            const data = await res.json();
            if (data.success) setSelectedTransaksi(data.data);
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal memuat data kuitansi' });
            setShowReceipt(false);
        }
        finally { setReceiptLoading(false); }
    };

    const doPrint = () => {
        const content = printRef.current;
        if (!content) return;
        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html><html><head><title>Cetak Kuitansi</title>
            <style>
                body{font-family:'Segoe UI',Tahoma,sans-serif;margin:0;padding:10px;color:#333}
                @media print{@page{size:landscape;margin:5mm}body{margin:0}}
            </style></head><body>${content.innerHTML}</body></html>`);
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); w.close(); }, 300);
    };

    // Delete transaksi (admin only)
    const handleDelete = async (t) => {
        const result = await Swal.fire({
            title: 'Hapus Transaksi?',
            html: `<div class="text-left text-sm"><strong>${t.santri?.nama}</strong><br/>Total: ${formatIDR(t.total)}<br/><span class="text-red-500 text-xs">Tagihan santri akan dikembalikan!</span></div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: '<i class="fas fa-trash mr-1"></i>Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        try {
            const res = await authFetch(`${API_BASE}/riwayat/${t.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                Swal.fire({ icon: 'success', title: 'Dihapus!', text: data.message, timer: 1500, showConfirmButton: false });
                loadTransaksis();
            } else {
                Swal.fire({ icon: 'error', title: 'Gagal', text: data.message });
            }
        } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan' }); }
    };

    const handleExport = () => {
        const token = localStorage.getItem('auth_token');
        const params = new URLSearchParams();
        if (filterLembaga) params.append('lembaga', filterLembaga);
        if (filterDari) params.append('dari_tanggal', filterDari);
        if (filterSampai) params.append('sampai_tanggal', filterSampai);
        window.open(`${API_BASE}/riwayat/export?${params}&token=${token}`, '_blank');
    };

    const totalPembayaran = transaksis.reduce((sum, t) => sum + t.total, 0);

    // Pagination
    const totalPages = Math.ceil(transaksis.length / itemsPerPage);
    const paginatedTransaksis = transaksis.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <>

            {/* Filter Section */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[150px]">
                        <label className="block mb-1 text-xs font-medium text-gray-700">Cari Santri</label>
                        <input type="text" value={filterNama} onChange={e => setFilterNama(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Nama santri..." />
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
                        <label className="block mb-1 text-xs font-medium text-gray-700">Dari Tanggal</label>
                        <input type="date" value={filterDari} onChange={e => setFilterDari(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div className="w-36">
                        <label className="block mb-1 text-xs font-medium text-gray-700">Sampai Tanggal</label>
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

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-lg shadow p-3 text-center">
                    <div className="text-2xl font-bold text-gray-800">{transaksis.length}</div>
                    <div className="text-xs text-gray-500">Total Transaksi</div>
                </div>
                <div className="bg-green-50 rounded-lg shadow p-3 text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{formatIDR(totalPembayaran)}</div>
                    <div className="text-xs text-green-600">Total Pembayaran</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden flex-grow">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-sm" id="table-riwayat">
                        <thead className="bg-green-50 text-green-800">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">No</th>
                                <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                                <th className="px-4 py-3 text-left font-semibold">Nama Santri</th>
                                <th className="px-4 py-3 text-left font-semibold">Lembaga</th>
                                <th className="px-4 py-3 text-left font-semibold">Detail</th>
                                <th className="px-4 py-3 text-right font-semibold">Nominal</th>
                                <th className="px-4 py-3 text-center font-semibold">Metode</th>
                                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>
                            ) : paginatedTransaksis.length === 0 ? null : paginatedTransaksis.map((t, idx) => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(t.tanggal)}</td>
                                    <td className="px-4 py-3 font-medium">{t.santri?.nama || '-'}</td>
                                    <td className="px-4 py-3">{t.santri?.lembaga || '-'}</td>
                                    <td className="px-4 py-3 text-xs">{(t.items || []).map(i => i.nama).join(', ')}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-green-600">{formatIDR(t.total)}</td>
                                    <td className="px-4 py-3 text-center">{t.metode || '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {/* Print — TU & Admin */}
                                            <button onClick={(e) => { e.stopPropagation(); handlePrintKuitansi(t); }}
                                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
                                                title="Cetak Kuitansi">
                                                <i className="fas fa-print text-xs"></i>
                                            </button>
                                            {/* Delete — Admin only */}
                                            {isAdmin && (
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(t); }}
                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                                                    title="Hapus Transaksi">
                                                    <i className="fas fa-trash text-xs"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && transaksis.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        <i className="fas fa-inbox text-4xl mb-3 text-gray-300"></i>
                        <p>Belum ada riwayat transaksi</p>
                    </div>
                )}
                {!loading && transaksis.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={transaksis.length}
                        itemsPerPage={itemsPerPage}
                        onLimitChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }}
                    />
                )}
            </div>

            {/* Kuitansi Preview Modal */}
            <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} maxWidth="max-w-5xl">
                {receiptLoading ? (
                    <div className="modal-loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Memuat kuitansi...</span>
                    </div>
                ) : selectedTransaksi ? (
                    <>
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800"><i className="fas fa-receipt mr-2 text-green-600"></i>Preview Kuitansi</h3>
                            <div className="flex gap-2">
                                <button onClick={doPrint} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                                    <i className="fas fa-print mr-1"></i>Cetak
                                </button>
                                <button onClick={() => setShowReceipt(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times fa-lg"></i></button>
                            </div>
                        </div>
                        <div className="p-6 overflow-x-auto" ref={printRef}>
                            <KwitansiLandscape data={selectedTransaksi} />
                        </div>
                    </>
                ) : null}
            </Modal>
        </>
    );
}

/* ─── Landscape Kuitansi Component ───────────────────────────── */
const BULAN_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function KwitansiLandscape({ data }) {
    const tgl = new Date(data.transaksi.tanggal);
    const tglStr = tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const noKwt = `KWT-${tgl.getFullYear()}-${String(data.transaksi.id).padStart(4, '0')}`;
    const qrValue = `pembayaran.ponpes.id/verify/${data.transaksi.id}`;

    const hasSyahriyah = data.items.some(i => (i.nama || '').toLowerCase().includes('syahriyah'));
    const syahriyahMonths = data.items.filter(i => (i.nama || '').toLowerCase().includes('syahriyah')).map(i => {
        const b = i.bulan;
        if (b === null || b === undefined || b === '') return '';
        const idx = parseInt(b);
        if (!isNaN(idx) && idx >= 0 && idx < 12) return BULAN_NAMES[idx];
        return String(b);
    }).filter(Boolean).join(', ');
    const hasDaftarUlang = data.items.some(i => (i.nama || '').toLowerCase().includes('daftar'));
    const otherItems = data.items.filter(i => !(i.nama || '').toLowerCase().includes('syahriyah') && !(i.nama || '').toLowerCase().includes('daftar'));
    const hasOther = otherItems.length > 0;
    const otherNames = otherItems.map(i => i.nama + (i.bulan ? ` (${i.bulan})` : '')).join(', ');

    const terbilang = (n) => {
        const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
        if (n < 12) return satuan[n];
        if (n < 20) return terbilang(n - 10) + ' belas';
        if (n < 100) return terbilang(Math.floor(n / 10)) + ' puluh' + (n % 10 ? ' ' + terbilang(n % 10) : '');
        if (n < 200) return 'seratus' + (n - 100 ? ' ' + terbilang(n - 100) : '');
        if (n < 1000) return terbilang(Math.floor(n / 100)) + ' ratus' + (n % 100 ? ' ' + terbilang(n % 100) : '');
        if (n < 2000) return 'seribu' + (n - 1000 ? ' ' + terbilang(n - 1000) : '');
        if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' ribu' + (n % 1000 ? ' ' + terbilang(n % 1000) : '');
        if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' juta' + (n % 1000000 ? ' ' + terbilang(n % 1000000) : '');
        return terbilang(Math.floor(n / 1000000000)) + ' miliar' + (n % 1000000000 ? ' ' + terbilang(n % 1000000000) : '');
    };
    const totalTerbilang = terbilang(parseInt(data.transaksi.total || 0));

    const s = {
        outer: { display: 'flex', border: '2px solid #166534', borderRadius: '12px', overflow: 'hidden', fontFamily: "'Segoe UI', Tahoma, sans-serif", color: '#333', background: '#fff', position: 'relative', minHeight: '280px' },
        cornerTL: { position: 'absolute', top: 0, left: 0, width: '30px', height: '30px', borderTop: '4px solid #166534', borderLeft: '4px solid #166534', borderRadius: '12px 0 0 0' },
        cornerTR: { position: 'absolute', top: 0, right: 0, width: '30px', height: '30px', borderTop: '4px solid #166534', borderRight: '4px solid #166534', borderRadius: '0 12px 0 0' },
        cornerBL: { position: 'absolute', bottom: 0, left: 0, width: '30px', height: '30px', borderBottom: '4px solid #166534', borderLeft: '4px solid #166534', borderRadius: '0 0 0 12px' },
        cornerBR: { position: 'absolute', bottom: 0, right: 0, width: '30px', height: '30px', borderBottom: '4px solid #166534', borderRight: '4px solid #166534', borderRadius: '0 0 12px 0' },
        qrPanel: { width: '200px', minWidth: '200px', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '15px', borderRight: '2px solid #166534' },
        qrHeader: { background: '#166534', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', textAlign: 'center', marginBottom: '10px', letterSpacing: '0.5px', width: '100%' },
        qrUrl: { fontSize: '10px', fontWeight: '600', color: '#166534', marginTop: '8px', textAlign: 'center' },
        qrNote: { fontSize: '8px', color: '#888', textAlign: 'center', marginTop: '4px', lineHeight: '1.3' },
        mainPanel: { flex: 1, padding: '15px 20px', display: 'flex', flexDirection: 'column' },
    };

    return (
        <div style={s.outer}>
            <div style={s.cornerTL} /><div style={s.cornerTR} /><div style={s.cornerBL} /><div style={s.cornerBR} />
            <div style={s.qrPanel}>
                <div style={s.qrHeader}>BARCODE DETAIL<br />PEMBAYARAN</div>
                <QRCodeSVG value={qrValue} size={150} level="M" />
                <div style={s.qrUrl}>pembayaran.ponpes.id</div>
                <div style={s.qrNote}>Barcode ini digunakan untuk pengecekan detail pembayaran administrasi Pondok atau Sekolah</div>
            </div>
            <div style={s.mainPanel}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <img src="/logo pondok.png" alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                        <div>
                            <div style={{ background: '#166534', color: '#fff', display: 'inline-block', padding: '4px 18px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>KWITANSI PEMBAYARAN</div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#166534', margin: '2px 0', letterSpacing: '0.5px' }}>PONDOK PESANTREN NURUL HUDA AN-NAJAH</div>
                            <div style={{ fontSize: '9px', color: '#555', letterSpacing: '0.3px' }}>SIMBANGKULON, PEKALONGAN, JAWA TENGAH 51173</div>
                        </div>
                    </div>
                    <div style={{ fontSize: '9px', color: '#555', display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '2px' }}>
                        <span>📞 +62 812-3456-7890</span>
                        <span>Rekening BSI : 123-456-789 (Nurul Huda An-Najah)</span>
                    </div>
                    <div style={{ height: '2px', background: 'linear-gradient(90deg, #166534, #16a34a, #166534)', margin: '6px 0' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ border: '1px solid #999', padding: '3px 12px', fontSize: '11px', fontWeight: '700' }}>NO. {noKwt}</div>
                </div>
                {/* Full-width form fields */}
                <div style={{ fontSize: '12px' }}>
                    <div style={{ display: 'flex', marginBottom: '6px' }}>
                        <span style={{ width: '140px', fontWeight: '600' }}>Telah Diterima dari</span>
                        <span>: &nbsp;</span>
                        <span style={{ borderBottom: '1px dotted #999', flex: 1, fontWeight: '600' }}>{data.santri.nama}</span>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '6px' }}>
                        <span style={{ width: '140px', fontWeight: '600' }}>Banyaknya Uang</span>
                        <span>: &nbsp;</span>
                        <span style={{ borderBottom: '1px dotted #999', flex: 1, fontStyle: 'italic', background: '#f0fdf4', padding: '1px 6px', borderRadius: '3px' }}>{formatIDR(data.transaksi.total)} ({totalTerbilang} rupiah)</span>
                    </div>
                </div>
                {/* Checkboxes + Date/Signature side by side */}
                <div style={{ display: 'flex', gap: '15px', flex: 1, fontSize: '12px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '5px' }}>Untuk Pembayaran :</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '1.5px solid #555', borderRadius: '2px', textAlign: 'center', lineHeight: '13px', fontSize: '10px', fontWeight: '700', background: hasSyahriyah ? '#dcfce7' : '#fff', color: '#166534' }}>{hasSyahriyah ? '✓' : ''}</span>
                                <span>Syahriyah Bulan : {hasSyahriyah ? (syahriyahMonths || '...') : '......................................'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '1.5px solid #555', borderRadius: '2px', textAlign: 'center', lineHeight: '13px', fontSize: '10px', fontWeight: '700', background: hasDaftarUlang ? '#dcfce7' : '#fff', color: '#166534' }}>{hasDaftarUlang ? '✓' : ''}</span>
                                <span>Daftar Ulang : ........................................</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '1.5px solid #555', borderRadius: '2px', textAlign: 'center', lineHeight: '13px', fontSize: '10px', fontWeight: '700', background: hasOther ? '#dcfce7' : '#fff', color: '#166534' }}>{hasOther ? '✓' : ''}</span>
                                <span>Lainnya : {hasOther ? otherNames : '.............................................'}</span>
                            </div>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '10px', fontStyle: 'italic', color: '#d97706' }}>
                            <em>NB : Mohon disimpan Bukti Pembayaran ini !!!</em>
                        </div>
                    </div>
                    <div style={{ width: '180px', textAlign: 'center', fontSize: '11px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <div>
                            <div>Simbangkulon, {tglStr}</div>
                            <div style={{ marginTop: '2px', fontSize: '10px', color: '#888' }}>Metode: {data.transaksi.metode}</div>
                        </div>
                        <div>
                            <div style={{ marginTop: '40px', borderBottom: '1px solid #333', paddingBottom: '3px' }}>
                                ({data.petugas})
                            </div>
                            <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>Petugas</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Riwayat;
