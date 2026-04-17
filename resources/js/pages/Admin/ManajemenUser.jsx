import React, { useState, useEffect } from 'react';
import { API_BASE, authFetch } from '../../config/api';
import Swal from 'sweetalert2';
import Modal from '../../components/Modal';
import Pagination, { ITEMS_PER_PAGE_DEFAULT } from '../../components/Pagination';

const roleLabels = { admin: 'Administrator', tu: 'Tata Usaha', bendahara: 'Bendahara' };
const roleColors = { admin: 'bg-purple-100 text-purple-700', tu: 'bg-blue-100 text-blue-700', bendahara: 'bg-green-100 text-green-700' };

function ManajemenUser() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', username: '', password: '', role: 'tu' });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_DEFAULT);

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_BASE}/users`);
            const json = await res.json();
            if (json.success) setUsers(json.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // Pagination calculations
    const totalPages = Math.ceil(users.length / itemsPerPage);
    const paginatedUsers = users.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const openAdd = () => {
        setEditing(null);
        setForm({ name: '', username: '', password: '', role: 'tu' });
        setShowModal(true);
    };

    const openEdit = (user) => {
        setEditing(user);
        setForm({ name: user.name, username: user.username, password: '', role: user.role });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editing ? `${API_BASE}/users/${editing.id}` : `${API_BASE}/users`;
            const method = editing ? 'PUT' : 'POST';
            const body = { ...form };
            if (editing && !body.password) delete body.password;

            const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const json = await res.json();

            if (json.success) {
                Swal.fire({ icon: 'success', title: editing ? 'User diupdate!' : 'User dibuat!', timer: 1500, showConfirmButton: false });
                setShowModal(false);
                loadUsers();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: json.message || 'Gagal menyimpan' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menyimpan' });
        }
    };

    const handleDelete = async (user) => {
        const result = await Swal.fire({
            title: 'Hapus User?',
            text: `Yakin ingin menghapus ${user.name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;
        try {
            const res = await authFetch(`${API_BASE}/users/${user.id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                Swal.fire({ icon: 'success', title: 'Dihapus!', timer: 1500, showConfirmButton: false });
                loadUsers();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: json.message });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menghapus' });
        }
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <button onClick={openAdd} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 shadow">
                    <i className="fas fa-plus mr-1"></i>Tambah User
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-green-50 text-green-800">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">No</th>
                                <th className="px-4 py-3 text-left font-semibold">Nama</th>
                                <th className="px-4 py-3 text-left font-semibold">Username</th>
                                <th className="px-4 py-3 text-center font-semibold">Role</th>
                                <th className="px-4 py-3 text-center font-semibold">Terdaftar</th>
                                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400"><i className="fas fa-spinner fa-spin mr-1"></i>Memuat...</td></tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada user</td></tr>
                            ) : paginatedUsers.map((u, idx) => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                    <td className="px-4 py-3 font-medium">{u.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{u.username}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
                                            {roleLabels[u.role] || u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs text-gray-400">
                                        {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => openEdit(u)} className="text-blue-600 hover:text-blue-800 text-xs mr-3"><i className="fas fa-edit mr-1"></i>Edit</button>
                                        <button onClick={() => handleDelete(u)} className="text-red-600 hover:text-red-800 text-xs"><i className="fas fa-trash mr-1"></i>Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && users.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={users.length}
                        itemsPerPage={itemsPerPage}
                        onLimitChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }}
                    />
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">{editing ? 'Edit User' : 'Tambah User'}</h2>
                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password {editing && <span className="text-gray-400">(kosongkan jika tidak diubah)</span>}</label>
                            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} {...(!editing ? { required: true } : {})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                                <option value="admin">Administrator</option>
                                <option value="tu">Tata Usaha</option>
                                <option value="bendahara">Bendahara</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Batal</button>
                            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                                <i className="fas fa-save mr-1"></i>{editing ? 'Update' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}

export default ManajemenUser;
