import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import api from '../api/client';

export default function Alertas() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAlertas = useCallback(async () => {
    try {
      setError('');
      const { data } = await api.get('/alertas/activas');
      setAlertas(data);
    } catch (err) {
      const message = err.response?.data?.error || 'Error al cargar alertas';
      setError(message);
      toast(message, 'error');
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlertas(); }, [fetchAlertas]);

  const resolver = async (id, estado) => {
    try {
      await api.patch(`/alertas/${id}/resolver`, null, { params: { estado } });
      toast(estado === 'RESUELTA' ? 'Alerta marcada como atendida' : 'Alerta descartada', 'success');
      fetchAlertas();
    } catch (err) {
      toast(err.response?.data?.error || 'Error', 'error');
    }
  };

  const alertasPredictivas = alertas.filter((a) => a.origen === 'IA_PREDICTIVA');
  const alertasStockReal = alertas.filter((a) => a.origen !== 'IA_PREDICTIVA');

  const renderAlerta = (a) => (
    <div key={a.id} className="card" style={{ borderLeft: `4px solid ${a.origen === 'IA_PREDICTIVA' ? '#FF8F00' : 'var(--color-danger)'}` }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: a.origen === 'IA_PREDICTIVA' ? '#FFF8E1' : '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.origen === 'IA_PREDICTIVA' ? '#FF8F00' : '#E53935' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          </div>
          <div>
            <h3 style={{ fontSize: 15 }}>{a.productoNombre}</h3>
            <span className="micro" style={{ color: 'var(--text-tertiary)' }}>{a.fechaGenerada ? new Date(a.fechaGenerada).toLocaleString() : 'Fecha no disponible'}</span>
          </div>
        </div>
        <span className={`badge ${a.origen === 'IA_PREDICTIVA' ? 'badge-warning' : 'badge-danger'}`}>
          {a.origen === 'IA_PREDICTIVA' ? 'IA predictiva' : 'Stock real'}
        </span>
      </div>
      {a.mensaje && <p className="caption" style={{ marginBottom: 10 }}>{a.mensaje}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="stat-row">
          <span className="stat-label">Stock actual</span>
          <span className="badge badge-danger">{a.stockAlGenerar}</span>
        </div>
        {a.origen === 'IA_PREDICTIVA' && (
          <>
            <div className="stat-row">
              <span className="stat-label">Demanda estimada</span>
              <strong className="stat-value">{a.cantidadPredicha ?? 0}</strong>
            </div>
            <div className="stat-row">
              <span className="stat-label">Faltante estimado</span>
              <span className="badge badge-warning">{a.faltanteEstimado ?? 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Semana estimada</span>
              <strong className="stat-value">{formatDate(a.semanaInicio)} - {formatDate(a.semanaFin)}</strong>
            </div>
          </>
        )}
        <div className="stat-row">
          <span className="stat-label">Punto de pedido</span>
          <strong className="stat-value">{a.puntoPedidoReferencia}</strong>
        </div>
        <div className="stat-row">
          <span className="stat-label">Estado</span>
          <span className="badge badge-warning">{a.estado}</span>
        </div>
      </div>
      {isAdmin && (
        <div className="flex-row" style={{ gap: 8, marginTop: 12 }}>
          <button className="btn btn-accent btn-sm" style={{ flex: 1 }} onClick={() => resolver(a.id, 'RESUELTA')}>
            Marcar como atendida
          </button>
          <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => resolver(a.id, 'IGNORADA')}>
            Descartar
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Alertas de Stock</h1>
        <span className={`badge ${alertas.length > 0 ? 'badge-danger' : 'badge-success'}`}>
          {alertas.length} activas
        </span>
      </div>

      {!isAdmin && (
        <div className="card mb-16" style={{ padding: 14 }}>
          <span className="caption">Vista de consulta. Solo administradores pueden marcar alertas como atendidas o descartarlas.</span>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-dark" style={{ width: 32, height: 32 }} /></div>
      ) : error ? (
        <div className="empty-state">
          <h3>No se pudieron cargar las alertas</h3>
          <p>{error}</p>
        </div>
      ) : alertas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h3>Sin alertas</h3>
          <p>Todos los productos estan sobre su punto de pedido.</p>
        </div>
      ) : (
        <div>
          {alertasPredictivas.length > 0 && (
            <section className="mb-24">
              <div className="card-header mb-16">
                <div>
                  <h2 style={{ fontSize: 18 }}>Alertas predictivas IA</h2>
                  <p className="caption mt-8">Riesgos anticipados por demanda estimada para que el equipo revise reposicion.</p>
                </div>
                <span className="badge badge-warning">{alertasPredictivas.length} pendientes</span>
              </div>
              <div className="page-grid">{alertasPredictivas.map(renderAlerta)}</div>
            </section>
          )}

          {alertasStockReal.length > 0 && (
            <section>
              <div className="card-header mb-16">
                <div>
                  <h2 style={{ fontSize: 18 }}>Alertas por stock actual</h2>
                  <p className="caption mt-8">Productos que ya llegaron o bajaron del punto de pedido.</p>
                </div>
                <span className="badge badge-danger">{alertasStockReal.length} pendientes</span>
              </div>
              <div className="page-grid">{alertasStockReal.map(renderAlerta)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return '--';
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}
