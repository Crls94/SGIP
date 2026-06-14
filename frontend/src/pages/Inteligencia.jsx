import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../components/ui/Toast';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import api from '../api/client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, ScatterChart, Scatter, LineChart, Line,
} from 'recharts';

const COLORS = ['#1565C0', '#7CB342', '#FF8F00', '#E53935', '#8E24AA', '#00ACC1', '#6D4C41'];
const RISK_COLORS = { ALTO: '#E53935', MEDIO: '#FF8F00', BAJO: '#43A047' };

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
  const [loading, setLoading] = useState(false);

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
        const diferencia = stockActual - (p.cantidadPredicha || 0);
        const riesgo = p.riesgo || calcularRiesgo(stockActual, puntoPedido, p.cantidadPredicha || 0);
        return {
          ...p,
          sku: p.sku || producto?.sku,
          categoriaNombre: p.categoriaNombre || producto?.categoriaNombre || 'Sin categoria',
          stockActual,
          puntoPedido,
          diferenciaStockPrediccion: p.diferenciaStockPrediccion ?? diferencia,
          riesgo,
        };
      });
  }, [predicciones, productoId, categoria, productoMap]);

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
        riesgo: p.riesgo,
      }));
  }, [prediccionesFiltradas]);

  const demandaCategoria = useMemo(() => {
    const grouped = {};
    prediccionesFiltradas.forEach((p) => {
      const key = p.categoriaNombre || 'Sin categoria';
      grouped[key] = (grouped[key] || 0) + (p.cantidadPredicha || 0);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [prediccionesFiltradas]);

  const riesgos = useMemo(() => {
    const grouped = { ALTO: 0, MEDIO: 0, BAJO: 0 };
    prediccionesFiltradas.forEach((p) => { grouped[p.riesgo || 'BAJO'] += 1; });
    return Object.entries(grouped).filter(([, value]) => value > 0).map(([name, value]) => ({ name, value }));
  }, [prediccionesFiltradas]);

  const dispersion = useMemo(() => {
    return prediccionesFiltradas.map((p) => ({
      producto: p.productoNombre,
      stock: p.stockActual || 0,
      demanda: p.cantidadPredicha || 0,
      riesgo: p.riesgo,
    }));
  }, [prediccionesFiltradas]);

  const confianzaPromedio = prediccionesFiltradas.length > 0
    ? Math.round((prediccionesFiltradas.reduce((acc, p) => acc + Number(p.confianza || 0), 0) / prediccionesFiltradas.length) * 100)
    : 0;
  const demandaTotal = prediccionesFiltradas.reduce((acc, p) => acc + (p.cantidadPredicha || 0), 0);
  const riesgoAlto = prediccionesFiltradas.filter((p) => p.riesgo === 'ALTO').length;

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
    setPeriodo('20');
    setFechaDesde(nextDesde);
    setFechaHasta(nextHasta);
    aplicarFiltros({ productoId: '', categoria: '', fechaDesde: nextDesde, fechaHasta: nextHasta });
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
          <button type="button" className="btn btn-primary" onClick={() => aplicarFiltros()} disabled={loading}>{loading ? 'Actualizando...' : 'Aplicar filtros'}</button>
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
          <Metric title="Registros Analizados" value={entrenamiento.length} suffix="registros" tone="neutral" />
        </div>
      </div>

      <div className="dashboard-charts">
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

        <ChartPanel title="Historico vs prediccion" subtitle="Comparacion de salidas reales con demanda estimada">
          <ResponsiveContainer width="100%" height={240}>
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
      </div>

      <div className="dashboard-charts" style={{ marginTop: 16 }}>
        <ChartPanel title="Top productos con mayor demanda" subtitle="Prediccion ordenada de mayor a menor">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topPredicciones} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="nombre" type="category" width={145} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="demanda" name="Demanda predicha" radius={[0, 6, 6, 0]}>
                {topPredicciones.map((p, i) => <Cell key={i} fill={RISK_COLORS[p.riesgo] || COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Stock actual vs demanda" subtitle="Comparativo para detectar quiebres potenciales">
          <ResponsiveContainer width="100%" height={280}>
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
        <ChartPanel title="Demanda por categoria" subtitle="Distribucion de unidades predichas">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={demandaCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {demandaCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} unidades`, 'Demanda']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Riesgo stock vs demanda" subtitle="Cada punto representa un producto">
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" />
              <XAxis type="number" dataKey="stock" name="Stock" />
              <YAxis type="number" dataKey="demanda" name="Demanda" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [v, n]} labelFormatter={(_, payload) => payload?.[0]?.payload?.producto || ''} />
              <Scatter data={dispersion} name="Productos" fill="#1565C0" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="dashboard-charts" style={{ marginTop: 16 }}>
        <ChartPanel title="Distribucion de riesgos" subtitle="Productos clasificados por nivel de riesgo">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={riesgos} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                {riesgos.map((r) => <Cell key={r.name} fill={RISK_COLORS[r.name]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 10 }}>Tabla predictiva de riesgo</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Producto</th><th>Categoria</th><th>Stock</th><th>Punto</th><th>Demanda</th><th>Diferencia</th><th>Riesgo</th><th>Confianza</th></tr>
              </thead>
              <tbody>
                {prediccionesFiltradas.slice(0, 12).map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.productoNombre}</strong><div className="micro">{p.sku}</div></td>
                    <td>{p.categoriaNombre}</td>
                    <td>{p.stockActual}</td>
                    <td>{p.puntoPedido}</td>
                    <td>{p.cantidadPredicha}</td>
                    <td>{p.diferenciaStockPrediccion}</td>
                    <td><span className={`badge ${p.riesgo === 'ALTO' ? 'badge-danger' : p.riesgo === 'MEDIO' ? 'badge-warning' : 'badge-success'}`}>{p.riesgo}</span></td>
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
  const color = tone === 'danger' ? '#E53935' : tone === 'success' ? '#43A047' : tone === 'info' ? '#1565C0' : 'var(--text-primary)';
  return (
    <div className="wire-panel">
      <div className="metric-label">{title}</div>
      <div className="mock-stat" style={{ color }}>{value}</div>
      <div className="caption">{suffix}</div>
    </div>
  );
}
