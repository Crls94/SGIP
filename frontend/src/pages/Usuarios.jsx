import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Spinner } from '../components/ui/Spinner';
import api from '../api/client';

const ROLES = [
  { value: 'OPERARIO', label: 'Operario', color: '#66BB6A' },
  { value: 'GERENTE', label: 'Gerente', color: '#FFA726' },
  { value: 'ADMINISTRADOR', label: 'Administrador', color: '#EF5350' },
];

const ROLES_EDITABLES = ROLES.filter((r) => r.value !== 'GERENTE');

export default function Usuarios() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', rol: 'OPERARIO' });

  const fetchUsuarios = useCallback(async () => {
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch {
      toast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const crearUsuario = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/register', form);
      toast('Usuario creado correctamente', 'success');
      setShowModal(false);
      setForm({ nombre: '', apellido: '', email: '', password: '', rol: 'OPERARIO' });
      fetchUsuarios();
    } catch (err) {
      toast(err.response?.data?.error || err.response?.data?.message || 'Error al crear usuario', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cambiarRol = async (id, nuevoRol) => {
    try {
      await api.patch(`/usuarios/${id}/rol`, { rol: nuevoRol });
      toast('Rol actualizado', 'success');
      fetchUsuarios();
    } catch (err) {
      toast(err.response?.data?.error || 'Error al cambiar rol', 'error');
    }
  };

  const toggleActivo = async (id, activo) => {
    try {
      await api.patch(`/usuarios/${id}/${activo ? 'desactivar' : 'activar'}`);
      toast(activo ? 'Usuario desactivado' : 'Usuario activado', 'success');
      fetchUsuarios();
    } catch (err) {
      toast(err.response?.data?.error || 'Error', 'error');
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  if (!isAdmin) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </div>
        <h3>Acceso denegado</h3>
        <p>Solo los administradores pueden gestionar usuarios.</p>
      </div>
    );
  }

  const getRolColor = (rol) => ROLES.find(r => r.value === rol)?.color || '#9E9E9E';

  return (
    <div>
      <div className="page-header">
        <h1>Gestion de Usuarios</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nuevo Usuario
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-dark" style={{ width: 32, height: 32 }} /></div>
      ) : usuarios.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <h3>Sin usuarios</h3>
          <p>No se encontraron usuarios registrados.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th>Ultimo Login</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: `linear-gradient(135deg, ${getRolColor(u.rol)}22, ${getRolColor(u.rol)}44)`,
                        color: getRolColor(u.rol),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14, flexShrink: 0,
                      }}>
                        {u.nombre?.charAt(0)}{u.apellido?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.nombre} {u.apellido}</div>
                        <div className="micro" style={{ marginTop: 1 }}>Creado: {new Date(u.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.email}</td>
                  <td>
                    <select
                      className="form-input"
                      value={u.rol}
                      onChange={(e) => cambiarRol(u.id, e.target.value)}
                      disabled={u.rol === 'GERENTE'}
                      style={{ padding: '4px 28px 4px 10px', fontSize: 'var(--font-caption)', minWidth: 140, fontWeight: 500, borderLeft: `3px solid ${getRolColor(u.rol)}` }}
                      title={u.rol === 'GERENTE' ? 'El rol GERENTE es de supervision y no se modifica desde esta pantalla' : 'Cambiar rol'}
                    >
                      {(u.rol === 'GERENTE' ? ROLES : ROLES_EDITABLES).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.activo ? 'badge-success' : 'badge-danger'}`}>
                      {u.activo ? '● Activo' : '○ Inactivo'}
                    </span>
                  </td>
                  <td className="caption">
                    {u.ultimoLogin ? new Date(u.ultimoLogin).toLocaleString() : 'Nunca'}
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.activo ? 'btn-ghost' : 'btn-accent'}`}
                      onClick={() => toggleActivo(u.id, u.activo)}
                    >
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Usuario</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={crearUsuario}>
              <div className="flex-row" style={{ gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Nombre</label>
                  <input className="form-input" value={form.nombre} onChange={update('nombre')} placeholder="Nombre" required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Apellido</label>
                  <input className="form-input" value={form.apellido} onChange={update('apellido')} placeholder="Apellido" required />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" value={form.email} onChange={update('email')} placeholder="correo@metroica.pe" required />
              </div>
              <div className="form-group">
                <label>Contrasena</label>
                <input className="form-input" type="password" value={form.password} onChange={update('password')} placeholder="Min. 6 caracteres" required />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select className="form-input" value={form.rol} onChange={update('rol')}>
                  <option value="OPERARIO">Operario</option>
                </select>
                <div className="caption mt-8">Los usuarios nuevos se crean como operarios. Los permisos sensibles se asignan desde gestion controlada.</div>
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={saving}>
                {saving && <Spinner />} Crear Usuario
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
