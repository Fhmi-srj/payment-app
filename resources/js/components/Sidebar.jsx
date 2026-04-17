import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTahunAjaran } from '../contexts/TahunAjaranContext';

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt', roles: ['admin', 'tu'] },
    { to: '/data-induk', label: 'Data Induk', icon: 'fas fa-database', roles: ['admin'] },
    { to: '/kasir', label: 'Kasir', icon: 'fas fa-cash-register', roles: ['admin', 'tu'] },
    { to: '/riwayat', label: 'Riwayat', icon: 'fas fa-history', roles: ['admin', 'tu'] },
    { to: '/laporan', label: 'Laporan', icon: 'fas fa-chart-bar', roles: ['admin'] },
    { to: '/tagihan', label: 'Tagihan', icon: 'fas fa-file-invoice-dollar', roles: ['admin', 'tu'] },
    { to: '/cetak', label: 'Cetak Dokumen', icon: 'fas fa-print', roles: ['admin', 'tu'] },
    { to: '/users', label: 'Users', icon: 'fas fa-users-cog', roles: ['admin'] },
    { to: '/audit-log', label: 'Audit Log', icon: 'fas fa-clipboard-list', roles: ['admin'] },
    { to: '/pengaturan', label: 'Pengaturan', icon: 'fas fa-cog', roles: ['admin'] },
];

function TahunAjaranSelector() {
    const { tahunAjarans, selectedId, selectTahunAjaran, loading } = useTahunAjaran();
    if (loading || tahunAjarans.length === 0) return null;
    return (
        <div className="px-4 pb-3">
            <label className="text-[10px] font-semibold text-green-700 uppercase tracking-wider mb-1 block">Tahun Ajaran</label>
            <select value={selectedId || ''} onChange={e => selectTahunAjaran(e.target.value)}
                className="w-full text-xs border border-green-300 rounded-lg px-2 py-1.5 bg-white text-green-800 focus:outline-none focus:ring-2 focus:ring-green-400">
                {tahunAjarans.map(t => (
                    <option key={t.id} value={t.id}>{t.nama}{t.is_active ? ' (Aktif)' : ''}</option>
                ))}
            </select>
        </div>
    );
}

function Sidebar({ user, onLogout }) {
    const navigate = useNavigate();
    const userRole = user?.role;
    const filteredNavItems = navItems.filter(item => !item.roles || item.roles.includes(userRole));
    const sidebarLabel = userRole === 'tu' ? 'Tata Usaha (TU)' : 'Main Menu';

    return (
        /* Desktop Sidebar only — mobile uses bottom nav + header in AppLayout */
        <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-[220px] bg-[rgb(243,250,240)] flex-col text-[12px] text-green-800 select-none z-30">
            <div className="flex items-center p-6 pb-4">
                <img alt="Logo" className="w-6 h-6 mr-2" src="/logo pondok.png" />
                <div>
                    <span className="font-semibold text-green-800 text-lg block leading-tight">Nurul Huda</span>
                    <span className="text-[10px] text-green-600 select-none">An-Najjah</span>
                </div>
            </div>
            <TahunAjaranSelector />
            <nav className="flex-1 overflow-y-auto px-4 space-y-1 text-green-800">
                <h6 className="text-[11px] font-semibold mb-2 text-green-700 uppercase tracking-wider select-none px-2">{sidebarLabel}</h6>
                {filteredNavItems.map(item => (
                    <NavLink key={item.to} to={item.to}
                        className={({ isActive }) => `flex items-center space-x-2 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors ${isActive ? 'bg-white font-semibold shadow-sm' : 'hover:bg-white/60'}`}>
                        <i className={`${item.icon} text-[14px] text-green-700 w-5 text-center`}></i>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-green-200">
                <button onClick={() => navigate('/profil')} className="text-[11px] text-green-700 mb-2 truncate flex items-center gap-1 hover:text-green-900 hover:underline cursor-pointer text-left w-full transition-colors">
                    <i className="fas fa-user mr-1"></i>{user?.name} ({user?.role})
                </button>
                <button onClick={onLogout} className="flex items-center space-x-2 px-3 py-2 rounded-lg w-full text-red-600 hover:bg-red-50 text-[12px]">
                    <i className="fas fa-sign-out-alt text-[14px]"></i>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}

export { navItems };
export default Sidebar;
