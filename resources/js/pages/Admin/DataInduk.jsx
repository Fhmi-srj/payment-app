import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE, authFetch } from '../../config/api';
import Swal from 'sweetalert2';
import Modal from '../../components/Modal';
import Pagination, { ITEMS_PER_PAGE_DEFAULT } from '../../components/Pagination';

const moneyFields = ['daftar_ulang', 'syahriyah', 'haflah', 'seragam', 'study_tour', 'kartu_santri'];
const moneyLabels = { daftar_ulang: 'Daftar Ulang', syahriyah: 'Syahriyah', haflah: 'Haflah', seragam: 'Seragam', study_tour: 'Study Tour', kartu_santri: 'Kartu Santri' };
const BULAN_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];



function DataInduk() {
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [sortCol, setSortCol] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterLembaga, setFilterLembaga] = useState('');
    const [filterYayasan, setFilterYayasan] = useState('');
    const [filterKelas, setFilterKelas] = useState('');
    const [filterJenisKelamin, setFilterJenisKelamin] = useState('');
    
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const [showLembagaFilter, setShowLembagaFilter] = useState(false);
    const [showYayasanFilter, setShowYayasanFilter] = useState(false);
    const [showKelasFilter, setShowKelasFilter] = useState(false);
    const [showJkFilter, setShowJkFilter] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [expandSyahriyahCols, setExpandSyahriyahCols] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [editItem, setEditItem] = useState(null);
    const importRef = useRef(null);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_DEFAULT);

    const loadData = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterLembaga) params.append('lembaga', filterLembaga);
            if (filterYayasan) params.append('yayasan', filterYayasan);
            if (filterKelas) params.append('kelas', filterKelas);
            if (filterJenisKelamin) params.append('jenis_kelamin', filterJenisKelamin);
            if (filterStatus) params.append('status', filterStatus);
            if (sortCol) { params.append('sort_by', sortCol); params.append('sort_dir', sortDir); }
            if (expandSyahriyahCols) params.append('include_syahriyah_detail', '1');
            const res = await authFetch(`${API_BASE}/santri?${params}`);
            const json = await res.json();
            setData(json.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [search, filterLembaga, filterYayasan, filterKelas, filterJenisKelamin, filterStatus, sortCol, sortDir, expandSyahriyahCols]);

    useEffect(() => { loadData(); }, [loadData]);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [search, filterLembaga, filterYayasan, filterKelas, filterJenisKelamin, filterStatus]);

    // Pagination calculations
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = data.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const formatRupiah = (num) => num ? 'Rp' + parseInt(num).toLocaleString('id-ID') : '-';

    const handleSort = (col) => {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('asc'); }
    };

    const sortIcon = (col) => {
        if (sortCol === col) return sortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        return 'fas fa-sort';
    };

    const toggleExpand = (idx) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            next.has(idx) ? next.delete(idx) : next.add(idx);
            return next;
        });
    };

    const openModal = (mode, item = null) => {
        setModalMode(mode);
        setEditItem(item || { lembaga: 'MTS', nama: '', kelas: '', alamat: '', daftar_ulang: 0, syahriyah: 0, haflah: 0, seragam: 0, study_tour: 0, kartu_santri: 0, nis: '', ttl: '', jenis_kelamin: '', agama: '', no_hp: '', tahun_masuk: '', ayah: '', ibu: '', kerja_ayah: '', kerja_ibu: '', yayasan: 'Simbangkulon', status: 'AKTIF' });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const body = {};
        for (const [k, v] of fd.entries()) body[k] = moneyFields.includes(k) ? (+v || 0) : v;
        try {
            const url = modalMode === 'add' ? `${API_BASE}/santri` : `${API_BASE}/santri/${editItem.id}`;
            const method = modalMode === 'add' ? 'POST' : 'PUT';
            await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            setModalOpen(false);
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (item) => {
        const result = await Swal.fire({
            title: 'Hapus Data?', html: `Apakah Anda yakin ingin menghapus data santri <strong>${item.nama}</strong>?`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
            confirmButtonText: '<i class="fas fa-trash-alt mr-1"></i> Ya, Hapus!', cancelButtonText: '<i class="fas fa-times mr-1"></i> Batal', reverseButtons: true
        });
        if (result.isConfirmed) {
            await authFetch(`${API_BASE}/santri/${item.id}`, { method: 'DELETE' });
            loadData();
            Swal.fire({ title: 'Terhapus!', text: 'Data santri berhasil dihapus.', icon: 'success', timer: 1500, showConfirmButton: false });
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await authFetch(`${API_BASE}/santri/import`, { method: 'POST', body: fd });
            const json = await res.json();
            Swal.fire({ title: 'Berhasil!', html: `<strong>${json.count || 0}</strong> data santri berhasil diimport.`, icon: 'success', confirmButtonColor: '#16a34a' });
            loadData();
        } catch (e) { Swal.fire({ title: 'Gagal!', text: 'Import gagal.', icon: 'error' }); }
        e.target.value = null;
    };

    const handleExport = () => {
        const token = localStorage.getItem('auth_token');
        const params = new URLSearchParams();
        params.append('token', token);
        if (search) params.append('search', search);
        if (filterLembaga) params.append('lembaga', filterLembaga);
        if (filterYayasan) params.append('yayasan', filterYayasan);
        if (filterKelas) params.append('kelas', filterKelas);
        if (filterJenisKelamin) params.append('jenis_kelamin', filterJenisKelamin);
        if (filterStatus) params.append('status', filterStatus);
        if (sortCol) { params.append('sort_by', sortCol); params.append('sort_dir', sortDir); }
        window.open(`${API_BASE}/santri/export?${params.toString()}`, '_blank');
    };

    // Bulk Actions
    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedData.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(paginatedData.map(d => d.id)));
    };
    const toggleSelectOne = (id) => {
        setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
    };
    const handleBulkDelete = async () => {
        const count = selectedIds.size;
        const { isConfirmed } = await Swal.fire({ title: `Hapus ${count} santri?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Ya, Hapus!' });
        if (!isConfirmed) return;
        try {
            await authFetch(`${API_BASE}/santri/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [...selectedIds] }) });
            Swal.fire({ icon: 'success', title: `${count} santri dihapus!`, timer: 1500, showConfirmButton: false });
            setSelectedIds(new Set()); loadData();
        } catch (e) { Swal.fire({ icon: 'error', title: 'Gagal', text: 'Bulk delete gagal' }); }
    };
    const handleBulkStatus = async (status) => {
        try {
            await authFetch(`${API_BASE}/santri/bulk-status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [...selectedIds], status }) });
            Swal.fire({ icon: 'success', title: `${selectedIds.size} santri diubah ke ${status}!`, timer: 1500, showConfirmButton: false });
            setSelectedIds(new Set()); loadData();
        } catch (e) { Swal.fire({ icon: 'error', title: 'Gagal', text: 'Bulk update gagal' }); }
    };

    const renderStatusBullet = (status) => {
        if (!status) return '-';
        const isAktif = status.toUpperCase() === 'AKTIF';
        return (
            <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${isAktif ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                <span className={`w-2 h-2 rounded-full inline-block ${isAktif ? 'bg-[#16a34a]' : 'bg-[#dc2626]'}`}></span>
                {status}
            </span>
        );
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <>

            <section className="tab-content flex flex-col flex-grow max-w-full overflow-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                    <div className="flex items-center w-full md:w-1/3 border border-[#d1d5db] rounded-md px-3 py-1 text-[12px] text-[#4a4a4a] focus-within:ring-1 focus-within:ring-green-400 focus-within:border-green-400">
                        <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari data santri..." className="w-full border-none focus:ring-0 focus:outline-none bg-transparent" />
                    </div>
                    <div className="flex gap-2 flex-wrap md:flex-nowrap w-full md:w-auto justify-between md:justify-start">
                        <button onClick={() => importRef.current?.click()} className="bg-green-700 text-white text-[12px] font-semibold px-2 py-1 rounded-md hover:bg-green-800 transition select-none flex items-center gap-2 flex-1 md:flex-none">
                            <i className="fas fa-file-import"></i> Import Excel
                        </button>
                        <button onClick={handleExport} className="bg-green-700 text-white text-[12px] font-semibold px-2 py-1 rounded-md hover:bg-green-800 transition select-none flex items-center gap-2 flex-1 md:flex-none">
                            <i className="fas fa-file-export"></i> Export Excel
                        </button>
                        <button onClick={() => openModal('add')} className="bg-green-700 text-white text-[12px] font-semibold px-2 py-1 rounded-md hover:bg-green-800 transition select-none flex items-center gap-2 flex-1 md:flex-none">
                            <i className="fas fa-plus"></i> Tambah Data
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto scrollbar-hide max-w-full">
                        <table className="w-full text-[12px] text-[#4a4a4a] border-separate border-spacing-y-[2px] min-w-max" id="table-induk">
                            <thead>
                                <tr className="text-left text-[#6b7280] select-none">
                                    <th className="px-2 py-3 w-8" style={{ position: 'sticky', left: 0, zIndex: 2, background: '#fff' }}><input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === paginatedData.length} onChange={toggleSelectAll} className="accent-green-600" /></th>
                                    <th className="select-none px-3 py-3 whitespace-nowrap" style={{ position: 'sticky', left: 32, zIndex: 2, background: '#fff' }}>No</th>
                                    {isMobile && <th className="select-none px-2 py-3"></th>}
                                    <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('nama')} style={{ position: 'sticky', left: 72, zIndex: 2, background: '#fff', borderRight: '2px solid #e5e7eb' }}>
                                        <div className="flex items-center"><span>Nama</span><i className={`${sortIcon('nama')} text-green-700 ml-1`}></i></div>
                                    </th>
                                    {!isMobile && <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('nis')}>
                                        <div className="flex items-center"><span>NIS</span><i className={`${sortIcon('nis')} text-green-700 ml-1`}></i></div>
                                    </th>}
                                    {!isMobile && <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('lembaga')}>
                                        <div className="flex items-center select-none">
                                            <span>Lembaga</span>
                                            <i className={`${sortIcon('lembaga')} text-green-700 ml-1`}></i>
                                            <div className="filter-dropdown ml-2 relative inline-block">
                                                <i className="fas fa-filter filter-icon text-[#15803d] cursor-pointer ml-1" onClick={(e) => { e.stopPropagation(); setShowLembagaFilter(!showLembagaFilter); setShowStatusFilter(false); setShowYayasanFilter(false); setShowKelasFilter(false); setShowJkFilter(false); }}></i>
                                                {showLembagaFilter && (
                                                    <div className="absolute bg-white min-w-[120px] shadow-lg p-2 z-50 rounded-md border border-[#d1d5db]" onClick={e => e.stopPropagation()}>
                                                        {[{ label: 'Semua', value: '' }, { label: 'MTS', value: 'MTS' }, { label: 'MA', value: 'MA' }].map(opt => (
                                                            <label key={opt.value} className="flex items-center gap-2 cursor-pointer mb-1">
                                                                <input type="radio" name="filter-lembaga" value={opt.value} checked={filterLembaga === opt.value}
                                                                    onChange={() => { setFilterLembaga(opt.value); setShowLembagaFilter(false); }} />
                                                                <span>{opt.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </th>}
                                    {!isMobile && <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('yayasan')}>
                                        <div className="flex items-center select-none">
                                            <span>Yayasan</span>
                                            <i className={`${sortIcon('yayasan')} text-green-700 ml-1`}></i>
                                            <div className="filter-dropdown ml-2 relative inline-block">
                                                <i className="fas fa-filter filter-icon text-[#15803d] cursor-pointer ml-1" onClick={(e) => { e.stopPropagation(); setShowYayasanFilter(!showYayasanFilter); setShowLembagaFilter(false); setShowStatusFilter(false); setShowKelasFilter(false); setShowJkFilter(false); }}></i>
                                                {showYayasanFilter && (
                                                    <div className="absolute bg-white min-w-[150px] shadow-lg p-2 z-50 rounded-md border border-[#d1d5db]" onClick={e => e.stopPropagation()}>
                                                        {[{ label: 'Semua', value: '' }, { label: 'Simbangkulon', value: 'Simbangkulon' }, { label: 'Non-Simbangkulon', value: 'Non-Simbangkulon' }].map(opt => (
                                                            <label key={opt.value} className="flex items-center gap-2 cursor-pointer mb-1">
                                                                <input type="radio" name="filter-yayasan" value={opt.value} checked={filterYayasan === opt.value}
                                                                    onChange={() => { setFilterYayasan(opt.value); setShowYayasanFilter(false); }} />
                                                                <span>{opt.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </th>}
                                    {!isMobile && <>
                                        <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('kelas')}>
                                            <div className="flex items-center select-none">
                                                <span>Kelas</span>
                                                <i className={`${sortIcon('kelas')} text-green-700 ml-1`}></i>
                                                <div className="filter-dropdown ml-2 relative inline-block">
                                                    <i className="fas fa-filter filter-icon text-[#15803d] cursor-pointer ml-1" onClick={(e) => { e.stopPropagation(); setShowKelasFilter(!showKelasFilter); setShowLembagaFilter(false); setShowYayasanFilter(false); setShowStatusFilter(false); setShowJkFilter(false); }}></i>
                                                    {showKelasFilter && (
                                                        <div className="absolute bg-white min-w-[120px] shadow-lg p-2 z-50 rounded-md border border-[#d1d5db]" onClick={e => e.stopPropagation()}>
                                                            {[{ label: 'Semua', value: '' }, { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }].map(opt => (
                                                                <label key={opt.value} className="flex items-center gap-2 cursor-pointer mb-1">
                                                                    <input type="radio" name="filter-kelas" value={opt.value} checked={filterKelas === opt.value}
                                                                        onChange={() => { setFilterKelas(opt.value); setShowKelasFilter(false); }} />
                                                                    <span>{opt.label}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </th>
                                        <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('jenis_kelamin')}>
                                            <div className="flex items-center select-none">
                                                <span>Jenis Kelamin</span>
                                                <i className={`${sortIcon('jenis_kelamin')} text-green-700 ml-1`}></i>
                                                <div className="filter-dropdown ml-2 relative inline-block">
                                                    <i className="fas fa-filter filter-icon text-[#15803d] cursor-pointer ml-1" onClick={(e) => { e.stopPropagation(); setShowJkFilter(!showJkFilter); setShowKelasFilter(false); setShowLembagaFilter(false); setShowYayasanFilter(false); setShowStatusFilter(false); }}></i>
                                                    {showJkFilter && (
                                                        <div className="absolute bg-white min-w-[120px] shadow-lg p-2 z-50 rounded-md border border-[#d1d5db]" onClick={e => e.stopPropagation()}>
                                                            {[{ label: 'Semua', value: '' }, { label: 'Laki-laki', value: 'Laki-laki' }, { label: 'Perempuan', value: 'Perempuan' }].map(opt => (
                                                                <label key={opt.value} className="flex items-center gap-2 cursor-pointer mb-1">
                                                                    <input type="radio" name="filter-jk" value={opt.value} checked={filterJenisKelamin === opt.value}
                                                                        onChange={() => { setFilterJenisKelamin(opt.value); setShowJkFilter(false); }} />
                                                                    <span>{opt.label}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </th>
                                        {moneyFields.map(f => (
                                            <React.Fragment key={f}>
                                                <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => f === 'syahriyah' ? undefined : handleSort(f)}>
                                                    <div className="flex items-center">
                                                        <span>{moneyLabels[f]}</span>
                                                        {f !== 'syahriyah' && <i className={`${sortIcon(f)} text-green-700 ml-1`}></i>}
                                                        {f === 'syahriyah' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setExpandSyahriyahCols(!expandSyahriyahCols); }}
                                                                className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${expandSyahriyahCols ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                                                title={expandSyahriyahCols ? 'Tutup detail bulan' : 'Lihat detail per bulan'}
                                                            >
                                                                <i className={`fas fa-chevron-${expandSyahriyahCols ? 'left' : 'right'} text-[8px] mr-0.5`}></i>
                                                                {expandSyahriyahCols ? 'Tutup' : 'Detail'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </th>
                                                {f === 'syahriyah' && expandSyahriyahCols && BULAN_NAMES.map((bln, bi) => (
                                                    <th key={`syh-${bi}`} className="px-2 py-3 whitespace-nowrap text-center select-none" style={{ fontSize: '10px', minWidth: '55px' }}>
                                                        {bln}
                                                    </th>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                        <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('alamat')}><div className="flex items-center"><span>Alamat</span><i className={`${sortIcon('alamat')} text-green-700 ml-1`}></i></div></th>
                                        <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('ttl')}><div className="flex items-center"><span>TTL</span><i className={`${sortIcon('ttl')} text-green-700 ml-1`}></i></div></th>
                                        <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('agama')}><div className="flex items-center"><span>Agama</span><i className={`${sortIcon('agama')} text-green-700 ml-1`}></i></div></th>
                                        <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('no_hp')}><div className="flex items-center"><span>No HP</span><i className={`${sortIcon('no_hp')} text-green-700 ml-1`}></i></div></th>
                                        <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('tahun_masuk')}><div className="flex items-center"><span>Tahun Masuk</span><i className={`${sortIcon('tahun_masuk')} text-green-700 ml-1`}></i></div></th>
                                        <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('ayah')}><div className="flex items-center"><span>Ayah</span><i className={`${sortIcon('ayah')} text-green-700 ml-1`}></i></div></th>
                                        <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('ibu')}><div className="flex items-center"><span>Ibu</span><i className={`${sortIcon('ibu')} text-green-700 ml-1`}></i></div></th>
                                        <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('kerja_ayah')}><div className="flex items-center"><span>Kerja Ayah</span><i className={`${sortIcon('kerja_ayah')} text-green-700 ml-1`}></i></div></th>
                                        <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('kerja_ibu')}><div className="flex items-center"><span>Kerja Ibu</span><i className={`${sortIcon('kerja_ibu')} text-green-700 ml-1`}></i></div></th>
                                    </>}
                                    <th className="sortable select-none cursor-pointer px-3 py-3 whitespace-nowrap" onClick={() => handleSort('status')}>
                                        <div className="flex items-center select-none">
                                            <span>Status</span>
                                            <i className={`${sortIcon('status')} text-green-700 ml-1`}></i>
                                            <div className="filter-dropdown ml-2 relative inline-block">
                                                <i className="fas fa-filter filter-icon text-[#15803d] cursor-pointer ml-1" onClick={(e) => { e.stopPropagation(); setShowStatusFilter(!showStatusFilter); setShowLembagaFilter(false); setShowYayasanFilter(false); setShowKelasFilter(false); setShowJkFilter(false); }}></i>
                                                {showStatusFilter && (
                                                    <div className="absolute bg-white min-w-[120px] shadow-lg p-2 z-50 rounded-md border border-[#d1d5db]" onClick={e => e.stopPropagation()}>
                                                        {[{ label: 'Semua', value: '' }, { label: 'Aktif', value: 'AKTIF' }, { label: 'Tidak Aktif', value: 'TIDAK AKTIF' }].map(opt => (
                                                            <label key={opt.value} className="flex items-center gap-2 cursor-pointer mb-1">
                                                                <input type="radio" name="filter-status" value={opt.value} checked={filterStatus === opt.value}
                                                                    onChange={() => { setFilterStatus(opt.value); setShowStatusFilter(false); }} />
                                                                <span>{opt.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </th>
                                    <th className="text-center select-none px-3 py-3 whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={isMobile ? 6 : 24} className="text-center py-8 text-gray-400">Memuat...</td></tr>
                                ) : paginatedData.length === 0 ? (
                                    <tr><td colSpan={isMobile ? 6 : 24} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>
                                ) : paginatedData.map((item, idx) => (
                                    <React.Fragment key={item.id}>
                                        <tr className={`hover:bg-green-50 align-top ${selectedIds.has(item.id) ? 'bg-green-100' : 'bg-gray-50'}`}>
                                            <td className="px-2 py-3 align-middle" style={{ position: 'sticky', left: 0, zIndex: 1, background: selectedIds.has(item.id) ? '#dcfce7' : '#f9fafb' }}><input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelectOne(item.id)} className="accent-green-600" /></td>
                                            <td className="pl-4 pr-2 py-3 align-middle select-none" style={{ position: 'sticky', left: 32, zIndex: 1, background: selectedIds.has(item.id) ? '#dcfce7' : '#f9fafb' }}>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                            {isMobile && (
                                                <td className="py-2 px-2 align-middle select-none text-center cursor-pointer" onClick={() => toggleExpand(idx)}>
                                                    <i className={`fas fa-${expandedRows.has(idx) ? 'minus' : 'plus'} text-green-700`}></i>
                                                </td>
                                            )}
                                            <td className="px-3 py-3 align-middle select-none whitespace-nowrap" style={{ position: 'sticky', left: 72, zIndex: 1, background: selectedIds.has(item.id) ? '#dcfce7' : '#f9fafb', borderRight: '2px solid #e5e7eb' }}>{item.nama}</td>
                                            {!isMobile && <td className="px-3 py-3 align-middle select-none whitespace-nowrap">{item.nis || '-'}</td>}
                                            {!isMobile && <td className="px-3 py-3 align-middle select-none font-medium text-green-700 whitespace-nowrap">{item.lembaga}</td>}
                                            {!isMobile && <td className="px-3 py-3 align-middle select-none whitespace-nowrap">{item.yayasan || '-'}</td>}
                                            {!isMobile && <>
                                                <td className="px-3 py-3 align-middle select-none whitespace-nowrap">{item.kelas || '-'}</td>
                                                <td className="px-3 py-3 align-middle select-none whitespace-nowrap">{item.jenis_kelamin || '-'}</td>
                                                {moneyFields.map(f => (
                                                    <React.Fragment key={f}>
                                                        <td className="px-3 py-3 align-middle select-none text-right font-mono text-[11px] whitespace-nowrap">{formatRupiah(item[f])}</td>
                                                        {f === 'syahriyah' && expandSyahriyahCols && BULAN_NAMES.map((_, bi) => {
                                                            const bulanData = item.syahriyah_bulan?.[bi];
                                                            const isLunas = bulanData?.lunas;
                                                            return (
                                                                <td key={`syh-${bi}`} className={`px-2 py-3 align-middle text-center text-[10px] font-medium whitespace-nowrap ${isLunas ? 'text-green-600' : 'text-red-500'}`}>
                                                                    {bulanData ? (isLunas ? '✓' : formatRupiah(bulanData.sisa)) : '-'}
                                                                </td>
                                                            );
                                                        })}
                                                    </React.Fragment>
                                                ))}
                                                <td className="px-3 py-3 align-middle select-none" title={item.alamat || ''}>
                                                    <div className="max-w-[150px] truncate">{item.alamat || '-'}</div>
                                                </td>
                                                <td className="px-3 py-3 align-middle select-none whitespace-nowrap">{item.ttl || '-'}</td>
                                                <td className="px-3 py-3 align-middle select-none whitespace-nowrap">{item.agama || '-'}</td>
                                                <td className="px-3 py-3 align-middle select-none whitespace-nowrap">{item.no_hp || '-'}</td>
                                                <td className="px-3 py-3 align-middle select-none whitespace-nowrap">{item.tahun_masuk || '-'}</td>
                                                <td className="px-3 py-3 align-middle select-none whitespace-nowrap">{item.ayah || '-'}</td>
                                                <td className="px-3 py-3 align-middle select-none whitespace-nowrap">{item.ibu || '-'}</td>
                                                <td className="px-3 py-3 align-middle select-none whitespace-nowrap">{item.kerja_ayah || '-'}</td>
                                                <td className="px-3 py-3 align-middle select-none whitespace-nowrap">{item.kerja_ibu || '-'}</td>
                                            </>}
                                            <td className="px-3 py-3 align-middle select-none text-[11px] whitespace-nowrap">{renderStatusBullet(item.status)}</td>
                                            <td className="px-3 py-3 align-middle text-center select-none whitespace-nowrap">
                                                <button onClick={() => openModal('edit', item)} className="text-green-700 hover:text-green-900 mr-2"><i className="fas fa-edit"></i></button>
                                                <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-800"><i className="fas fa-trash-alt"></i></button>
                                            </td>
                                        </tr>
                                        {isMobile && expandedRows.has(idx) && (
                                            <tr className="bg-white">
                                                <td colSpan={5} className="p-3 border border-t-0 border-gray-300 text-[11px] text-gray-700">
                                                    <div className="grid grid-cols-2 gap-1">
                                                        <div><strong>NIS:</strong> {item.nis || '-'}</div>
                                                        <div><strong>Lembaga:</strong> {item.lembaga}</div>
                                                        <div><strong>Kelas:</strong> {item.kelas}</div>
                                                        {moneyFields.map(f => (
                                                            <div key={f}><strong>{moneyLabels[f]}:</strong> {formatRupiah(item[f])}</div>
                                                        ))}
                                                        <div className="col-span-2"><strong>Alamat:</strong> {item.alamat || '-'}</div>
                                                        <div><strong>TTL:</strong> {item.ttl || '-'}</div>
                                                        <div><strong>Jenis Kelamin:</strong> {item.jenis_kelamin || '-'}</div>
                                                        <div><strong>Agama:</strong> {item.agama || '-'}</div>
                                                        <div><strong>No HP:</strong> {item.no_hp || '-'}</div>
                                                        <div><strong>Tahun Masuk:</strong> {item.tahun_masuk || '-'}</div>
                                                        <div><strong>Ayah:</strong> {item.ayah || '-'}</div>
                                                        <div><strong>Ibu:</strong> {item.ibu || '-'}</div>
                                                        <div><strong>Kerja Ayah:</strong> {item.kerja_ayah || '-'}</div>
                                                        <div><strong>Kerja Ibu:</strong> {item.kerja_ibu || '-'}</div>
                                                        <div><strong>Yayasan:</strong> {item.yayasan || '-'}</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {!loading && data.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={data.length}
                            itemsPerPage={itemsPerPage}
                            onLimitChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }}
                        />
                    )}
                </div>

                {/* Bulk Action Floating Bar */}
                {selectedIds.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-slide-up">
                        <span className="text-sm font-medium">{selectedIds.size} dipilih</span>
                        <div className="w-px h-6 bg-gray-600"></div>
                        <button onClick={() => handleBulkStatus('AKTIF')} className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition"><i className="fas fa-check mr-1"></i>Set Aktif</button>
                        <button onClick={() => handleBulkStatus('TIDAK AKTIF')} className="text-xs bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg transition"><i className="fas fa-ban mr-1"></i>Set Nonaktif</button>
                        <button onClick={handleBulkDelete} className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition"><i className="fas fa-trash mr-1"></i>Hapus</button>
                        <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-300 hover:text-white transition"><i className="fas fa-times mr-1"></i>Batal</button>
                    </div>
                )}
            </section>

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-4xl">
                <div className="p-6 relative">
                    <button onClick={() => setModalOpen(false)} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 focus:outline-none">
                        <i className="fas fa-times fa-lg"></i>
                    </button>
                    <h3 className="text-lg font-semibold text-[#1f2937] mb-4 select-none">{modalMode === 'add' ? 'Tambah Data Santri' : 'Ubah Data Santri'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">Lembaga</label>
                                <select name="lembaga" defaultValue={editItem?.lembaga || 'MTS'} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400">
                                    <option value="MTS">MTS</option>
                                    <option value="MA">MA</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">Nama</label>
                                <input type="text" name="nama" defaultValue={editItem?.nama || ''} required className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400" />
                            </div>
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">Kelas</label>
                                <input type="text" name="kelas" defaultValue={editItem?.kelas || ''} required className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400" />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">Alamat</label>
                                <textarea name="alamat" rows={2} defaultValue={editItem?.alamat || ''} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400"></textarea>
                            </div>
                            {moneyFields.map(f => (
                                <div key={f}>
                                    <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">{moneyLabels[f]}</label>
                                    <input type="number" name={f} defaultValue={editItem?.[f] || 0} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400" />
                                </div>
                            ))}
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">NIS</label>
                                <input type="text" name="nis" defaultValue={editItem?.nis || ''} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400" />
                            </div>
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">TTL</label>
                                <input type="text" name="ttl" defaultValue={editItem?.ttl || ''} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400" />
                            </div>
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">Jenis Kelamin</label>
                                <select name="jenis_kelamin" defaultValue={editItem?.jenis_kelamin || ''} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400">
                                    <option value="">-</option>
                                    <option value="Laki-laki">Laki-laki</option>
                                    <option value="Perempuan">Perempuan</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">Agama</label>
                                <input type="text" name="agama" defaultValue={editItem?.agama || ''} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400" />
                            </div>
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">No HP</label>
                                <input type="text" name="no_hp" defaultValue={editItem?.no_hp || ''} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400" />
                            </div>
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">Tahun Masuk</label>
                                <input type="text" name="tahun_masuk" defaultValue={editItem?.tahun_masuk || ''} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400" />
                            </div>
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">Ayah</label>
                                <input type="text" name="ayah" defaultValue={editItem?.ayah || ''} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400" />
                            </div>
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">Ibu</label>
                                <input type="text" name="ibu" defaultValue={editItem?.ibu || ''} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400" />
                            </div>
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">Kerja Ayah</label>
                                <input type="text" name="kerja_ayah" defaultValue={editItem?.kerja_ayah || ''} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400" />
                            </div>
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">Kerja Ibu</label>
                                <input type="text" name="kerja_ibu" defaultValue={editItem?.kerja_ibu || ''} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400" />
                            </div>
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">Yayasan</label>
                                <select name="yayasan" defaultValue={editItem?.yayasan || 'Simbangkulon'} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400">
                                    <option value="Simbangkulon">Simbangkulon</option>
                                    <option value="Non-Simbangkulon">Non-Simbangkulon</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-semibold text-[#1f2937] text-[13px] mb-1 select-none">Status</label>
                                <select name="status" defaultValue={editItem?.status || 'AKTIF'} className="w-full rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400">
                                    <option value="AKTIF">Aktif</option>
                                    <option value="TIDAK AKTIF">Tidak Aktif</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded border border-green-600 text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400">Batal</button>
                            <button type="submit" className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-400">Simpan</button>
                        </div>
                    </form>
                </div>
            </Modal>

            <input type="file" accept=".xlsx,.xls" className="hidden" ref={importRef} onChange={handleImport} />
        </>
    );
}

export default DataInduk;
