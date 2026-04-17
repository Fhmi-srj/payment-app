import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE, authFetch } from '../config/api';

const TahunAjaranContext = createContext();

export function TahunAjaranProvider({ children }) {
    const [tahunAjarans, setTahunAjarans] = useState([]);
    const [activeTahunAjaran, setActiveTahunAjaran] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAll = async () => {
        try {
            const res = await authFetch(`${API_BASE}/tahun-ajaran`);
            const json = await res.json();
            if (json.success) {
                setTahunAjarans(json.data || []);
                const active = (json.data || []).find(t => t.is_active);
                if (active && !selectedId) {
                    setActiveTahunAjaran(active);
                    setSelectedId(active.id);
                }
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const selectTahunAjaran = (id) => {
        setSelectedId(id);
        const found = tahunAjarans.find(t => t.id === parseInt(id));
        if (found) setActiveTahunAjaran(found);
    };

    return (
        <TahunAjaranContext.Provider value={{
            tahunAjarans, activeTahunAjaran, selectedId,
            selectTahunAjaran, fetchAll, loading,
        }}>
            {children}
        </TahunAjaranContext.Provider>
    );
}

export function useTahunAjaran() {
    return useContext(TahunAjaranContext);
}

export default TahunAjaranContext;
