import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../components/ui/Toast';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import api from '../api/client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line,
} from 'recharts';

function weeksAgoDate(weeks) {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return d.toISOString().slice(0, 10);
}

export default function Inteligencia() {
  const toast = useToast();
  const [predicciones, setPredicciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [entrenamiento, setEntrenamiento] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [categoria, setCategoria] = useState('');
  const [fechaDesde, setFechaDesde] = useState(weeksAgoDate(20));
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().slice(0, 10));
  const [periodo, setPeriodo] = useState('20');
  const [filtroRiesgo, setFiltroRiesgo] = useState('');
  const [loading, setLoading] = useState(false);
  const [generandoAlertas, setGenerandoAlertas] = useState(false);

  const cargarPredicciones = async () => {
    try {
      const { data } = await api.get('/inteligencia/predicciones');
      setPredicciones(data || []);
    } catch {
      toast('No se pudo cargar predicciones', 'error');
    }
  };

  const cargarEntrenamiento = async (override = {}) => {
    const params = new URLSearchParams();
    const pid = override.productoId ?? productoId;
    const cat = override.categoria ?? categoria;
    const desde = override.fechaDesde ?? fechaDesde;
    const hasta = override.fechaHasta ?? fechaHasta;
    if (pid) params.set('productoId', pid);
    if (cat) params.set('categoria', cat);
    if (desde) params.set('fechaDesde', desde);
    if (hasta) params.set('fechaHasta', hasta);

    try {
      const { data } = await api.get(`/inteligencia/datos-entrenamiento?${params.toString()}`);
      setEntrenamiento(data || []);
    } catch {
      toast('No se pudo cargar datos historicos IA', 'error');
    }
  };

  useEffect(() => {
    cargarPredicciones();
    api.get('/productos?size=500').then((r) => setProductos(r.data?.content || [])).catch(() => {});
    cargarEntrenamiento();
  }, []);

  const categorias = useMemo(() => {
    return [...new Set(productos.map((p) => p.categoriaNombre).filter(Boolean))].sort();
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    return categoria ? productos.filter((p) => p.categoriaNombre === categoria) : productos;
  }, [productos, categoria]);

  const productoMap = useMemo(() => {
    return new Map(productos.map((p) => [String(p.id), p]));
  }, [productos]);

  const prediccionesFiltradas = useMemo(() => {
    return predicciones
      .filter((p) => !productoId || String(p.productoId) === String(productoId))
      .filter((p) => !categoria || (p.categoriaNombre || productoMap.get(String(p.productoId))?.categoriaNombre) === categoria)
      .map((p) => {
        const producto = productoMap.get(String(p.productoId));
        const stockActual = p.stockActual ?? producto?.stockActual ?? 0;
        const puntoPedido = p.puntoPedido ?? producto?.puntoPedido ?? 0;
        const demanda = p.cantidadPredicha || 0;
        const riesgo = p.riesgo || calcularRiesgo(stockActual, puntoPedido, demanda);
        const faltanteEstimado = Math.max(0, demanda - stockActual);
        const disponibleEstimado = Math.max(0, stockActual - demanda);
        return {
          ...p,
          sku: p.sku || producto?.sku,
          categoriaNombre: p.categoriaNombre || producto?.categoriaNombre || 'Sin categoria',
          stockActual,
          puntoPedido,
          faltanteEstimado,
          disponibleEstimado,
          accionSugerida: obtenerAccionSugerida(riesgo, faltanteEstimado, stockActual),
          riesgo,
        };
      })
      .filter((p) => {
        if (!filtroRiesgo) return true;
        if (filtroRiesgo === 'CON_FALTANTE') return p.faltanteEstimado > 0;
        return p.riesgo === filtroRiesgo;
      });
  }, [predicciones, productoId, categoria, productoMap, filtroRiesgo]);

  const tendencia = useMemo(() => {
    const weekly = {};
    entrenamiento.forEach((m) => {
      const d = new Date(m.fecha);
      const inicio = new Date(d);
      inicio.setDate(d.getDate() - d.getDay() + 1);
      const key = inicio.toISOString().slice(0, 10);
      weekly[key] = (weekly[key] || 0) + m.cantidad;
    });
    return Object.entries(weekly)
      .map(([semana, cantidad]) => ({ semana, historico: cantidad }))
      .sort((a, b) => a.semana.localeCompare(b.semana));
  }, [entrenamiento]);

  const comparativoHistoricoPrediccion = useMemo(() => {
    const base = [...tendencia];
    if (prediccionesFiltradas.length > 0) {
      const totalPredicho = prediccionesFiltradas.reduce((acc, p) => acc + (p.cantidadPredicha || 0), 0);
      const semana = prediccionesFiltradas[0].semanaInicio || 'Prediccion';
      base.push({ semana, prediccion: totalPredicho });
    }
    return base.slice(-12);
  }, [tendencia, prediccionesFiltradas]);

  const topPredicciones = useMemo(() => {
    return [...prediccionesFiltradas]
      .sort((a, b) => (b.cantidadPredicha || 0) - (a.cantidadPredicha || 0))
      .slice(0, 10)
      .map((p) => ({
        nombre: acortar(p.productoNombre, 22),
        demanda: p.cantidadPredicha || 0,
        stock: p.stockActual || 0,
      }));
  }, [prediccionesFiltradas]);

  const confianzaPromedio = prediccionesFiltradas.length > 0
    ? Math.round((prediccionesFiltradas.reduce((acc, p) => acc + Number(p.confianza || 0), 0) / prediccionesFiltradas.length) * 100)
    : 0;
  const demandaTotal = prediccionesFiltradas.reduce((acc, p) => acc + (p.cantidadPredicha || 0), 0);
  const riesgoAlto = prediccionesFiltradas.filter((p) => p.riesgo === 'ALTO').length;
  const riesgoMedio = prediccionesFiltradas.filter((p) => p.riesgo === 'MEDIO').length;
  const faltanteTotal = prediccionesFiltradas.reduce((acc, p) => acc + (p.faltanteEstimado || 0), 0);
  const recomendacionesReposicion = useMemo(() => {
    return [...prediccionesFiltradas]
      .filter((p) => p.riesgo === 'ALTO' || p.riesgo === 'MEDIO' || p.faltanteEstimado > 0)
      .sort((a, b) => {
        const prioridad = { ALTO: 0, MEDIO: 1, BAJO: 2 };
        return (prioridad[a.riesgo] - prioridad[b.riesgo]) || ((b.faltanteEstimado || 0) - (a.faltanteEstimado || 0));
      })
      .slice(0, 10);
  }, [prediccionesFiltradas]);

  const aplicarPeriodo = (weeks) => {
    const nextDesde = weeksAgoDate(Number(weeks));
    const nextHasta = new Date().toISOString().slice(0, 10);
    setPeriodo(weeks);
    setFechaDesde(nextDesde);
    setFechaHasta(nextHasta);
    aplicarFiltros({ fechaDesde: nextDesde, fechaHasta: nextHasta });
  };

  const aplicarFiltros = async (override = {}) => {
    setLoading(true);
    await Promise.all([cargarEntrenamiento(override), cargarPredicciones()]);
    setLoading(false);
  };

  const limpiarFiltros = () => {
    const nextDesde = weeksAgoDate(20);
    const nextHasta = new Date().toISOString().slice(0, 10);
    setProductoId('');
    setCategoria('');
    setFiltroRiesgo('');
    setPeriodo('20');
    setFechaDesde(nextDesde);
    setFechaHasta(nextHasta);
    aplicarFiltros({ productoId: '', categoria: '', fechaDesde: nextDesde, fechaHasta: nextHasta });
  };

  const generarAlertasPredictivas = async () => {
    setGenerandoAlertas(true);
    try {
      const { data } = await api.post('/inteligencia/alertas-predictivas/generar');
      const total = data?.length || 0;
      toast(total > 0 ? `${total} alerta(s) predictiva(s) generada(s)` : 'No hay nuevas alertas predictivas por generar', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'No se pudieron generar alertas predictivas', 'error');
    } finally {
      setGenerandoAlertas(false);
    }
  };

  const cambiarCategoria = (nextCategoria) => {
    setCategoria(nextCategoria);
    setProductoId('');
  };

  const selectedProduct = productoMap.get(String(productoId));
  const historicoVacio = !loading && entrenamiento.length === 0;
  const prediccionesVacias = !loading && prediccionesFiltradas.length === 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>IA Predictiva - Pronostico</h1>
          <span className="caption">Consulta la demanda estimada y el riesgo de quiebre por producto</span>
        </div>
        <span className="micro">Analisis predictivo</span>
      </div>

      <div className="card mb-24">
        <div className="filter-bar">
          <div style={{ minWidth: 280 }}>
            <SearchableSelect
              options={productosFiltrados}
              value={productoId}
              onChange={(id) => setProductoId(id)}
              placeholder="Buscar producto por nombre o SKU"
              searchFields={['nombre', 'sku', 'categoriaNombre']}
              renderOption={(p) => <div><strong>{p.nombre}</strong><div className="micro">{p.sku} · {p.categoriaNombre}</div></div>}
            />
          </div>
          <select className="form-input" value={categoria} onChange={(e) => cambiarCategoria(e.target.value)} style={{ maxWidth: 190 }}>
            <option value="">Todas las categorias</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="form-input" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} style={{ maxWidth: 160 }} />
          <input className="form-input" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} style={{ maxWidth: 160 }} />
          <select className="form-input" value={periodo} onChange={(e) => aplicarPeriodo(e.target.value)} style={{ maxWidth: 150 }}>
            <option value="4">4 semanas</option>
            <option value="8">8 semanas</option>
            <option value="12">12 semanas</option>
            <option value="20">20 semanas</option>
          </select>
          <select className="form-input" value={filtroRiesgo} onChange={(e) => setFiltroRiesgo(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">Todo riesgo</option>
            <option value="ALTO">Riesgo alto</option>
            <option value="MEDIO">Riesgo medio</option>
            <option value="BAJO">Riesgo bajo</option>
            <option value="CON_FALTANTE">Solo con faltante</option>
          </select>
          <button type="button" className="btn btn-primary" onClick={() => aplicarFiltros()} disabled={loading}>{loading ? 'Actualizando...' : 'Aplicar filtros'}</button>
          <button type="button" className="btn btn-accent" onClick={generarAlertasPredictivas} disabled={generandoAlertas || prediccionesFiltradas.length === 0}>
            {generandoAlertas ? 'Generando...' : 'Generar alertas IA'}
          </button>
          <button type="button" className="btn btn-outline" onClick={limpiarFiltros}>Limpiar</button>
        </div>

        <div style={{ marginTop: 12 }}>
          {selectedProduct && (
            <p className="caption">Producto seleccionado: <strong>{selectedProduct.nombre}</strong> · {selectedProduct.sku} · {selectedProduct.categoriaNombre}</p>
          )}
          {historicoVacio && (
            <div className="empty-state" style={{ padding: 18, marginTop: 10 }}>
              <strong>Sin historico para los filtros seleccionados.</strong>
              <p className="caption mt-8">Seleccione otro producto, cambie el rango de fechas o limpie los filtros.</p>
            </div>
          )}
          {!historicoVacio && prediccionesVacias && (
            <div className="empty-state" style={{ padding: 18, marginTop: 10 }}>
              <strong>Aun no hay una prediccion disponible para esta seleccion.</strong>
              <p className="caption mt-8">Actualice el pronostico o intente nuevamente mas tarde.</p>
            </div>
          )}
        </div>

        <div className="wire-card-grid mt-16">
          <Metric title="Demanda Predicha" value={demandaTotal} suffix="unidades" tone="info" />
          <Metric title="Confianza Promedio" value={`${confianzaPromedio}%`} suffix="modelo IA" tone="success" />
          <Metric title="Riesgo Alto" value={riesgoAlto} suffix="productos" tone="danger" />
          <Metric title="Revision Preventiva" value={riesgoMedio} suffix="productos" tone="warning" />
          <Metric title="Faltante Actual Estimado" value={faltanteTotal} suffix="unidades" tone="danger" />
          <Metric title="Registros Analizados" value={entrenamiento.length} suffix="registros" tone="neutral" />
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 10 }}>Recomendaciones de reposicion</h3>
        <p className="caption" style={{ marginTop: -4, marginBottom: 12 }}>Productos que requieren revision por riesgo de quiebre o faltante estimado.</p>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Producto</th><th>Categoria</th><th>Stock</th><th>Demanda</th><th>Faltante</th><th>Disponible estimado</th><th>Riesgo</th><th>Accion</th></tr>
            </thead>
            <tbody>
              {recomendacionesReposicion.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No hay productos con reposicion prioritaria para esta seleccion.</td></tr>
              ) : recomendacionesReposicion.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.productoNombre}</strong><div className="micro">{p.sku}</div></td>
                  <td>{p.categoriaNombre}</td>
                  <td>{p.stockActual}</td>
                  <td>{p.cantidadPredicha}</td>
                  <td>{p.faltanteEstimado}</td>
                  <td>{p.disponibleEstimado}</td>
                  <td><RiskBadge riesgo={p.riesgo} /></td>
                  <td><strong>{p.accionSugerida}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-charts">
        <ChartPanel title="Historico vs prediccion" subtitle="Comparacion de salidas reales con demanda estimada">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={comparativoHistoricoPrediccion} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" vertical={false} />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} tickFormatter={formatDateShort} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="historico" name="Historico" stroke="#1565C0" strokeWidth={2} connectNulls />
              <Line type="monotone" dataKey="prediccion" name="Prediccion" stroke="#E53935" strokeWidth={3} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Stock actual vs demanda" subtitle="Comparativo directo para decidir reposicion">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topPredicciones} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" vertical={false} />
              <XAxis dataKey="nombre" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="stock" name="Stock actual" fill="#1565C0" radius={[6, 6, 0, 0]} />
              <Bar dataKey="demanda" name="Demanda predicha" fill="#FF8F00" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="dashboard-charts" style={{ marginTop: 16 }}>
        <ChartPanel title="Tendencia historica semanal" subtitle="Salidas de inventario agrupadas por semana">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={tendencia} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" vertical={false} />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} tickFormatter={formatDateShort} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={formatDateLong} />
              <Area type="monotone" dataKey="historico" name="Unidades" stroke="#1565C0" fill="#BBDEFB" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 10 }}>Detalle predictivo</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Producto</th><th>Categoria</th><th>Stock</th><th>Punto</th><th>Demanda</th><th>Faltante</th><th>Disponible</th><th>Riesgo</th><th>Accion</th><th>Confianza</th></tr>
              </thead>
              <tbody>
                {prediccionesFiltradas.slice(0, 12).map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.productoNombre}</strong><div className="micro">{p.sku}</div></td>
                    <td>{p.categoriaNombre}</td>
                    <td>{p.stockActual}</td>
                    <td>{p.puntoPedido}</td>
                    <td>{p.cantidadPredicha}</td>
                    <td>{p.faltanteEstimado}</td>
                    <td>{p.disponibleEstimado}</td>
                    <td><RiskBadge riesgo={p.riesgo} /></td>
                    <td>{p.accionSugerida}</td>
                    <td>{Math.round(Number(p.confianza || 0) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function calcularRiesgo(stockActual, puntoPedido, demanda) {
  if (demanda > stockActual) return 'ALTO';
  if (stockActual - demanda <= Math.max(1, Math.floor((puntoPedido || 0) / 2))) return 'MEDIO';
  return 'BAJO';
}

function obtenerAccionSugerida(riesgo, faltanteEstimado, stockActual) {
  if (faltanteEstimado > 0 || stockActual <= 0 || riesgo === 'ALTO') return 'Reponer';
  if (riesgo === 'MEDIO') return 'Revisar';
  return 'Mantener';
}

function RiskBadge({ riesgo }) {
  const className = riesgo === 'ALTO' ? 'badge-danger' : riesgo === 'MEDIO' ? 'badge-warning' : 'badge-success';
  return <span className={`badge ${className}`}>{riesgo}</span>;
}

function acortar(text = '', max = 18) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function formatDateShort(v) {
  if (!v || v === 'Prediccion') return v;
  return new Date(`${v}T00:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

function formatDateLong(v) {
  if (!v || v === 'Prediccion') return v;
  return new Date(`${v}T00:00:00`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function ChartPanel({ title, subtitle, children }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 15 }}>{title}</h3>
        <p className="caption" style={{ marginTop: 2 }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Metric({ title, value, suffix, tone }) {
  const color = tone === 'danger' ? '#E53935' : tone === 'success' ? '#43A047' : tone === 'warning' ? '#FF8F00' : tone === 'info' ? '#1565C0' : 'var(--text-primary)';
  return (
    <div className="wire-panel">
      <div className="metric-label">{title}</div>
      <div className="mock-stat" style={{ color }}>{value}</div>
      <div className="caption">{suffix}</div>
    </div>
  );
}
