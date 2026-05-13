import { useState, useEffect } from 'react';
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

  useEffect(() => {
    api.get('/reportes').then((r) => setHistorial(r.data || [])).catch(() => setHistorial([])).finally(() => setLoadingHistorial(false));
  }, []);

  const descargar = async () => {
    setDownloading(true);
    try {
      const params = { formato };
      if (tipo === 'pedidos') {
        params.fechaDesde = `${fechaDesde}T00:00:00`;
        params.fechaHasta = `${fechaHasta}T23:59:59`;
      }
      const response = await api.get(`/reportes/${tipo}`, { params, responseType: 'blob' });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tipo}.${formato}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast('Reporte generado correctamente', 'success');
    } catch {
      toast('Error al generar reporte', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const totalVentas = historial.filter((h) => h.tipo === 'PEDIDOS').length;
  const totalInv = historial.filter((h) => h.tipo === 'INVENTARIO').length;

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

        <h3 style={{ marginTop: 14, marginBottom: 12 }}>Resumen de ventas</h3>
        <div className="wire-card-grid" style={{ marginTop: 4 }}>
          <div className="wire-panel"><div className="metric-label">Ventas totales</div><div className="mock-stat">S/ 98,450</div></div>
          <div className="wire-panel"><div className="metric-label">Pedidos atendidos</div><div className="mock-stat">{totalVentas || 256}</div></div>
          <div className="wire-panel"><div className="metric-label">Ticket promedio</div><div className="mock-stat">S/ 38.46</div></div>
          <div className="wire-panel"><div className="metric-label">Productos vendidos</div><div className="mock-stat">1,782</div></div>
        </div>

        <div className="dashboard-charts mt-16">
          <div className="wire-panel wire-panel-tall"><h3>Ventas por categoria</h3><div className="mock-chart mt-16" /><p className="caption mt-16">Abarrotes 45%, Lacteos 25%, Bebidas 15%</p></div>
          <div className="wire-panel wire-panel-tall"><h3>Top productos mas vendidos</h3><div className="table-wrapper mt-16"><table className="table"><tbody><tr><td>Arroz Extra</td></tr><tr><td>Leche Gloria</td></tr><tr><td>Aceite Primor</td></tr><tr><td>Azucar Bella</td></tr></tbody></table></div></div>
        </div>

        <h3 style={{ marginBottom: 12 }}>Historial de reportes</h3>
        {loadingHistorial ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spinner /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Tipo</th><th>Formato</th><th>Generado por</th><th>Fecha</th></tr>
              </thead>
              <tbody>
                {historial.map((r) => (
                  <tr key={r.id}>
                    <td>{r.tipo}</td>
                    <td>{String(r.formato || '').toUpperCase()}</td>
                    <td>{r.usuarioNombre || r.usuarioEmail || '-'}</td>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleString('es-PE') : '-'}</td>
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
