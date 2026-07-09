import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import api from '../api/client';

const emptyForm = { 
  nombre: '', 
  ruc: '', 
  contacto: '', 
  telefono: '', 
  email: '', 
  direccion: '', 
  leadTimeDias: '3' 
};

export default function Proveedores() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [proveedores, setProveedores] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProveedores = useCallback(async () => {
    try {
      const { data } = await api.get('/proveedores');
      setProveedores(data);
    } catch { 
      toast('Error al cargar proveedores', 'error'); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchProveedores(); }, [fetchProveedores]);

  const openCreate = () => { 
    setForm(emptyForm); 
    setEditingId(null); 
    setModalOpen(true); 
  };

  const openEdit = (p) => {
    setForm({
      nombre: p.nombre,
      ruc: p.ruc || '',
      contacto: p.contacto || '',
      telefono: p.telefono || '',
      email: p.email || '',
      direccion: p.direccion || '',
      leadTimeDias: String(p.leadTimeDias || 3),
    });
    setEditingId(p.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      leadTimeDias: parseInt(form.leadTimeDias) || 3,
    };
    try {
      if (editingId) {
        await api.put(`/proveedores/${editingId}`, payload);
        toast('Proveedor actualizado', 'success');
      } else {
        await api.post('/proveedores', payload);
        toast('Proveedor creado', 'success');
      }
      setModalOpen(false);
      fetchProveedores();
    } catch (err) {
      toast(err.response?.data?.error || 'Error al guardar', 'error');
    } finally { 
      setSaving(false); 
    }
  };

  const cambiarActivo = async (proveedor) => {
    const activar = !proveedor.activo;
    const accion = activar ? 'reactivar' : 'desactivar';
    if (!confirm(`${activar ? 'Reactivar' : 'Desactivar'} este proveedor? No se eliminara el historial asociado.`)) return;
    try {
      await api.patch(`/proveedores/${proveedor.id}/${accion}`);
      toast(activar ? 'Proveedor reactivado' : 'Proveedor desactivado', 'success');
      fetchProveedores();
    } catch (err) {
      toast(err.response?.data?.error || `Error al ${accion}`, 'error');
    }
  };

  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div>
      <div className="page-header">
        <h1>Proveedores</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Proveedor
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner spinner-dark" style={{ width: 32, height: 32 }} />
        </div>
      ) : proveedores.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3>Sin proveedores</h3>
          <p>No hay proveedores registrados en el sistema.</p>
        </div>
      ) : (
        <div className="page-grid">
          {proveedores.map((p) => (
            <div key={p.id} className="card" style={{ borderLeft: `4px solid ${p.activo ? 'var(--color-primary)' : 'var(--text-tertiary)'}`, opacity: p.activo ? 1 : 0.78 }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 16 }}>{p.nombre}</h3>
                    <span className={`badge ${p.activo ? 'badge-success' : 'badge-neutral'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span>
                  </div>
                  {p.ruc && <div className="micro" style={{ marginTop: 2 }}>RUC: {p.ruc}</div>}
                </div>
                {isAdmin && (
                  <div className="flex-row" style={{ gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Editar</button>
                    <button className={`btn btn-sm ${p.activo ? 'btn-danger' : 'btn-accent'}`} onClick={() => cambiarActivo(p)}>
                      {p.activo ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                {p.contacto && (
                  <div className="stat-row" style={{ borderBottom: 'none', padding: '4px 0' }}>
                    <span className="stat-label">Contacto:</span>
                    <span className="stat-value">{p.contacto}</span>
                  </div>
                )}
                {p.telefono && (
                  <div className="stat-row" style={{ borderBottom: 'none', padding: '4px 0' }}>
                    <span className="stat-label">Telefono:</span>
                    <span className="stat-value">{p.telefono}</span>
                  </div>
                )}
                {p.email && (
                  <div className="stat-row" style={{ borderBottom: 'none', padding: '4px 0' }}>
                    <span className="stat-label">Email:</span>
                    <span className="stat-value">{p.email}</span>
                  </div>
                )}
                {p.direccion && (
                  <div className="stat-row" style={{ borderBottom: 'none', padding: '4px 0' }}>
                    <span className="stat-label">Direccion:</span>
                    <span className="stat-value">{p.direccion}</span>
                  </div>
                )}
                <div className="stat-row" style={{ borderBottom: 'none', padding: '4px 0' }}>
                  <span className="stat-label">Lead Time:</span>
                  <span className="badge badge-info">{p.leadTimeDias || 3} dias</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del Proveedor <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input className="form-input" value={form.nombre} onChange={update('nombre')} placeholder="Ej: Distribuidora ABC" required />
          </div>

          <div className="flex-row" style={{ gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>RUC</label>
              <input className="form-input" value={form.ruc} onChange={update('ruc')} placeholder="11 digitos" maxLength={11} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Lead Time <span style={{ color: 'var(--text-tertiary)' }}>(dias de entrega)</span></label>
              <input className="form-input" type="number" min="1" value={form.leadTimeDias} onChange={update('leadTimeDias')} placeholder="3" />
            </div>
          </div>

          <div className="flex-row" style={{ gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Contacto <span style={{ color: 'var(--text-tertiary)' }}>(persona)</span></label>
              <input className="form-input" value={form.contacto} onChange={update('contacto')} placeholder="Nombre del contacto" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Telefono</label>
              <input className="form-input" value={form.telefono} onChange={update('telefono')} placeholder="Ej: 956123456" />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" value={form.email} onChange={update('email')} placeholder="contacto@proveedor.com" />
          </div>

          <div className="form-group">
            <label>Direccion</label>
            <input className="form-input" value={form.direccion} onChange={update('direccion')} placeholder="Direccion fiscal o de despacho" />
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={saving}>
            {saving && <Spinner />}
            {editingId ? 'Actualizar Proveedor' : 'Crear Proveedor'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
