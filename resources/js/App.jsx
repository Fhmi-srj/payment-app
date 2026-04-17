import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TahunAjaranProvider } from './contexts/TahunAjaranContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './pages/Admin/components/AppLayout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Admin/Dashboard';
import DataInduk from './pages/Admin/DataInduk';
import Kasir from './pages/Admin/Kasir';
import Riwayat from './pages/Admin/Riwayat';
import Laporan from './pages/Admin/Laporan';
import Tagihan from './pages/Admin/Tagihan';
import ManajemenUser from './pages/Admin/ManajemenUser';
import Pengaturan from './pages/Admin/Pengaturan';
import CetakDokumen from './pages/Admin/CetakDokumen';
import AuditLog from './pages/Admin/AuditLog';
import Profil from './pages/Admin/Profil';
import PortalWali from './pages/Wali/PortalWali';

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/portal-wali" element={<PortalWali />} />

                <Route
                    element={
                        <ProtectedRoute requiredRoles={['admin', 'tu']}>
                            <TahunAjaranProvider>
                                <AppLayout />
                            </TahunAjaranProvider>
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    {/* Shared routes — Admin & TU */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/kasir" element={<Kasir />} />
                    <Route path="/riwayat" element={<Riwayat />} />
                    <Route path="/cetak" element={<CetakDokumen />} />
                    <Route path="/tagihan" element={<Tagihan />} />
                    <Route path="/profil" element={<Profil />} />

                    {/* Admin-only routes */}
                    <Route path="/data-induk" element={<ProtectedRoute requiredRoles={['admin']}><DataInduk /></ProtectedRoute>} />
                    <Route path="/laporan" element={<ProtectedRoute requiredRoles={['admin']}><Laporan /></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute requiredRoles={['admin']}><ManajemenUser /></ProtectedRoute>} />
                    <Route path="/audit-log" element={<ProtectedRoute requiredRoles={['admin']}><AuditLog /></ProtectedRoute>} />
                    <Route path="/pengaturan" element={<ProtectedRoute requiredRoles={['admin']}><Pengaturan /></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
            </Routes>
        </AuthProvider>
    );
}

export default App;

