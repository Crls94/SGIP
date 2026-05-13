import { useState, useEffect } from 'react';
import { useToast } from '../components/ui/Toast';
import api from '../api/client';

export default function Notificaciones() {
  const toast = useToast();
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      setError('');
      const { data } = await api.get('/notificaciones');
      setNotificaciones(data);
    } catch (err) {
      const message = err.response?.data?.error || 'Error al cargar notificaciones';
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const marcarLeida = async (id) => {
    try {
      await api.patch(`/notificaciones/${id}/leer`);
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch {
      toast('Error al marcar notificacion', 'error');
    }
  };

  const marcarTodas = async () => {
    try {
      const noLeidas = notificaciones.filter(n => !n.leida);
      await Promise.all(noLeidas.map(n => api.patch(`/notificaciones/${n.id}/leer`)));
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      toast('Todas las notificaciones marcadas como leidas', 'success');
    } catch {
      toast('Error al marcar notificaciones', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const tipoColor = (tipo) => {
    switch (tipo) {
      case 'ALERTA_STOCK': return '#E53935';
      case 'INFO': return '#1565C0';
      default: return '#757575';
    }
  };

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Notificaciones</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="caption">{notificaciones.filter(n => !n.leida).length} sin leer</span>
          {notificaciones.some(n => !n.leida) && (
            <button className="btn btn-outline btn-sm" onClick={marcarTodas}>
              Marcar todas como leidas
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: '#E53935' }}>
          {error}. Cierre sesion y vuelva a ingresar si su rol fue modificado recientemente.
        </div>
      ) : notificaciones.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: '#757575' }}>
          No hay notificaciones.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notificaciones.map(n => (
            <div
              key={n.id}
              className="card"
              style={{
                padding: 16,
                borderLeft: `4px solid ${tipoColor(n.tipo)}`,
                opacity: n.leida ? 0.65 : 1,
                cursor: n.leida ? 'default' : 'pointer',
                transition: 'opacity 0.2s',
              }}
              onClick={() => !n.leida && marcarLeida(n.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: n.leida ? 400 : 600, fontSize: 14, marginBottom: 4 }}>
                    {!n.leida && <span style={{ color: '#1565C0', marginRight: 6 }}>&#9679;</span>}
                    {n.titulo}
                  </div>
                  <div style={{ fontSize: 13, color: '#555' }}>{n.mensaje}</div>
                </div>
                <div style={{ fontSize: 12, color: '#999', whiteSpace: 'nowrap', marginLeft: 16 }}>
                  {formatDate(n.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
