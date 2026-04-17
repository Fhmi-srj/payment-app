import React, { useState, useEffect } from 'react';
import { API_BASE, authFetch } from '../../config/api';

const formatIDR = (n) => 'Rp' + parseInt(n || 0).toLocaleString('id-ID');
const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function DonutChart({ data, size = 140, strokeWidth = 22, centerLabel, centerValue }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <div className="flex items-center justify-center" style={{ width: size, height: size }}><span className="text-gray-400 text-xs">No data</span></div>;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {data.map((d, i) => {
                    const pct = d.value / total;
                    const dashArray = `${pct * circumference} ${circumference}`;
                    const dashOffset = -offset * circumference;
                    offset += pct;
                    return (
                        <circle key={i} cx={size / 2} cy={size / 2} r={radius} fill="none"
                            stroke={d.color || COLORS[i % COLORS.length]} strokeWidth={strokeWidth}
                            strokeDasharray={dashArray} strokeDashoffset={dashOffset}
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                            className="transition-all duration-700" />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-gray-800">{centerValue}</span>
                {centerLabel && <span className="text-[10px] text-gray-500">{centerLabel}</span>}
            </div>
        </div>
    );
}

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await authFetch(`${API_BASE}/dashboard/stats`);
                const json = await res.json();
                if (json.success) setStats(json.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, []);

    if (loading) return <div className="flex items-center justify-center h-64 text-gray-400"><i className="fas fa-spinner fa-spin text-2xl mr-2"></i>Memuat dashboard...</div>;
    if (!stats) return <div className="text-center text-gray-400 py-16">Gagal memuat data</div>;

    const chartMax = Math.max(...stats.chart_bulanan.map(c => c.total), 1);
    const lunasData = [
        { value: stats.santri_lunas, color: '#16a34a', label: 'Lunas' },
        { value: stats.santri_nunggak, color: '#ef4444', label: 'Nunggak' },
    ];
    const breakdownData = (stats.tunggakan_breakdown || []).map((b, i) => ({
        value: b.total, color: COLORS[i % COLORS.length], label: b.jenis,
    }));

    return (
        <>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard icon="fas fa-users" color="green" label="Santri Aktif" value={stats.santri_aktif} sub={`${stats.santri_nonaktif} tidak aktif`} />
                <StatCard icon="fas fa-money-bill-wave" color="emerald" label="Pemasukan Hari Ini" value={formatIDR(stats.pemasukan_hari_ini)} sub={`Bulan ini: ${formatIDR(stats.pemasukan_bulan_ini)}`} />
                <StatCard icon="fas fa-receipt" color="teal" label="Transaksi Bulan Ini" value={stats.transaksi_count_bulan_ini} sub={`Rata-rata: ${formatIDR(stats.rata_rata_transaksi)}`} />
                <StatCard icon="fas fa-exclamation-triangle" color="red" label="Total Tunggakan" value={formatIDR(stats.total_tunggakan)} alertStyle />
            </div>

            {/* Row 2: Bar Chart + Donut Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Bar Chart - 12 Months */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4"><i className="fas fa-chart-bar mr-2 text-green-600"></i>Tren Pemasukan 12 Bulan Terakhir</h2>
                    <div className="flex items-end gap-1 h-48 overflow-x-auto pb-2">
                        {stats.chart_bulanan.map((item, idx) => {
                            const height = chartMax > 0 ? (item.total / chartMax) * 100 : 0;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full min-w-[40px]">
                                    <div className="text-[8px] text-gray-500 mb-1 font-medium whitespace-nowrap">{item.total > 0 ? formatIDR(item.total) : ''}</div>
                                    <div className="w-full rounded-t-md bg-gradient-to-t from-green-600 to-emerald-400 transition-all duration-500 relative group"
                                        style={{ height: `${Math.max(height, 3)}%`, minHeight: '4px' }}>
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-10 transition-opacity">
                                            {formatIDR(item.total)}
                                        </div>
                                    </div>
                                    <div className="text-[9px] text-gray-500 mt-1 font-medium">{item.bulan_short}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Donut: Lunas vs Nunggak */}
                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-sm font-semibold text-gray-800 mb-3"><i className="fas fa-chart-pie mr-2 text-green-600"></i>Status Santri</h2>
                    <div className="flex flex-col items-center">
                        <DonutChart data={lunasData} centerValue={stats.santri_aktif} centerLabel="Total Aktif" />
                        <div className="flex gap-4 mt-3">
                            {lunasData.map((d, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                                    <span className="text-gray-600">{d.label}: <b>{d.value}</b></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: Tunggakan Breakdown + Lembaga + Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Tunggakan Breakdown Pie */}
                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-sm font-semibold text-gray-800 mb-3"><i className="fas fa-chart-pie mr-2 text-amber-500"></i>Tunggakan per Jenis</h2>
                    {breakdownData.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                            <i className="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
                            <p className="text-sm">Semua lunas! 🎉</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <DonutChart data={breakdownData} centerValue={formatIDR(stats.total_tunggakan)} centerLabel="Total" size={130} strokeWidth={18} />
                            <div className="mt-3 space-y-1 w-full">
                                {breakdownData.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                                            <span className="text-gray-600">{d.label}</span>
                                        </div>
                                        <span className="font-medium text-gray-800">{formatIDR(d.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Pemasukan per Lembaga */}
                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-sm font-semibold text-gray-800 mb-3"><i className="fas fa-building mr-2 text-blue-500"></i>Pemasukan per Lembaga</h2>
                    <p className="text-[10px] text-gray-400 mb-3">Bulan ini</p>
                    {(stats.pemasukan_per_lembaga || []).length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-sm">Belum ada transaksi bulan ini</div>
                    ) : (
                        <div className="space-y-3">
                            {stats.pemasukan_per_lembaga.map((l, i) => {
                                const maxL = Math.max(...stats.pemasukan_per_lembaga.map(x => x.total), 1);
                                const pct = (l.total / maxL) * 100;
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium text-gray-700">{l.lembaga}</span>
                                            <span className="font-semibold text-green-600">{formatIDR(l.total)}</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700"
                                                style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-sm font-semibold text-gray-800 mb-3"><i className="fas fa-clock mr-2 text-green-600"></i>Transaksi Terbaru</h2>
                    <div className="space-y-2">
                        {stats.transaksi_terbaru.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Belum ada transaksi</p>
                        ) : stats.transaksi_terbaru.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="min-w-0">
                                    <div className="text-xs font-medium text-gray-800 truncate">{t.santri_nama}</div>
                                    <div className="text-[10px] text-gray-400 truncate">{t.items}</div>
                                </div>
                                <div className="text-right ml-2 shrink-0">
                                    <div className="text-xs font-semibold text-green-600">{formatIDR(t.total)}</div>
                                    <div className="text-[10px] text-gray-400">{t.metode}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 4: Top Debtors */}
            <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-sm font-semibold text-gray-800 mb-3"><i className="fas fa-exclamation-circle mr-2 text-red-500"></i>Santri dengan Tunggakan Tertinggi</h2>
                {(stats.santri_nunggak_list || []).length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                        <i className="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
                        <p className="text-sm">Semua santri sudah lunas! 🎉</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-red-50 text-red-700">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold">No</th>
                                    <th className="px-3 py-2 text-left font-semibold">Nama</th>
                                    <th className="px-3 py-2 text-left font-semibold">Lembaga</th>
                                    <th className="px-3 py-2 text-left font-semibold">Kelas</th>
                                    <th className="px-3 py-2 text-right font-semibold">Total Tunggakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.santri_nunggak_list.map((s, idx) => (
                                    <tr key={s.id} className="hover:bg-red-50/50">
                                        <td className="px-3 py-2">{idx + 1}</td>
                                        <td className="px-3 py-2 font-medium">{s.nama}</td>
                                        <td className="px-3 py-2">{s.lembaga}</td>
                                        <td className="px-3 py-2">{s.kelas}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-red-600">{formatIDR(s.total_tunggakan)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

function StatCard({ icon, color, label, value, sub, alertStyle }) {
    const colors = {
        green: 'from-green-500 to-green-600',
        emerald: 'from-emerald-500 to-emerald-600',
        teal: 'from-teal-500 to-teal-600',
        red: 'from-red-500 to-red-600',
    };

    return (
        <div className={`bg-white rounded-lg shadow p-4 border-l-4 ${alertStyle ? 'border-red-500' : 'border-green-500'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-gray-500 font-medium">{label}</span>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
                    <i className={`${icon} text-white text-xs`}></i>
                </div>
            </div>
            <div className={`text-lg font-bold ${alertStyle ? 'text-red-600' : 'text-gray-800'}`}>{value}</div>
            {sub && <div className="text-[10px] text-gray-400 mt-1">{sub}</div>}
        </div>
    );
}

export default Dashboard;
