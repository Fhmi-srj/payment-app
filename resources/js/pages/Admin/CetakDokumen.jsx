import React, { useState, useEffect, useRef } from 'react';
import { API_BASE, authFetch } from '../../config/api';
import { QRCodeSVG } from 'qrcode.react';
import Swal from 'sweetalert2';
import Modal from '../../components/Modal';
import Pagination, { ITEMS_PER_PAGE_DEFAULT } from '../../components/Pagination';

const formatIDR = (n) => 'Rp' + parseInt(n || 0).toLocaleString('id-ID');

function CetakDokumen() {
    const [activeTab, setActiveTab] = useState('kwitansi');
    const [search, setSearch] = useState('');
    const [transaksis, setTransaksis] = useState([]);
    const [santris, setSantris] = useState([]);
    const [loading, setLoading] = useState(false);
    const [printData, setPrintData] = useState(null);
    const [printType, setPrintType] = useState('');
    const [printLoading, setPrintLoading] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const printRef = useRef();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_DEFAULT);

    useEffect(() => {
        if (activeTab === 'kwitansi') loadTransaksis();
        else loadSantris();
    }, [activeTab, search]);

    // Reset page when tab or search changes
    useEffect(() => { setCurrentPage(1); }, [activeTab, search]);

    const loadTransaksis = async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams();
            if (search) p.append('search', search);
            const res = await authFetch(`${API_BASE}/riwayat?${p}`);
            const json = await res.json();
            if (json.success) setTransaksis(json.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadSantris = async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams();
            if (search) p.append('search', search);
            const res = await authFetch(`${API_BASE}/tagihan?${p}`);
            const json = await res.json();
            if (json.success) setSantris(json.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const closePrintModal = () => {
        setShowPrintModal(false);
        setPrintData(null);
    };

    const handlePrintKwitansi = async (transaksi) => {
        setPrintData(null);
        setPrintType('kwitansi');
        setPrintLoading(true);
        setShowPrintModal(true);
        try {
            const res = await authFetch(`${API_BASE}/cetak/kwitansi/${transaksi.id}`);
            const json = await res.json();
            if (json.success) setPrintData(json.data);
        } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal memuat data' }); setShowPrintModal(false); }
        finally { setPrintLoading(false); }
    };

    const handlePrintSuratLunas = async (santri) => {
        setPrintData(null);
        setPrintType('surat_lunas');
        setPrintLoading(true);
        setShowPrintModal(true);
        try {
            const res = await authFetch(`${API_BASE}/cetak/surat-lunas/${santri.id}`);
            const json = await res.json();
            if (json.success) {
                if (!json.data.is_lunas) {
                    setShowPrintModal(false);
                    Swal.fire({ icon: 'warning', title: 'Belum Lunas', text: `${santri.nama} masih memiliki tunggakan ${formatIDR(json.data.total_sisa)}` });
                    return;
                }
                setPrintData(json.data);
            }
        } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal memuat data' }); setShowPrintModal(false); }
        finally { setPrintLoading(false); }
    };

    const handlePrintKartu = async (santri) => {
        setPrintData(null);
        setPrintType('kartu');
        setPrintLoading(true);
        setShowPrintModal(true);
        try {
            const res = await authFetch(`${API_BASE}/cetak/kartu/${santri.id}`);
            const json = await res.json();
            if (json.success) setPrintData(json.data);
        } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal memuat data' }); setShowPrintModal(false); }
        finally { setPrintLoading(false); }
    };

    const doPrint = () => {
        const content = printRef.current;
        if (!content) return;
        const isKwitansi = printType === 'kwitansi';
        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html><html><head><title>Cetak</title>
            <style>
                body{font-family:'Segoe UI',Tahoma,sans-serif;margin:20px;color:#333}
                table{width:100%;border-collapse:collapse;margin:10px 0}
                th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}
                th{background:#f0fdf4;color:#166534;font-weight:600}
                .header{text-align:center;margin-bottom:20px;border-bottom:2px solid #16a34a;padding-bottom:15px}
                .header h1{color:#166534;margin:0;font-size:18px}
                .header p{margin:3px 0;font-size:12px;color:#666}
                .badge-lunas{background:#dcfce7;color:#166534;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600}
                .badge-nunggak{background:#fef2f2;color:#dc2626;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600}
                .total-row{background:#f0fdf4;font-weight:700}
                .footer{margin-top:30px;text-align:right;font-size:12px}
                .sign-area{margin-top:60px;text-align:center;display:inline-block;border-top:1px solid #333;padding-top:5px;min-width:200px}
                @media print{
                    body{margin:${isKwitansi ? '0' : '10px'}}
                    ${isKwitansi ? '@page{size:landscape;margin:5mm}' : ''}
                }
            </style></head><body>${content.innerHTML}</body></html>`);
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); w.close(); }, 300);
    };

    // Pagination calculations
    const currentData = activeTab === 'kwitansi' ? transaksis : santris;
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const paginatedData = currentData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-white rounded-lg shadow p-1">
                {[
                    { key: 'kwitansi', label: 'Kwitansi', icon: 'fas fa-receipt' },
                    { key: 'surat_lunas', label: 'Surat Lunas', icon: 'fas fa-certificate' },
                    { key: 'kartu', label: 'Kartu Pembayaran', icon: 'fas fa-id-card' },
                ].map(tab => (
                    <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); setPrintData(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                        <i className={tab.icon}></i>{tab.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <label className="block mb-1 text-xs font-medium text-gray-700">
                            {activeTab === 'kwitansi' ? 'Cari Transaksi / Nama Santri' : 'Cari Nama Santri'}
                        </label>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ketik nama..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-40 text-gray-400"><i className="fas fa-spinner fa-spin mr-2"></i>Memuat...</div>
            ) : activeTab === 'kwitansi' ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-green-50 text-green-800">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">No</th>
                                    <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                                    <th className="px-4 py-3 text-left font-semibold">Nama Santri</th>
                                    <th className="px-4 py-3 text-left font-semibold">Item</th>
                                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                                    <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedData.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada transaksi</td></tr>
                                ) : paginatedData.map((t, idx) => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                        <td className="px-4 py-3 text-xs">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-4 py-3 font-medium">{t.santri?.nama}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{t.items?.map(i => i.nama).join(', ')}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-green-600">{formatIDR(t.total)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => handlePrintKwitansi(t)} className="text-green-600 hover:text-green-800 text-xs">
                                                <i className="fas fa-print mr-1"></i>Cetak
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {currentData.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={currentData.length}
                            itemsPerPage={itemsPerPage}
                            onLimitChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }}
                        />
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-green-50 text-green-800">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">No</th>
                                    <th className="px-4 py-3 text-left font-semibold">Nama</th>
                                    <th className="px-4 py-3 text-left font-semibold">Lembaga</th>
                                    <th className="px-4 py-3 text-left font-semibold">Kelas</th>
                                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                                    <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedData.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
                                ) : paginatedData.map((s, idx) => {
                                    const total = (s.daftar_ulang || 0) + (s.syahriyah || 0) + (s.haflah || 0) + (s.seragam || 0) + (s.study_tour || 0) + (s.sekolah || 0) + (s.kartu_santri || 0);
                                    const lunas = total <= 0;
                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                            <td className="px-4 py-3 font-medium">{s.nama}</td>
                                            <td className="px-4 py-3">{s.lembaga}</td>
                                            <td className="px-4 py-3">{s.kelas}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${lunas ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {lunas ? 'Lunas' : 'Nunggak'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {activeTab === 'surat_lunas' ? (
                                                    <button onClick={() => handlePrintSuratLunas(s)}
                                                        className={`text-xs ${lunas ? 'text-green-600 hover:text-green-800' : 'text-gray-400 cursor-not-allowed'}`}
                                                        disabled={!lunas}>
                                                        <i className="fas fa-print mr-1"></i>Cetak Surat
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handlePrintKartu(s)} className="text-green-600 hover:text-green-800 text-xs">
                                                        <i className="fas fa-print mr-1"></i>Cetak Kartu
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {currentData.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={currentData.length}
                            itemsPerPage={itemsPerPage}
                            onLimitChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }}
                        />
                    )}
                </div>
            )}

            {/* Print Preview Modal */}
            <Modal isOpen={showPrintModal} onClose={closePrintModal} maxWidth={printType === 'kwitansi' ? 'max-w-5xl' : 'max-w-2xl'}>
                {printLoading ? (
                    <div className="modal-loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Memuat preview cetak...</span>
                    </div>
                ) : printData ? (
                    <>
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800"><i className="fas fa-print mr-2 text-green-600"></i>Preview Cetak</h3>
                            <div className="flex gap-2">
                                <button onClick={doPrint} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                                    <i className="fas fa-print mr-1"></i>Cetak
                                </button>
                                <button onClick={closePrintModal} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times fa-lg"></i></button>
                            </div>
                        </div>
                        <div className="p-6" ref={printRef}>
                            {printType === 'kwitansi' && <KwitansiPreview data={printData} />}
                            {printType === 'surat_lunas' && <SuratLunasPreview data={printData} />}
                            {printType === 'kartu' && <KartuPreview data={printData} />}
                        </div>
                    </>
                ) : null}
            </Modal>
        </>
    );
}

const BULAN_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function KwitansiPreview({ data }) {
    const tgl = new Date(data.transaksi.tanggal);
    const tglStr = tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const noKwt = `KWT-${tgl.getFullYear()}-${String(data.transaksi.id).padStart(4, '0')}`;
    const qrValue = `pembayaran.ponpes.id/verify/${data.transaksi.id}`;

    // Group items by type for checkboxes
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

    // Terbilang
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

    const s = { // shared styles
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

            {/* QR Code Panel */}
            <div style={s.qrPanel}>
                <div style={s.qrHeader}>BARCODE DETAIL<br />PEMBAYARAN</div>
                <QRCodeSVG value={qrValue} size={150} level="M" />
                <div style={s.qrUrl}>pembayaran.ponpes.id</div>
                <div style={s.qrNote}>Barcode ini digunakan untuk pengecekan detail pembayaran administrasi Pondok atau Sekolah</div>
            </div>

            {/* Main Content */}
            <div style={s.mainPanel}>
                {/* Header */}
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

                {/* No & Title Row */}
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ border: '1px solid #999', padding: '3px 12px', fontSize: '11px', fontWeight: '700' }}>NO. {noKwt}</div>
                </div>

                {/* Body */}
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
                <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
                    {/* Left body */}
                    <div style={{ flex: 1, fontSize: '12px' }}>
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

                    {/* Right body - date & signature */}
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

function SuratLunasPreview({ data }) {
    return (
        <div>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #16a34a', paddingBottom: '15px', marginBottom: '20px' }}>
                <h1 style={{ color: '#166534', margin: 0, fontSize: '18px' }}>SURAT KETERANGAN LUNAS</h1>
                <p style={{ margin: '3px 0', fontSize: '12px', color: '#666' }}>Pondok Pesantren Nurul Huda An-Najjah</p>
                <p style={{ margin: '3px 0', fontSize: '11px', color: '#999' }}>No. SKL/{new Date().getFullYear()}/{String(data.santri.id).padStart(4, '0')}</p>
            </div>
            <p style={{ fontSize: '12px', lineHeight: '1.8' }}>
                Yang bertanda tangan di bawah ini, Pimpinan Pondok Pesantren Nurul Huda An-Najjah, dengan ini menerangkan bahwa:
            </p>
            <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '15px', margin: '15px 0', fontSize: '12px' }}>
                <table style={{ border: 'none' }}>
                    <tbody>
                        <tr><td style={{ border: 'none', padding: '4px 10px 4px 0', fontWeight: '600' }}>Nama</td><td style={{ border: 'none', padding: '4px' }}>: {data.santri.nama}</td></tr>
                        <tr><td style={{ border: 'none', padding: '4px 10px 4px 0', fontWeight: '600' }}>Lembaga</td><td style={{ border: 'none', padding: '4px' }}>: {data.santri.lembaga}</td></tr>
                        <tr><td style={{ border: 'none', padding: '4px 10px 4px 0', fontWeight: '600' }}>Kelas</td><td style={{ border: 'none', padding: '4px' }}>: {data.santri.kelas}</td></tr>
                        <tr><td style={{ border: 'none', padding: '4px 10px 4px 0', fontWeight: '600' }}>Total Dibayar</td><td style={{ border: 'none', padding: '4px' }}>: {formatIDR(data.total_dibayar)}</td></tr>
                    </tbody>
                </table>
            </div>
            <p style={{ fontSize: '12px', lineHeight: '1.8' }}>
                Telah <strong>MELUNASI</strong> seluruh kewajiban pembayaran pada Pondok Pesantren Nurul Huda An-Najjah.
                Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
            </p>
            <div style={{ marginTop: '40px', textAlign: 'right', fontSize: '12px' }}>
                <p>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p style={{ marginTop: '5px' }}>Pimpinan Pondok Pesantren</p>
                <div style={{ marginTop: '60px', display: 'inline-block', borderTop: '1px solid #333', paddingTop: '5px', minWidth: '200px' }}>
                    (......................................)
                </div>
            </div>
        </div>
    );
}

function KartuPreview({ data }) {
    return (
        <div>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #16a34a', paddingBottom: '15px', marginBottom: '20px' }}>
                <h1 style={{ color: '#166534', margin: 0, fontSize: '18px' }}>KARTU PEMBAYARAN SANTRI</h1>
                <p style={{ margin: '3px 0', fontSize: '12px', color: '#666' }}>Pondok Pesantren Nurul Huda An-Najjah</p>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '15px', margin: '15px 0', fontSize: '12px' }}>
                <div><strong>Nama:</strong> {data.santri.nama}</div>
                <div><strong>Lembaga:</strong> {data.santri.lembaga} · Kelas: {data.santri.kelas}</div>
            </div>
            <h3 style={{ fontSize: '14px', color: '#166534', marginTop: '20px' }}>Status Tagihan</h3>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0' }}>
                    <thead>
                        <tr style={{ background: '#f0fdf4' }}>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', color: '#166534', fontSize: '12px' }}>Jenis</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', color: '#166534', fontSize: '12px' }}>Sisa</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', color: '#166534', fontSize: '12px' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>{item.jenis}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px', textAlign: 'right' }}>{item.lunas ? '-' : formatIDR(item.sisa)}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px', textAlign: 'center' }}>
                                    <span style={{ background: item.lunas ? '#dcfce7' : '#fef2f2', color: item.lunas ? '#166534' : '#dc2626', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600' }}>
                                        {item.lunas ? '✓ Lunas' : '✗ Belum'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {data.riwayat.length > 0 && (
                <>
                    <h3 style={{ fontSize: '14px', color: '#166534', marginTop: '20px' }}>Riwayat Pembayaran</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0' }}>
                            <thead>
                                <tr style={{ background: '#f0fdf4' }}>
                                    <th style={{ border: '1px solid #ddd', padding: '6px', fontSize: '11px', color: '#166534' }}>Tanggal</th>
                                    <th style={{ border: '1px solid #ddd', padding: '6px', fontSize: '11px', color: '#166534' }}>Item</th>
                                    <th style={{ border: '1px solid #ddd', padding: '6px', fontSize: '11px', color: '#166534', textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.riwayat.slice(0, 15).map((r, idx) => (
                                    <tr key={idx}>
                                        <td style={{ border: '1px solid #ddd', padding: '6px', fontSize: '11px' }}>{new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '6px', fontSize: '11px' }}>{r.items.map(i => i.nama).join(', ')}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '6px', fontSize: '11px', textAlign: 'right' }}>{formatIDR(r.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

export default CetakDokumen;
