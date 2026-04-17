import React, { useState, useEffect } from 'react';
import { API_BASE, authFetch } from '../../config/api';
import { useTahunAjaran } from '../../contexts/TahunAjaranContext';
import Swal from 'sweetalert2';

const defaultTagihan = [
    { key: 'daftar_ulang', label: 'Daftar Ulang', icon: 'fas fa-file-signature' },
    { key: 'syahriyah', label: 'Syahriyah', icon: 'fas fa-calendar-alt' },
    { key: 'haflah', label: 'Haflah', icon: 'fas fa-star' },
    { key: 'seragam', label: 'Seragam', icon: 'fas fa-tshirt' },
    { key: 'study_tour', label: 'Study Tour', icon: 'fas fa-bus' },
    { key: 'sekolah', label: 'Sekolah', icon: 'fas fa-school' },
    { key: 'kartu_santri', label: 'Kartu Santri', icon: 'fas fa-id-card' },
];

const lembagaOptions = ['MA ALHIKAM', 'ITS'];

function Pengaturan() {
    const [activeTab, setActiveTab] = useState('tahun-ajaran');

    return (
        <>

            {/* Tab Navigation */}
            <div className="flex gap-1 mb-4 bg-white rounded-lg shadow p-1 overflow-x-auto">
                {[
                    { key: 'tahun-ajaran', label: 'Tahun Ajaran', icon: 'fas fa-calendar' },
                    { key: 'profil', label: 'Profil Pondok', icon: 'fas fa-mosque' },
                    { key: 'tagihan', label: 'Jenis Tagihan', icon: 'fas fa-list' },
                    { key: 'lembaga', label: 'Lembaga', icon: 'fas fa-building' },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                        <i className={tab.icon}></i>{tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'tahun-ajaran' && <TahunAjaranTab />}
            {activeTab === 'profil' && <ProfilPondok />}
            {activeTab === 'tagihan' && <JenisTagihan />}
            {activeTab === 'lembaga' && <DaftarLembaga />}
        </>
    );
}

function TahunAjaranTab() {
    const { tahunAjarans, fetchAll } = useTahunAjaran();
    const [namaBaru, setNamaBaru] = useState('');
    const [adding, setAdding] = useState(false);

    const handleAdd = async () => {
        if (!namaBaru.trim()) return;
        setAdding(true);
        try {
            const res = await authFetch(`${API_BASE}/tahun-ajaran`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama: namaBaru.trim() }),
            });
            const json = await res.json();
            if (json.success) {
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: json.message, timer: 1500, showConfirmButton: false });
                setNamaBaru('');
                fetchAll();
            } else {
                Swal.fire({ icon: 'error', title: 'Gagal', text: json.message || 'Gagal menambahkan' });
            }
        } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menambahkan tahun ajaran' }); }
        finally { setAdding(false); }
    };

    const handleSetActive = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: 'Aktifkan Tahun Ajaran?', text: 'Tahun ajaran lain akan dinonaktifkan.',
            icon: 'question', showCancelButton: true, confirmButtonColor: '#16a34a', confirmButtonText: 'Ya, Aktifkan',
        });
        if (!isConfirmed) return;
        try {
            const res = await authFetch(`${API_BASE}/tahun-ajaran/${id}/set-active`, { method: 'POST' });
            const json = await res.json();
            if (json.success) {
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: json.message, timer: 1500, showConfirmButton: false });
                fetchAll();
            }
        } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal mengaktifkan' }); }
    };

    const handleDelete = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: 'Hapus Tahun Ajaran?', text: 'Data terkait tetap tersimpan.',
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus',
        });
        if (!isConfirmed) return;
        try {
            const res = await authFetch(`${API_BASE}/tahun-ajaran/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                Swal.fire({ icon: 'success', title: 'Dihapus!', timer: 1500, showConfirmButton: false });
                fetchAll();
            } else {
                Swal.fire({ icon: 'error', title: 'Gagal', text: json.message });
            }
        } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menghapus' }); }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4"><i className="fas fa-calendar mr-2 text-green-600"></i>Manajemen Tahun Ajaran</h2>
            <p className="text-xs text-gray-500 mb-4">Kelola tahun ajaran untuk memisahkan data santri dan transaksi per periode.</p>

            {/* Add Form */}
            <div className="flex gap-2 mb-6">
                <input type="text" value={namaBaru} onChange={e => setNamaBaru(e.target.value)}
                    placeholder="Contoh: 2024/2025" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <button onClick={handleAdd} disabled={adding} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                    <i className="fas fa-plus mr-1"></i>Tambah
                </button>
            </div>

            {/* List */}
            <div className="space-y-2">
                {tahunAjarans.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">Belum ada tahun ajaran. Tambahkan yang pertama!</p>
                ) : tahunAjarans.map(ta => (
                    <div key={ta.id} className={`flex items-center justify-between p-4 rounded-lg border ${ta.is_active ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ta.is_active ? 'bg-green-200' : 'bg-gray-200'}`}>
                                <i className={`fas fa-calendar-alt ${ta.is_active ? 'text-green-700' : 'text-gray-500'}`}></i>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-800">{ta.nama}</div>
                                {ta.is_active && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 mt-0.5">
                                        <i className="fas fa-check-circle mr-1 text-[8px]"></i>Aktif
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {!ta.is_active && (
                                <>
                                    <button onClick={() => handleSetActive(ta.id)} className="px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-lg hover:bg-green-200" title="Aktifkan">
                                        <i className="fas fa-check mr-1"></i>Aktifkan
                                    </button>
                                    <button onClick={() => handleDelete(ta.id)} className="px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200" title="Hapus">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProfilPondok() {
    const [profil, setProfil] = useState({
        nama_pondok: 'Pondok Pesantren Nurul Huda An-Najjah',
        alamat: '', telepon: '', email: '', nama_pimpinan: '',
    });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const savedProfil = localStorage.getItem('profil_pondok');
        if (savedProfil) setProfil(JSON.parse(savedProfil));
    }, []);

    const handleSave = () => {
        localStorage.setItem('profil_pondok', JSON.stringify(profil));
        setSaved(true);
        Swal.fire({ icon: 'success', title: 'Profil disimpan!', timer: 1500, showConfirmButton: false });
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4"><i className="fas fa-mosque mr-2 text-green-600"></i>Profil Pondok Pesantren</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pondok</label>
                    <input type="text" value={profil.nama_pondok} onChange={e => setProfil({ ...profil, nama_pondok: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pimpinan</label>
                    <input type="text" value={profil.nama_pimpinan} onChange={e => setProfil({ ...profil, nama_pimpinan: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                    <textarea value={profil.alamat} onChange={e => setProfil({ ...profil, alamat: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" rows={2} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                    <input type="text" value={profil.telepon} onChange={e => setProfil({ ...profil, telepon: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={profil.email} onChange={e => setProfil({ ...profil, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
            </div>
            <div className="flex justify-end mt-6">
                <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 shadow">
                    <i className="fas fa-save mr-1"></i>Simpan Profil
                </button>
            </div>
        </div>
    );
}

function JenisTagihan() {
    const [tagihanSettings, setTagihanSettings] = useState({});
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const savedData = localStorage.getItem('tagihan_settings');
        if (savedData) {
            setTagihanSettings(JSON.parse(savedData));
        } else {
            // Ambil dari prev storage jika ada
            const oldNominals = JSON.parse(localStorage.getItem('nominal_default_tagihan') || '{}');
            const initial = {};
            defaultTagihan.forEach(item => {
                initial[item.key] = {
                    nominal: oldNominals[item.key] || '',
                    aktif: true
                };
            });
            setTagihanSettings(initial);
        }
    }, []);

    const handleChange = (key, field, value) => {
        setTagihanSettings(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        const result = await Swal.fire({
            title: 'Terapkan Perubahan?',
            text: 'Ini akan menyimpan pengaturan, dan menyinkronkan nominal ke SELURUH DATA SANTRI SAAT INI (jika tagihan awal mereka > nominal baru, akan disesuaikan menjadi nominal baru. Jika lebih kecil/sudah lunas, tidak berubah).',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Simpan & Terapkan!'
        });

        if (result.isConfirmed) {
            try {
                const res = await authFetch(`${API_BASE}/santri/bulk-tagihan`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ settings: tagihanSettings })
                });

                const json = await res.json();
                if (json.success) {
                    localStorage.setItem('tagihan_settings', JSON.stringify(tagihanSettings));
                    setSaved(true);
                    Swal.fire({ 
                        icon: 'success', 
                        title: 'Berhasil!', 
                        text: 'Nominal berhasil dijadwalkan dan disinkronisasi dengan Data Induk.', 
                        timer: 2000, 
                        showConfirmButton: false 
                    });
                    setTimeout(() => setSaved(false), 2000);
                } else {
                    Swal.fire('Gagal', json.message || 'Gagal menyinkronisasi tagihan', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Terjadi kesalahan koneksi ke server', 'error');
            }
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4"><i className="fas fa-list mr-2 text-green-600"></i>Jenis & Nominal Default Tagihan</h2>
            <p className="text-xs text-gray-500 mb-4">Daftar jenis tagihan beserta nominal default yang akan digunakan sebagai basis tagihan bagi semua santri.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {defaultTagihan.map(item => {
                    const setting = tagihanSettings[item.key] || { aktif: true, nominal: '' };
                    return (
                        <div key={item.key} className={`flex flex-col gap-3 p-4 rounded-lg border transition-colors ${setting.aktif ? 'bg-gray-50 border-gray-200 hover:border-green-300' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${setting.aktif ? 'bg-green-100' : 'bg-gray-200'}`}>
                                        <i className={`${item.icon} ${setting.aktif ? 'text-green-600' : 'text-gray-400'}`}></i>
                                    </div>
                                    <div>
                                        <div className={`text-sm font-medium ${setting.aktif ? 'text-gray-700' : 'text-gray-500'}`}>{item.label}</div>
                                        <div className="text-[10px] text-gray-400">Field: {item.key}</div>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={setting.aktif} onChange={(e) => handleChange(item.key, 'aktif', e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Nominal Default (Rp)</label>
                                <input 
                                    type="number" 
                                    value={setting.nominal} 
                                    onChange={(e) => handleChange(item.key, 'nominal', e.target.value)}
                                    disabled={!setting.aktif}
                                    className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${!setting.aktif && 'bg-gray-100'}`}
                                    placeholder={`Contoh nominal ${item.label.toLowerCase()}`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-end">
                <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 shadow flex items-center transition">
                    <i className="fas fa-save mr-2"></i>Simpan Perubahan
                </button>
            </div>
        </div>
    );
}

function DaftarLembaga() {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4"><i className="fas fa-building mr-2 text-green-600"></i>Lembaga Terdaftar</h2>
            <p className="text-xs text-gray-500 mb-4">Daftar lembaga yang tersedia di sistem.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lembagaOptions.map(lembaga => (
                    <div key={lembaga} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-building text-blue-600"></i>
                            </div>
                            <div className="text-sm font-medium text-gray-700">{lembaga}</div>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                            <i className="fas fa-check-circle mr-1 text-[8px]"></i>Aktif
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Pengaturan;
