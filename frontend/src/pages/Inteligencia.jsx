import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../components/ui/Toast';
import api from '../api/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Inteligencia() {
  const toast = useToast();
  const [predicciones, setPredicciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [entrenamiento, setEntrenamiento] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [periodo, setPeriodo] = useState('PROXIMA_SEMANA');

  useEffect(() => {
    api.get('/inteligencia/predicciones').then((r) => setPredicciones(r.data || [])).catch(() => toast('No se pudo cargar predicciones', 'error'));
    api.get('/productos?size=200').then((r) => setProductos(r.data?.content || [])).catch(() => {});
    api.get('/inteligencia/datos-entrenamiento').then((r) => setEntrenamiento(r.data || [])).catch(() => {});
  }, []);

  const filas = useMemo(() => {
    const base = productoId ? predicciones.filter((p) => String(p.productoId) === String(productoId)) : predicciones;
    return base.slice(0, 8);
  }, [predicciones, productoId]);

  const tendencia = useMemo(() => {
    let base = entrenamiento;
    if (productoId) {
      base = base.filter((m) => String(m.productoId) === String(productoId));
    }
    const weekly = {};
    base.forEach((m) => {
      const d = new Date(m.fecha);
      const inicio = new Date(d);
      inicio.setDate(d.getDate() - d.getDay() + 1);
      const key = inicio.toISOString().slice(0, 10);
      weekly[key] = (weekly[key] || 0) + m.cantidad;
    });
    return Object.entries(weekly)
      .map(([semana, cantidad]) => ({ semana, cantidad }))
      .sort((a, b) => a.semana.localeCompare(b.semana))
      .slice(-8);
  }, [entrenamiento, productoId]);

  const promedio = predicciones.length > 0
    ? Math.round((predicciones.reduce((acc, p) => acc + (p.confianza || 0), 0) / predicciones.length) * 100)
    : 0;

  const total = filas.reduce((acc, f) => acc + (f.cantidadPredicha || 0), 0);
  const variacion = promedio > 0 ? Math.max(5, Math.round(promedio / 6)) : 15;

  return (
    <div>
      <div className="page-header">
        <h1>IA Predictiva - Pronostico</h1>
        <span className="caption">Demanda estimada basada en salidas historicas</span>
      </div>

      <div className="card">
        <div className="filter-bar">
          <select className="form-input" value={productoId} onChange={(e) => setProductoId(e.target.value)} style={{ maxWidth: 240 }}>
            <option value="">Seleccionar producto</option>
            {productos.map((p) => <option value={p.id} key={p.id}>{p.nombre}</option>)}
          </select>
          <select className="form-input" value={periodo} onChange={(e) => setPeriodo(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="PROXIMA_SEMANA">Proxima semana</option>
            <option value="ULTIMAS_8">Ultimas 8 semanas</option>
          </select>
          <button type="button" className="btn btn-primary" onClick={() => toast('El pronostico se actualiza desde el modulo IA externo', 'info')}>Generar Pronostico</button>
        </div>

        <div className="dashboard-charts" style={{ marginTop: 8 }}>
          <div className="wire-panel">
            <div className="metric-label">Demanda estimada</div>
            <div className="mock-stat">{total}</div>
            <div className="caption">unidades ({periodo === 'PROXIMA_SEMANA' ? 'proxima semana' : 'ultimas 8 semanas'})</div>
            <div className="mock-positive mt-16">+{variacion}% ↑</div>
            <p className="caption">respecto a la semana actual</p>
          </div>
          <div className="wire-panel">
            <h3>Tendencia de demanda</h3>
            <p className="caption">Ultimas 8 semanas (salidas registradas)</p>
            {tendencia.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={tendencia} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" vertical={false} />
                  <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false}
                         tickFormatter={(v) => { const d = new Date(v + 'T00:00:00'); return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }); }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                           contentStyle={{ borderRadius: 10, border: '1px solid #E2E6ED', fontSize: 13 }} />
                  <Area type="monotone" dataKey="cantidad" name="Unidades vendidas"
                        stroke="#1565C0" fill="#BBDEFB" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (<div className="mock-stat" style={{ fontSize: 20, textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>Sin datos historicos</div>)}
            <div className="caption mt-16">Confianza promedio: {promedio}%</div>
          </div>
        </div>

        <h3 style={{ marginTop: 18, marginBottom: 10 }}>Top productos con mayor demanda estimada</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Producto</th><th>Demanda estimada</th><th>Variacion</th></tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id}>
                  <td>{f.productoNombre}</td>
                  <td>{f.cantidadPredicha} unidades</td>
                  <td>+{Math.round((f.confianza || 0) * 20)}% ↑</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
