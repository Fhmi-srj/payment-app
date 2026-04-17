import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTahunAjaran } from '../../../contexts/TahunAjaranContext';
import Sidebar from '../../../components/Sidebar';

const mobileNavItems = [
    { to: '/dashboard', label: 'Beranda', icon: 'fas fa-home' },
    { to: '/tagihan', label: 'Tagihan', icon: 'fas fa-file-invoice-dollar' },
    { to: '/kasir', label: 'Kasir', icon: 'fas fa-cash-register', center: true },
    { to: '/riwayat', label: 'Riwayat', icon: 'fas fa-history' },
    { to: '/cetak', label: 'Cetak', icon: 'fas fa-print' },
];

function MobileTahunAjaranSelector() {
    const { tahunAjarans, selectedId, selectTahunAjaran, loading } = useTahunAjaran();
    if (loading || tahunAjarans.length === 0) return null;
    const active = tahunAjarans.find(t => String(t.id) === String(selectedId));
    return (
        <div className="px-4 py-2.5 border-b border-gray-100">
            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Tahun Ajaran</div>
            <select value={selectedId || ''} onChange={e => selectTahunAjaran(e.target.value)}
                className="w-full text-sm font-semibold text-gray-800 bg-transparent border-none p-0 focus:outline-none cursor-pointer">
                {tahunAjarans.map(t => (
                    <option key={t.id} value={t.id}>{t.nama}{t.is_active ? ' (Aktif)' : ''}</option>
                ))}
            </select>
        </div>
    );
}

function AppLayout() {
    const [profileOpen, setProfileOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallModal, setShowInstallModal] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close dropdown on route change
    useEffect(() => {
        setProfileOpen(false);
    }, [location.pathname]);

    // PWA Install Logic
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);

            const isDismissed = sessionStorage.getItem('pwa_install_dismissed');
            if (!isDismissed) {
                setTimeout(() => setShowInstallModal(true), 500);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        setShowInstallModal(false);
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
    };

    const dismissModal = () => {
        setShowInstallModal(false);
        sessionStorage.setItem('pwa_install_dismissed', 'true');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* ====== MOBILE HEADER ====== */}
            <header className="md:hidden sticky top-0 z-40 bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <img alt="Logo" className="w-8 h-8 rounded-lg" src="/logo pondok.png" />
                        <div>
                            <span className="font-bold text-green-800 text-sm block leading-tight">NURUL HUDA</span>
                            <span className="text-[9px] text-green-600 font-medium">Sistem Pembayaran Pondok</span>
                        </div>
                    </div>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 hover:bg-green-200 transition-colors border-2 border-green-300"
                        >
                            <i className="fas fa-user text-sm"></i>
                        </button>

                        {/* Profile Dropdown */}
                        {profileOpen && (
                            <div className="absolute right-0 top-12 w-60 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                                {/* User info */}
                                <div className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                            <i className="fas fa-user text-white"></i>
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold text-sm truncate">{user?.name}</div>
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white/20 text-white mt-0.5">
                                                <i className={`fas ${user?.role === 'admin' ? 'fa-shield-alt' : 'fa-user-tie'} text-[8px]`}></i>
                                                {user?.role === 'admin' ? 'Admin' : 'Tata Usaha'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Profil link */}
                                <button onClick={() => { navigate('/profil'); setProfileOpen(false); }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100">
                                    <i className="fas fa-user-circle text-green-600 w-5 text-center"></i>
                                    <span>Profil</span>
                                </button>

                                {/* Tahun Ajaran */}
                                <MobileTahunAjaranSelector />

                                {/* Logout */}
                                <button onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                    <i className="fas fa-sign-out-alt w-5 text-center"></i>
                                    <span>Keluar</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ====== DESKTOP SIDEBAR ====== */}
            <Sidebar
                user={user}
                onLogout={handleLogout}
            />

            {/* ====== MAIN CONTENT ====== */}
            <main className="flex-1 md:ml-[220px] overflow-y-auto p-4 pb-24 md:pb-4">
                <div key={location.pathname} className="page-enter flex flex-col flex-1">
                    <Outlet />
                </div>
            </main>

            {/* ====== MOBILE BOTTOM NAVBAR ====== */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
                <div className="flex items-end justify-around px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                    {mobileNavItems.map(item => (
                        <NavLink key={item.to} to={item.to}
                            className={({ isActive }) => `flex flex-col items-center ${item.center ? '-mt-4' : 'py-1.5'} min-w-[56px] transition-all ${isActive && !item.center ? 'text-green-600' : !item.center ? 'text-gray-400' : ''}`}
                        >
                            {({ isActive }) => item.center ? (
                                /* Center elevated button */
                                <>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isActive ? 'bg-green-600 scale-110' : 'bg-green-500'}`}>
                                        <i className={`${item.icon} text-white text-lg`}></i>
                                    </div>
                                    <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`}>{item.label}</span>
                                </>
                            ) : (
                                /* Normal nav items */
                                <>
                                    <i className={`${item.icon} text-[16px] ${isActive ? 'text-green-600' : 'text-gray-400'}`}></i>
                                    <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`}>{item.label}</span>
                                    {isActive && <div className="w-4 h-0.5 bg-green-600 rounded-full mt-0.5"></div>}
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* PWA Install Modal */}
            {showInstallModal && (
                <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-20 md:pb-8 lg:hidden animate-in slide-in-from-bottom duration-500">
                    <div className="bg-white rounded-[32px] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] border border-gray-100 p-6 flex flex-col gap-6 ring-1 ring-black/5 modal-pop-in">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shrink-0 border border-green-100/50">
                                    <i className="fas fa-mobile-alt text-green-600 text-xl"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-gray-900 font-bold text-lg leading-tight">Pasang Aplikasi</h3>
                                    <p className="text-gray-500 text-[13px] mt-1 leading-relaxed">
                                        Pasang di layar utama HP Anda untuk akses lebih cepat dan pengalaman yang lebih lancar.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={dismissModal}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={dismissModal}
                                className="flex-1 py-3.5 px-4 rounded-xl text-[12px] font-bold text-gray-400 border border-gray-200 hover:bg-gray-50 transition-all uppercase tracking-wider"
                            >
                                Nanti Saja
                            </button>
                            <button
                                onClick={handleInstallClick}
                                className="flex-1 py-3.5 px-4 rounded-xl text-[12px] font-bold text-white bg-slate-900 shadow-lg shadow-slate-200 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all uppercase tracking-wider"
                            >
                                <i className="fas fa-download text-[11px]"></i>
                                Install
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AppLayout;
