import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import api from '../api/client';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line,
} from 'recharts';

function weeksAgoDate(weeks) {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return d.toISOString().slice(0, 10);
}

export default function Inteligencia() {
  const toast = useToast();
  const navigate = useNavigate();
  const fechaDesdeInicial = weeksAgoDate(20);
  const fechaHastaInicial = new Date().toISOString().slice(0, 10);
  const [predicciones, setPredicciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [entrenamiento, setEntrenamiento] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [categoria, setCategoria] = useState('');
  const [fechaDesde, setFechaDesde] = useState(fechaDesdeInicial);
  const [fechaHasta, setFechaHasta] = useState(fechaHastaInicial);
  const [periodo, setPeriodo] = useState('20');
  const [filtroRiesgo, setFiltroRiesgo] = useState('');
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    productoId: '',
    categoria: '',
    fechaDesde: fechaDesdeInicial,
    fechaHasta: fechaHastaInicial,
    filtroRiesgo: '',
  });
  const [loading, setLoading] = useState(false);
  const [generandoAlertas, setGenerandoAlertas] = useState(false);
  const [alertasGeneradas, setAlertasGeneradas] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

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
    const pid = override.productoId ?? filtrosAplicados.productoId;
    const cat = override.categoria ?? filtrosAplicados.categoria;
    const desde = override.fechaDesde ?? filtrosAplicados.fechaDesde;
    const hasta = override.fechaHasta ?? filtrosAplicados.fechaHasta;
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
      .filter((p) => !filtrosAplicados.productoId || String(p.productoId) === String(filtrosAplicados.productoId))
      .filter((p) => !filtrosAplicados.categoria || (p.categoriaNombre || productoMap.get(String(p.productoId))?.categoriaNombre) === filtrosAplicados.categoria)
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
        if (!filtrosAplicados.filtroRiesgo) return true;
        if (filtrosAplicados.filtroRiesgo === 'CON_FALTANTE') return p.faltanteEstimado > 0;
        return p.riesgo === filtrosAplicados.filtroRiesgo;
      });
  }, [predicciones, filtrosAplicados, productoMap]);

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
      if (base.length > 0) {
        base[base.length - 1] = { ...base[base.length - 1], proyeccion: base[base.length - 1].historico };
      }
      base.push({ semana, prediccion: totalPredicho, proyeccion: totalPredicho });
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

  const precisionValores = prediccionesFiltradas
    .map((p) => p.precisionPorcentaje)
    .filter((v) => v !== null && v !== undefined);
  const precisionPromedio = precisionValores.length > 0
    ? Math.round(precisionValores.reduce((acc, v) => acc + Number(v || 0), 0) / precisionValores.length)
    : null;
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
    const nextFiltros = {
      productoId: override.productoId ?? productoId,
      categoria: override.categoria ?? categoria,
      fechaDesde: override.fechaDesde ?? fechaDesde,
      fechaHasta: override.fechaHasta ?? fechaHasta,
      filtroRiesgo: override.filtroRiesgo ?? filtroRiesgo,
    };
    setLoading(true);
    setFiltrosAplicados(nextFiltros);
    await Promise.all([cargarEntrenamiento(nextFiltros), cargarPredicciones()]);
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
    aplicarFiltros({ productoId: '', categoria: '', fechaDesde: nextDesde, fechaHasta: nextHasta, filtroRiesgo: '' });
  };

  const generarAlertasPredictivas = async () => {
    setGenerandoAlertas(true);
    try {
      const { data } = await api.post('/inteligencia/alertas-predictivas/generar');
      const total = data?.length || 0;
      setAlertasGeneradas(total);
      toast(total > 0 ? `${total} alerta(s) predictiva(s) enviada(s) a Alertas` : 'No hay nuevas alertas predictivas por generar', 'success');
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

  const selectedProduct = productoMap.get(String(filtrosAplicados.productoId));
  const filtrosPendientes = productoId !== filtrosAplicados.productoId
    || categoria !== filtrosAplicados.categoria
    || fechaDesde !== filtrosAplicados.fechaDesde
    || fechaHasta !== filtrosAplicados.fechaHasta
    || filtroRiesgo !== filtrosAplicados.filtroRiesgo;
  const hayHistorico = entrenamiento.length > 0;
  const hayPredicciones = prediccionesFiltradas.length > 0;
  const hayComparativo = comparativoHistoricoPrediccion.length > 0;
  const hayTopPredicciones = topPredicciones.length > 0;
  const hayRecomendaciones = recomendacionesReposicion.length > 0;
  const historicoVacio = !loading && !hayHistorico;
  const prediccionesVacias = !loading && !hayPredicciones;
  const sinDatosAnalisis = !loading && !hayHistorico && !hayPredicciones;

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
            <option value="">Vista general</option>
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
          <button type="button" className="btn btn-outline" onClick={limpiarFiltros}>Limpiar</button>
        </div>

        {filtrosPendientes && (
          <div className="empty-state" style={{ padding: 14, marginTop: 12, alignItems: 'flex-start', textAlign: 'left' }}>
            <strong>Filtros pendientes por aplicar.</strong>
            <p className="caption mt-8">Los datos visibles aun corresponden a la ultima consulta aplicada. Presione Aplicar filtros para actualizar historico, prediccion y metricas.</p>
          </div>
        )}

        {alertasGeneradas !== null && (
          <div className="empty-state" style={{ padding: 18, marginTop: 12, alignItems: 'flex-start', textAlign: 'left' }}>
            <strong>{alertasGeneradas > 0 ? 'Alertas predictivas enviadas.' : 'Sin nuevas alertas predictivas.'}</strong>
            <p className="caption mt-8">
              {alertasGeneradas > 0
                ? 'Revisa la bandeja de Alertas para ver el detalle operativo y decidir la reposicion.'
                : 'Los productos en riesgo ya tienen alertas activas o no requieren accion adicional.'}
            </p>
            <button type="button" className="btn btn-primary btn-sm mt-12" onClick={() => navigate('/alertas')}>
              Ver alertas
            </button>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          {selectedProduct && (
            <p className="caption">Producto seleccionado: <strong>{selectedProduct.nombre}</strong> · {selectedProduct.sku} · {selectedProduct.categoriaNombre}</p>
          )}
          {sinDatosAnalisis && (
            <div className="empty-state" style={{ padding: 18, marginTop: 10 }}>
              <strong>No hay datos suficientes para analizar esta seleccion.</strong>
              <p className="caption mt-8">Seleccione otro producto, cambie el rango de fechas o limpie los filtros.</p>
            </div>
          )}
          {!historicoVacio && prediccionesVacias && (
            <div className="empty-state" style={{ padding: 18, marginTop: 10 }}>
              <strong>Hay historico, pero todavia no hay prediccion IA para esta seleccion.</strong>
              <p className="caption mt-8">Actualice el pronostico IA o intente con otra categoria/producto.</p>
            </div>
          )}
          {historicoVacio && hayPredicciones && (
            <div className="empty-state" style={{ padding: 18, marginTop: 10 }}>
              <strong>Hay prediccion disponible, pero no hay historico en el rango seleccionado.</strong>
              <p className="caption mt-8">La demanda estimada se mantiene visible; cambie el periodo si necesita comparar con salidas reales.</p>
            </div>
          )}
        </div>

      </div>

      {(hayComparativo || hayTopPredicciones) && (
        <div
          className="dashboard-charts mb-16"
          style={{ gridTemplateColumns: hayComparativo && hayTopPredicciones ? undefined : '1fr' }}
        >
          {hayComparativo && (
            <ChartPanel title={obtenerTituloComparativo(hayHistorico, hayPredicciones)} subtitle={obtenerSubtituloComparativo(hayHistorico, hayPredicciones)}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={comparativoHistoricoPrediccion} margin={{ top: 10, right: 18, left: -8, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" vertical={false} />
                  <XAxis dataKey="semana" tick={{ fontSize: 10 }} tickFormatter={formatDateShort} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  {hayHistorico && <Line type="monotone" dataKey="historico" name="Historico" stroke="#1565C0" strokeWidth={2} connectNulls />}
                  {hayHistorico && hayPredicciones && <Line type="monotone" dataKey="proyeccion" name="Proyeccion IA" stroke="#E53935" strokeWidth={2} strokeDasharray="5 5" connectNulls dot={false} />}
                  {hayPredicciones && <Line type="monotone" dataKey="prediccion" name="Prediccion" stroke="#E53935" strokeWidth={3} connectNulls />}
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}

          {hayTopPredicciones && (
            <ChartPanel title="Stock actual vs demanda" subtitle="Comparativo directo para decidir reposicion">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topPredicciones} margin={{ top: 5, right: 16, left: -8, bottom: 5 }}>
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
          )}
        </div>
      )}

      {(hayHistorico || hayPredicciones) && (
        <div className="insight-metrics mb-16">
          {hayPredicciones && <Metric title="Demanda" value={demandaTotal} suffix="unidades" tone="info" />}
          {hayPredicciones && <Metric title="Faltante" value={faltanteTotal} suffix="unidades" tone="danger" />}
          {hayPredicciones && <Metric title="Riesgo alto" value={riesgoAlto} suffix="productos" tone="danger" />}
          {hayPredicciones && <Metric title="Revision" value={riesgoMedio} suffix="productos" tone="warning" />}
          {hayPredicciones && <Metric title="Precision" value={precisionPromedio !== null ? `${precisionPromedio}%` : 'Pendiente'} suffix="semana cerrada" tone="success" />}
          {hayHistorico && <Metric title="Registros" value={entrenamiento.length} suffix="analizados" tone="neutral" />}
        </div>
      )}

      {hayPredicciones && (
      <div className="dashboard-charts mb-16">
        <div className="card" style={{ padding: 20 }}>
          <div className="card-header mb-16">
            <div>
              <h3 style={{ fontSize: 18 }}>Prioridad de reposicion</h3>
              <p className="caption mt-8">Productos exactos que requieren atencion por faltante, riesgo o stock bajo.</p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setFiltroRiesgo('CON_FALTANTE');
                aplicarFiltros({ filtroRiesgo: 'CON_FALTANTE' });
              }}
            >
              Ver faltantes
            </button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Producto</th><th>Categoria</th><th>Stock</th><th>Demanda</th><th>Faltante</th><th>Riesgo</th><th>Accion</th></tr>
              </thead>
              <tbody>
                {!hayRecomendaciones ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No hay productos con reposicion prioritaria para esta seleccion.</td></tr>
                ) : recomendacionesReposicion.slice(0, 6).map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.productoNombre}</strong><div className="micro">{p.sku}</div></td>
                    <td>{p.categoriaNombre}</td>
                    <td>{p.stockActual}</td>
                    <td>{p.cantidadPredicha}</td>
                    <td><span className={p.faltanteEstimado > 0 ? 'badge badge-danger' : 'badge badge-warning'}>{p.faltanteEstimado}</span></td>
                    <td><RiskBadge riesgo={p.riesgo} /></td>
                    <td><strong>{p.accionSugerida}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 18, marginBottom: 12 }}>Resumen de riesgo</h3>
          <div className="stat-row"><span className="stat-label">Productos con riesgo alto</span><span className="badge badge-danger">{riesgoAlto}</span></div>
          <div className="stat-row"><span className="stat-label">Productos en revision preventiva</span><span className="badge badge-warning">{riesgoMedio}</span></div>
          <div className="stat-row"><span className="stat-label">Faltante estimado total</span><strong className="stat-value">{faltanteTotal} unidades</strong></div>
          <div className="stat-row"><span className="stat-label">Demanda predicha total</span><strong className="stat-value">{demandaTotal} unidades</strong></div>
          <div className="stat-row"><span className="stat-label">Precision real</span><strong className="stat-value">{precisionPromedio !== null ? `${precisionPromedio}%` : 'Pendiente'}</strong></div>
          <button type="button" className="btn btn-accent btn-sm mt-16" onClick={generarAlertasPredictivas} disabled={generandoAlertas || prediccionesFiltradas.length === 0}>
            {generandoAlertas ? 'Enviando...' : 'Enviar alertas predictivas'}
          </button>
        </div>
      </div>
      )}

      {hayPredicciones && (
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
          <div className="card-header mb-16">
            <div>
              <h3 style={{ marginBottom: 4 }}>Detalle predictivo</h3>
              <p className="caption">Tabla completa para auditoria operativa. Expandir solo si se necesita revisar producto por producto.</p>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setMostrarDetalle(!mostrarDetalle)}>
              {mostrarDetalle ? 'Ocultar detalle' : 'Mostrar detalle completo'}
            </button>
          </div>
          {mostrarDetalle && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Producto</th><th>Categoria</th><th>Stock</th><th>Punto</th><th>Demanda</th><th>Real</th><th>Faltante</th><th>Disponible</th><th>Riesgo</th><th>Accion</th><th>Confianza</th><th>Precision</th></tr>
              </thead>
              <tbody>
                {prediccionesFiltradas.slice(0, 12).map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.productoNombre}</strong><div className="micro">{p.sku}</div></td>
                    <td>{p.categoriaNombre}</td>
                    <td>{p.stockActual}</td>
                    <td>{p.puntoPedido}</td>
                    <td>{p.cantidadPredicha}</td>
                    <td>{p.cantidadReal ?? 'Pendiente'}</td>
                    <td>{p.faltanteEstimado}</td>
                    <td>{p.disponibleEstimado}</td>
                    <td><RiskBadge riesgo={p.riesgo} /></td>
                    <td>{p.accionSugerida}</td>
                    <td>{Math.round(Number(p.confianza || 0) * 100)}%</td>
                    <td>{p.precisionPorcentaje !== null && p.precisionPorcentaje !== undefined ? `${Math.round(Number(p.precisionPorcentaje))}%` : 'Pendiente'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
      </div>
      )}
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

function obtenerTituloComparativo(hayHistorico, hayPredicciones) {
  if (hayHistorico && hayPredicciones) return 'Historico vs prediccion';
  if (hayHistorico) return 'Historico de salidas';
  return 'Demanda predicha';
}

function obtenerSubtituloComparativo(hayHistorico, hayPredicciones) {
  if (hayHistorico && hayPredicciones) return 'Linea azul: salidas reales. Linea punteada y punto rojo: proyeccion IA.';
  if (hayHistorico) return 'Salidas reales disponibles para el rango seleccionado';
  return 'Pronostico disponible sin historico en el rango seleccionado';
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
    <div className="insight-metric-card">
      <div>
        <div className="metric-label">{title}</div>
        <div className="caption">{suffix}</div>
      </div>
      <div className="insight-metric-value" style={{ color }}>{value}</div>
    </div>
  );
}
