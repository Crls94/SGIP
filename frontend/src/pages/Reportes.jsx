import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ui/Toast';
import { Spinner } from '../components/ui/Spinner';
import api from '../api/client';

export default function Reportes() {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [tipo, setTipo] = useState('inventario');
  const [formato, setFormato] = useState('xlsx');
  const [fechaDesde, setFechaDesde] = useState('2026-05-01');
  const [fechaHasta, setFechaHasta] = useState('2026-05-31');

  const fetchHistorial = useCallback(() => {
    setLoadingHistorial(true);
    api.get('/reportes')
      .then((r) => setHistorial(r.data || []))
      .catch(() => setHistorial([]))
      .finally(() => setLoadingHistorial(false));
  }, []);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  const descargarBlob = (data, filename) => {
    const blob = new Blob([data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  };

  const descargar = async () => {
    setDownloading(true);
    try {
      const params = { formato };
      if (tipo === 'pedidos') {
        params.fechaDesde = `${fechaDesde}T00:00:00`;
        params.fechaHasta = `${fechaHasta}T23:59:59`;
      }
      const response = await api.get(`/reportes/${tipo}`, { params, responseType: 'blob' });
      descargarBlob(response.data, `${tipo}.${formato}`);
      toast('Reporte generado correctamente', 'success');
      fetchHistorial();
    } catch {
      toast('Error al generar reporte', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const descargarHistorial = async (reporte) => {
    try {
      const response = await api.get(`/reportes/${reporte.id}/descargar`, { responseType: 'blob' });
      descargarBlob(response.data, `${String(reporte.tipo || 'reporte').toLowerCase()}.${String(reporte.formato || 'xlsx').toLowerCase()}`);
    } catch {
      toast('No se pudo descargar el reporte guardado', 'error');
    }
  };

  const reportesPedidos = historial.filter((h) => h.tipo === 'PEDIDOS');
  const reportesInventario = historial.filter((h) => h.tipo === 'INVENTARIO');
  const totalReportes = historial.length;
  const formatos = historial.reduce((acc, h) => {
    const key = String(h.formato || 'N/A').toUpperCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const ultimoReporte = historial[0]?.createdAt ? new Date(historial[0].createdAt).toLocaleDateString('es-PE') : '-';

  return (
    <div>
      <div className="page-header">
        <h1>Reportes</h1>
        <span className="caption">Resumen de ventas e inventario exportable</span>
      </div>

      <div className="card">
        <div className="filter-bar">
          <label className="caption">Tipo de reporte:</label>
          <select className="form-input" value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="inventario">Inventario</option>
            <option value="pedidos">Ventas</option>
          </select>
          <label className="caption">Rango de fechas:</label>
          <input className="form-input" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} style={{ maxWidth: 160 }} />
          <input className="form-input" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} style={{ maxWidth: 160 }} />
          <select className="form-input" value={formato} onChange={(e) => setFormato(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="xlsx">Excel</option>
            <option value="pdf">PDF</option>
          </select>
          <button type="button" className="btn btn-primary" disabled={downloading} onClick={descargar}>
            {downloading ? <><Spinner /> Generando...</> : 'Generar'}
          </button>
        </div>

        <h3 style={{ marginTop: 14, marginBottom: 12 }}>Resumen de reportes generados</h3>
        <div className="wire-card-grid" style={{ marginTop: 4 }}>
          <div className="wire-panel"><div className="metric-label">Total generados</div><div className="mock-stat">{totalReportes}</div></div>
          <div className="wire-panel"><div className="metric-label">Reportes de pedidos</div><div className="mock-stat">{reportesPedidos.length}</div></div>
          <div className="wire-panel"><div className="metric-label">Reportes de inventario</div><div className="mock-stat">{reportesInventario.length}</div></div>
          <div className="wire-panel"><div className="metric-label">Ultimo reporte</div><div className="mock-stat" style={{ fontSize: 22 }}>{ultimoReporte}</div></div>
        </div>

        <div className="dashboard-charts mt-16">
          <div className="wire-panel wire-panel-tall">
            <h3>Reportes por formato</h3>
            <div className="table-wrapper mt-16">
              <table className="table">
                <tbody>
                  {Object.entries(formatos).length > 0 ? Object.entries(formatos).map(([nombre, cantidad]) => (
                    <tr key={nombre}><td>{nombre}</td><td>{cantidad}</td></tr>
                  )) : <tr><td>Sin reportes generados</td><td>0</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="wire-panel wire-panel-tall">
            <h3>Ultimos reportes</h3>
            <div className="table-wrapper mt-16">
              <table className="table">
                <tbody>
                  {historial.slice(0, 4).map((r) => (
                    <tr key={r.id}><td>{r.tipo}</td><td>{String(r.formato || '').toUpperCase()}</td></tr>
                  ))}
                  {historial.length === 0 && <tr><td>No hay reportes en historial</td><td>-</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <h3 style={{ marginBottom: 12 }}>Historial de reportes</h3>
        {loadingHistorial ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spinner /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Tipo</th><th>Formato</th><th>Generado por</th><th>Fecha</th><th>Accion</th></tr>
              </thead>
              <tbody>
                {historial.map((r) => (
                  <tr key={r.id}>
                    <td>{r.tipo}</td>
                    <td>{String(r.formato || '').toUpperCase()}</td>
                    <td>{r.usuarioNombre || r.usuarioEmail || '-'}</td>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleString('es-PE') : '-'}</td>
                    <td><button type="button" className="btn btn-outline btn-sm" onClick={() => descargarHistorial(r)}>Descargar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
