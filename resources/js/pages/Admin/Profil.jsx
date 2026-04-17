import React, { useState } from 'react';
import { API_BASE, authFetch } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

function Profil() {
    const { user } = useAuth();
    const userRole = user?.role;
    const roleLabel = userRole === 'admin' ? 'Administrator' : 'Tata Usaha (TU)';

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPwMsg({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok' });
            return;
        }
        if (newPassword.length < 6) {
            setPwMsg({ type: 'error', text: 'Password minimal 6 karakter' });
            return;
        }
        setPwLoading(true);
        setPwMsg({ type: '', text: '' });
        try {
            const res = await authFetch(`${API_BASE}/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: currentPassword,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            });
            const json = await res.json();
            if (json.success) {
                setPwMsg({ type: 'success', text: 'Password berhasil diubah!' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setPwMsg({ type: 'error', text: json.message || 'Gagal mengubah password' });
            }
        } catch (err) {
            setPwMsg({ type: 'error', text: 'Terjadi kesalahan. Coba lagi.' });
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Profile Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-2xl text-white"></i>
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg">{user?.name || '-'}</h2>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${userRole === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                    <i className={`fas ${userRole === 'admin' ? 'fa-shield-alt' : 'fa-user-tie'} text-[10px]`}></i>
                                    {roleLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                                <i className="fas fa-user text-gray-400"></i>
                                <span className="text-sm text-gray-700 font-medium">{user?.name || '-'}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
                            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                                <i className="fas fa-at text-gray-400"></i>
                                <span className="text-sm text-gray-700 font-medium">{user?.username || '-'}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Role / Jabatan</label>
                            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                                <i className={`fas ${userRole === 'admin' ? 'fa-shield-alt' : 'fa-user-tie'} text-gray-400`}></i>
                                <span className="text-sm text-gray-700 font-medium">{roleLabel}</span>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
                            <i className="fas fa-info-circle text-amber-500 mt-0.5"></i>
                            <p className="text-xs text-amber-700">Nama, username, dan role hanya dapat diubah oleh <strong>Administrator</strong> melalui menu Users.</p>
                        </div>
                    </div>
                </div>

                {/* Password Change Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <i className="fas fa-key text-green-600"></i>Ubah Password
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">Pastikan password baru minimal 6 karakter</p>
                    </div>
                    <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password Lama</label>
                            <div className="relative">
                                <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Masukkan password lama" />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <i className={`fas ${showCurrent ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password Baru</label>
                            <div className="relative">
                                <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6}
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Minimal 6 karakter" />
                                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <i className={`fas ${showNew ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Konfirmasi Password Baru</label>
                            <div className="relative">
                                <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6}
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Ulangi password baru" />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                                </button>
                            </div>
                        </div>

                        {pwMsg.text && (
                            <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                <i className={`fas ${pwMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                                {pwMsg.text}
                            </div>
                        )}

                        <button type="submit" disabled={pwLoading}
                            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md">
                            {pwLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Menyimpan...</> : <><i className="fas fa-save mr-2"></i>Simpan Password Baru</>}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default Profil;
