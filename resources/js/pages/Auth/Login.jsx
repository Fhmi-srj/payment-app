import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [tahunAjaran, setTahunAjaran] = useState('2025/2026');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message || 'Login gagal');
        }

        setLoading(false);
    };

    const quickLogin = (user, pass) => {
        setUsername(user);
        setPassword(pass);
        setError('');
    };

    return (
        <div className="min-h-screen bg-white lg:bg-gray-50 flex flex-col lg:flex-row">
            {/* Header Hijau Melengkung (Hanya Mobile) */}
            <div className="lg:hidden bg-[#16a34a] pt-12 pb-16 px-6 rounded-b-[40px] flex flex-col items-center text-center shadow-lg relative overflow-hidden">
                {/* Decorative Pattern / Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

                <img src="/logo pondok.png" alt="Logo" className="w-24 h-24 mb-4 object-contain" />
                <h1 className="text-white text-2xl font-bold mb-1 tracking-tight">NURUL HUDA</h1>
                <p className="text-green-50 text-sm opacity-90 font-medium">Sistem Pembayaran An-Najjah</p>
            </div>

            {/* Left Panel - Branding (Hanya Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 relative overflow-hidden flex-col items-center justify-center p-12">
                <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/5 rounded-full"></div>
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full"></div>

                <div className="relative z-10 text-center max-w-md">
                    <img src="/logo pondok.png" alt="Logo" className="w-36 h-36 mx-auto mb-8 object-contain drop-shadow-2xl" />
                    <h1 className="text-3xl font-bold text-white mb-3 tracking-wide">Nurul Huda Payment</h1>
                    <p className="text-green-200 text-base leading-relaxed">
                        Sistem Pembayaran Digital<br />
                        Pondok Pesantren Nurul Huda An-Najjah
                    </p>
                </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 sm:p-10 -mt-8 lg:mt-0 relative z-20">
                <div className="w-full max-w-md">
                    {/* Title Section (Mobile/Desktop) */}
                    <div className="text-center mb-8">
                        <h2 className="text-[26px] font-bold text-gray-800 mb-0.5">Masuk ke Akun</h2>
                        <p className="text-gray-400 font-medium text-sm">Silakan login untuk melanjutkan</p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white lg:bg-white rounded-2xl lg:shadow-xl lg:shadow-gray-200/50 p-0 lg:p-8">
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2 border border-red-100">
                                <i className="fas fa-exclamation-circle"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Username */}
                            <div>
                                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5 ml-1 leading-none uppercase tracking-wider opacity-60">Username</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors">
                                        <i className="fas fa-user text-[15px]"></i>
                                    </span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 lg:bg-gray-50/50 border border-gray-100 lg:border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white outline-none transition-all text-sm font-medium placeholder:text-gray-300 shadow-sm"
                                        placeholder="Masukkan username"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5 ml-1 leading-none uppercase tracking-wider opacity-60">Password</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors">
                                        <i className="fas fa-lock text-[15px]"></i>
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 bg-gray-50 lg:bg-gray-50/50 border border-gray-100 lg:border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white outline-none transition-all text-sm font-medium placeholder:text-gray-300 shadow-sm"
                                        placeholder="Masukkan password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-[14px]`}></i>
                                    </button>
                                </div>
                            </div>

                            {/* Tahun Ajaran */}
                            <div>
                                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5 ml-1 leading-none uppercase tracking-wider opacity-60">Tahun Ajaran</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors">
                                        <i className="fas fa-calendar-alt text-[15px]"></i>
                                    </span>
                                    <select
                                        value={tahunAjaran}
                                        onChange={(e) => setTahunAjaran(e.target.value)}
                                        className="w-full pl-12 pr-10 py-3.5 bg-gray-50 lg:bg-gray-50/50 border border-gray-100 lg:border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white outline-none transition-all text-sm font-medium shadow-sm appearance-none"
                                    >
                                        <option value="2025/2026">2025/2026 (Aktif)</option>
                                        <option value="2024/2025">2024/2025</option>
                                        <option value="2023/2024">2023/2024</option>
                                    </select>
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <i className="fas fa-chevron-down text-[12px]"></i>
                                    </span>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center gap-3 ml-1 py-1">
                                <label className="flex items-center cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded-lg transition-all flex items-center justify-center ${rememberMe ? 'bg-green-600 border-green-600' : 'bg-white border-gray-200 group-hover:border-green-300'}`}>
                                            {rememberMe && <i className="fas fa-check text-[10px] text-white"></i>}
                                        </div>
                                    </div>
                                    <span className="ml-2.5 text-sm text-gray-500 font-medium select-none">Ingat saya (30 hari)</span>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-green-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[15px] mt-2 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Memproses...
                                    </span>
                                ) : (
                                    'Masuk'
                                )}
                            </button>
                        </form>

                        {/* Quick Login - Now at bottom */}
                        <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
                            <p className="text-[11px] font-bold text-gray-400 text-center mb-4 tracking-widest uppercase opacity-80">Demo Access</p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => quickLogin('admin', 'admin123')}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-50/50 hover:bg-green-100/80 border border-green-100 rounded-xl text-[13px] font-bold text-green-700 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    <i className="fas fa-user-shield text-[12px]"></i>
                                    Admin
                                </button>
                                <button
                                    type="button"
                                    onClick={() => quickLogin('tu', 'tu123')}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50/50 hover:bg-blue-100/80 border border-blue-100 rounded-xl text-[13px] font-bold text-blue-700 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    <i className="fas fa-user-tie text-[12px]"></i>
                                    Staf TU
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-10 opacity-40">
                        <p className="text-[10px] font-bold uppercase tracking-[2px] text-gray-500">
                            &copy; 2025 PP NURUL HUDA AN-NAJJAH
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
