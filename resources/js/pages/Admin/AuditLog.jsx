import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE, authFetch } from '../../config/api';
import Pagination from '../../components/Pagination';

const ACTION_COLORS = {
    created: 'bg-green-100 text-green-700',
    updated: 'bg-blue-100 text-blue-700',
    deleted: 'bg-red-100 text-red-700',
    login: 'bg-purple-100 text-purple-700',
    logout: 'bg-gray-100 text-gray-700',
    imported: 'bg-amber-100 text-amber-700',
    exported: 'bg-teal-100 text-teal-700',
    payment: 'bg-emerald-100 text-emerald-700',
};

const ACTION_ICONS = {
    created: 'fas fa-plus-circle',
    updated: 'fas fa-edit',
    deleted: 'fas fa-trash',
    login: 'fas fa-sign-in-alt',
    logout: 'fas fa-sign-out-alt',
    imported: 'fas fa-file-import',
    exported: 'fas fa-file-export',
    payment: 'fas fa-money-bill-wave',
};

function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [expandedId, setExpandedId] = useState(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, per_page: pageSize });
            if (search) params.append('search', search);
            if (actionFilter) params.append('action', actionFilter);
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);

            const res = await authFetch(`${API_BASE}/audit-log?${params}`);
            const json = await res.json();
            if (json.success) {
                setLogs(json.data || []);
                setMeta(json.meta || {});
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [page, pageSize, search, actionFilter, dateFrom, dateTo]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const handleSearch = (val) => { setSearch(val); setPage(1); };

    return (
        <>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cari</label>
                        <input type="text" value={search} onChange={e => handleSearch(e.target.value)}
                            placeholder="Cari deskripsi..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div className="w-40">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Aksi</label>
                        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="">Semua</option>
                            {Object.keys(ACTION_COLORS).map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="w-40">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Dari</label>
                        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div className="w-40">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sampai</label>
                        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                </div>
            </div>

            {/* Log List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400"><i className="fas fa-spinner fa-spin mr-2"></i>Memuat...</div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <i className="fas fa-clipboard-list text-3xl mb-2"></i>
                        <p className="text-sm">Belum ada aktivitas tercatat</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {logs.map(log => (
                            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                                            <i className={`${ACTION_ICONS[log.action] || 'fas fa-circle'} text-xs`}></i>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-800">{log.description}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                                                    {log.action}
                                                </span>
                                                <span className="text-[10px] text-gray-400">oleh {log.user_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleString('id-ID')}</div>
                                        <div className="text-[9px] text-gray-300">{log.ip_address}</div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedId === log.id && (log.old_values || log.new_values) && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs">
                                        {log.old_values && (
                                            <div className="mb-2">
                                                <span className="font-semibold text-red-600">Before:</span>
                                                <pre className="text-gray-600 mt-1 whitespace-pre-wrap font-mono text-[10px]">{JSON.stringify(log.old_values, null, 2)}</pre>
                                            </div>
                                        )}
                                        {log.new_values && (
                                            <div>
                                                <span className="font-semibold text-green-600">After:</span>
                                                <pre className="text-gray-600 mt-1 whitespace-pre-wrap font-mono text-[10px]">{JSON.stringify(log.new_values, null, 2)}</pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <Pagination currentPage={meta.current_page} totalPages={meta.last_page} totalItems={meta.total} itemsPerPage={pageSize}
                    onPageChange={setPage} onLimitChange={(s) => { setPageSize(s); setPage(1); }} />
            </div>
        </>
    );
}

export default AuditLog;
