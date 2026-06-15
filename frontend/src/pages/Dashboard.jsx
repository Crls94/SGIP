import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import api from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#1565C0', '#FF8F00', '#7CB342', '#E53935', '#9C27B0', '#00BCD4', '#795548', '#607D8B'];

export default function Dashboard() {
  const { user, isAdmin, isGerente } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [pedidosData, setPedidosData] = useState([]);
  const [alertasData, setAlertasData] = useState([]);
  const [predicciones, setPredicciones] = useState([]);
  const [productosData, setProductosData] = useState([]);
  const [ventasData, setVentasData] = useState([]);

  useEffect(() => {
    if (!isAdmin && !isGerente) { navigate('/pedidos'); return; }
    api.get('/dashboard').then((res) => setData(res.data)).catch(() => toast('Error al cargar dashboard', 'error'));
    api.get('/pedidos/cola').then((res) => setPedidosData(res.data || [])).catch(() => {});
    api.get('/alertas/activas').then((res) => setAlertasData(res.data || [])).catch(() => {});
    api.get('/inteligencia/predicciones').then((res) => setPredicciones(res.data || [])).catch(() => {});
    api.get('/productos?size=100').then((res) => setProductosData(res.data?.content || [])).catch(() => {});
    api.get('/dashboard/ventas-7-dias').then((res) => setVentasData(res.data || [])).catch(() => {});
  }, []);

  if (!data) return <div className="empty-state"><div className="spinner spinner-dark" style={{ width: 32, height: 32 }} /></div>;

  const estadosCount = data.pedidosPorEstado || pedidosData.reduce((acc, p) => { acc[p.estado] = (acc[p.estado] || 0) + 1; return acc; }, {});
  const pedidosByEstado = Object.entries(estadosCount).map(([name, value]) => ({ name: translateEstado(name), value }));

  const canalCount = data.pedidosPorCanal || pedidosData.reduce((acc, p) => { acc[p.canal] = (acc[p.canal] || 0) + 1; return acc; }, {});
  const pedidosByCanal = Object.entries(canalCount).map(([name, value]) => ({ name: name === 'LOCAL' ? 'Local' : 'Delivery', value }));

  const prediccionesOperativas = predicciones.map((p) => {
    const stock = p.stockActual || 0;
    const demanda = p.cantidadPredicha || 0;
    const punto = p.puntoPedido || 0;
    const faltante = Math.max(0, demanda - stock);
    const riesgo = p.riesgo || (demanda > stock ? 'ALTO' : stock - demanda <= Math.max(1, Math.floor(punto / 2)) ? 'MEDIO' : 'BAJO');
    return { ...p, stock, demanda, faltante, riesgo };
  });

  const productosByStock = productosData.slice(0, 8).map(p => ({
    name: p.nombre?.length > 12 ? p.nombre.substring(0, 12) + '...' : p.nombre,
    stock: p.stockActual,
    puntoPedido: p.puntoPedido,
  }));

  const deliveryCount = pedidosData.filter(p => p.canal === 'DELIVERY').length;
  const localCount = pedidosData.filter(p => p.canal === 'LOCAL').length;
  const inventarioPorEstado = data.inventarioPorEstado || {};
  const stockOkCount = inventarioPorEstado.EN_STOCK ?? productosData.filter(p => p.stockActual > p.puntoPedido).length;
  const stockLowCount = inventarioPorEstado.STOCK_BAJO ?? productosData.filter(p => p.stockActual > 0 && p.stockActual <= p.puntoPedido).length;
  const stockZeroCount = inventarioPorEstado.SIN_STOCK ?? productosData.filter(p => p.stockActual <= 0).length;
  const stockByStatus = [
    { name: 'En Stock', value: stockOkCount, color: '#43A047' },
    { name: 'Stock Bajo', value: stockLowCount, color: '#FF8F00' },
    { name: 'Sin Stock', value: stockZeroCount, color: '#E53935' },
  ].filter(s => s.value > 0);
  const alertasIa = alertasData.filter((a) => a.origen === 'IA_PREDICTIVA').length;
  const alertasStock = alertasData.filter((a) => a.origen !== 'IA_PREDICTIVA').length;
  const productosEnRiesgo = prediccionesOperativas
    .filter((p) => p.riesgo === 'ALTO' || p.faltante > 0)
    .sort((a, b) => (b.faltante || 0) - (a.faltante || 0))
    .slice(0, 5);
  const riesgoIaTotal = prediccionesOperativas.filter((p) => p.riesgo === 'ALTO' || p.faltante > 0).length;
  const pedidosPendientes = Number(data.pedidosEnCola ?? 0);
  const riesgosIaPendientes = Math.max(0, riesgoIaTotal - alertasIa);
  const stockCritico = alertasData.filter((a) => a.origen !== 'IA_PREDICTIVA').slice(0, 4);
  const prioridad = obtenerPrioridadDashboard({ alertasStock, alertasIa, riesgoIaTotal, riesgosIaPendientes, pedidosPendientes, puedeVerPedidos: isAdmin });
  const accionesOperativas = [
    ...productosEnRiesgo.slice(0, 3).map((p) => ({
      id: `ia-${p.id}`,
      titulo: p.productoNombre,
      detalle: `Faltante estimado ${p.faltante} · Demanda ${p.demanda} · Stock ${p.stock}`,
      badge: p.riesgo === 'ALTO' || p.faltante > 0 ? 'Reponer' : 'Revisar',
      badgeClass: p.riesgo === 'ALTO' || p.faltante > 0 ? 'badge-danger' : 'badge-warning',
    })),
    ...stockCritico.slice(0, 2).map((a) => ({
      id: `stock-${a.id}`,
      titulo: a.productoNombre,
      detalle: `Stock actual ${a.stockAlGenerar} · Punto de pedido ${a.puntoPedidoReferencia}`,
      badge: 'Stock actual',
      badgeClass: 'badge-warning',
    })),
  ].slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hola, {user?.nombre || (isGerente ? 'Gerente' : 'Administrador')}</h1>
          <span className="caption">Resumen general de la tienda</span>
        </div>
        <span className="micro">Dashboard principal</span>
      </div>

      <div className="card mb-16" style={{ padding: 20, borderLeft: `4px solid ${prioridad.color}` }}>
        <div className="card-header">
          <div>
            <h2 style={{ fontSize: 20 }}>Prioridad del dia: {prioridad.titulo}</h2>
            <p className="caption mt-8">
              {prioridad.descripcion}
            </p>
            <p className="caption mt-8">Pendientes: stock {alertasStock} · riesgos IA {riesgoIaTotal} · alertas IA {alertasIa} · pedidos {pedidosPendientes}</p>
          </div>
          <div className="flex-row" style={{ gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate(prioridad.ruta)}>{prioridad.accion}</button>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/alertas')}>Alertas</button>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/inteligencia')}>IA</button>
          </div>
        </div>
      </div>

      <div className="insight-metrics mb-16">
        <WireMetric title="Stock critico actual" value={alertasStock} suffix="alertas activas" tone="warning" />
        <WireMetric title="Riesgo predictivo" value={riesgoIaTotal} suffix="detectados por IA" tone="warning" />
        <WireMetric title="Alertas IA" value={alertasIa} suffix={riesgosIaPendientes > 0 ? 'faltan por enviar' : 'activas'} tone="info" />
        <WireMetric title="Pedidos pendientes" value={pedidosPendientes} suffix={`Venta hoy S/ ${Math.round(Number(data.ventaHoy ?? 0)).toLocaleString('es-PE')}`} tone="success" />
      </div>

      <div className="card mb-24" style={{ padding: 20 }}>
        <div className="card-header mb-16">
          <div>
            <h2 style={{ fontSize: 18 }}>Que hacer ahora</h2>
            <p className="caption mt-8">Acciones cortas para priorizar reposicion, IA y pedidos sin revisar toda la operacion.</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/alertas')}>Ver alertas</button>
        </div>
        <div className="dashboard-charts">
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Acciones sugeridas</h3>
            <div className="table-wrapper">
              <table className="table">
                <tbody>
                  {accionesOperativas.length === 0 && pedidosPendientes === 0 ? (
                    <tr><td><strong>Operacion estable</strong><div className="micro">Sin reposicion prioritaria ni pedidos pendientes.</div></td><td><span className="badge badge-success">OK</span></td></tr>
                  ) : accionesOperativas.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.titulo}</strong><div className="micro">{a.detalle}</div></td>
                      <td><span className={`badge ${a.badgeClass}`}>{a.badge}</span></td>
                    </tr>
                  ))}
                  {pedidosPendientes > 0 && (
                    <tr>
                      <td><strong>Preparar pedidos pendientes</strong><div className="micro">Local {localCount} · Delivery {deliveryCount}</div></td>
                      <td><span className="badge badge-info">{pedidosPendientes}</span></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Recomendacion IA</h3>
            <div className="card" style={{ padding: 16, minHeight: 168, borderLeft: `3px solid ${riesgoIaTotal > 0 ? '#FF8F00' : '#43A047'}` }}>
              <strong>{obtenerTituloIa(riesgoIaTotal, alertasIa)}</strong>
              <p className="caption mt-8">{obtenerMensajeIa(riesgoIaTotal, alertasIa, riesgosIaPendientes)}</p>
              <div className="flex-row flex-wrap mt-16" style={{ gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => navigate(riesgoIaTotal > 0 ? '/inteligencia' : '/productos')}>{riesgoIaTotal > 0 ? 'Ver analisis IA' : 'Ver inventario'}</button>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/alertas')}>Ver alertas</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-header mb-16" style={{ marginTop: 8 }}>
        <div>
          <h2 style={{ fontSize: 18 }}>Indicadores de operacion</h2>
          <p className="caption mt-8">Graficas de apoyo para revisar ventas, pedidos e inventario.</p>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="wire-panel wire-panel-tall">
          <h3>Ventas Ultimos 7 dias</h3>
          <p className="caption mt-8">Total de ventas por dia segun pedidos registrados</p>
          {ventasData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ventasData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false}
                       tickFormatter={(v) => { const d = new Date(v + 'T00:00:00'); return d.toLocaleDateString('es-PE', { weekday: 'short' }); }} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`S/ ${Number(v).toLocaleString('es-PE')}`, 'Ventas']}
                         labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' })}
                         contentStyle={{ borderRadius: 10, border: '1px solid #E2E6ED', fontSize: 13 }} />
                <Bar dataKey="total" name="Ventas" fill="#1565C0" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (<p className="caption mt-16">Cargando datos de ventas...</p>)}
        </div>

        <div className="wire-panel wire-panel-tall">
          <h3>Estado de Pedidos</h3>
          <p className="caption mt-8">Distribucion por estado actual</p>
          {pedidosByEstado.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={pedidosByEstado} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E6ED', fontSize: 13 }} />
                <Bar dataKey="value" name="Pedidos" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {pedidosByEstado.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (<p className="caption mt-16">Sin datos de pedidos</p>)}
        </div>
      </div>

      <div className="dashboard-charts" style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}><h3 style={{ fontSize: 15 }}>Pedidos por Canal</h3><p className="caption" style={{ marginTop: 2 }}>Local: {localCount} · Delivery: {deliveryCount}</p></div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pedidosByCanal} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E6ED', fontSize: 13 }} />
              <Bar dataKey="value" name="Pedidos" fill="#1565C0" radius={[6, 6, 0, 0]} maxBarSize={54} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}><h3 style={{ fontSize: 15 }}>Estado del Inventario</h3><p className="caption" style={{ marginTop: 2 }}>Productos por nivel de stock</p></div>
          {stockByStatus.length > 0 ? (
            <div>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 16 }}>
                {stockByStatus.map(s => (
                  <div key={s.name} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div className="micro" style={{ color: 'var(--text-tertiary)', marginTop: 2 }}>{s.name}</div>
                  </div>
                ))}
              </div>
              {productosByStock.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={productosByStock} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6B7280' }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E6ED', fontSize: 13 }} />
                    <Bar dataKey="puntoPedido" name="Punto de pedido" fill="#BBDEFB" radius={[0, 4, 4, 0]} maxBarSize={18} />
                    <Bar dataKey="stock" name="Stock actual" fill="#1565C0" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (<div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Sin datos de inventario</div>)}
        </div>
      </div>
    </div>
  );
}

function translateEstado(e) {
  const map = { PENDIENTE: 'Pendiente', EN_PROCESO: 'En Proceso', LISTO: 'Listo', DESPACHADO: 'Despachado', CANCELADO: 'Cancelado' };
  return map[e] || e;
}

function obtenerPrioridadDashboard({ alertasStock, alertasIa, riesgoIaTotal, riesgosIaPendientes, pedidosPendientes, puedeVerPedidos }) {
  if (alertasStock > 0) {
    return {
      titulo: 'revisar stock critico',
      descripcion: `Hay ${alertasStock} alerta(s) de stock actual. Atienda primero los productos que ya llegaron al punto de pedido.`,
      accion: 'Ver alertas',
      ruta: '/alertas',
      color: '#E53935',
    };
  }
  if (riesgosIaPendientes > 0) {
    return {
      titulo: 'revisar riesgo predictivo',
      descripcion: `La IA detecto ${riesgoIaTotal} producto(s) en riesgo y ${riesgosIaPendientes} aun no estan enviados a Alertas.`,
      accion: 'Ver IA',
      ruta: '/inteligencia',
      color: '#FF8F00',
    };
  }
  if (alertasIa > 0) {
    return {
      titulo: 'atender alertas predictivas',
      descripcion: `Hay ${alertasIa} alerta(s) predictiva(s) listas en la bandeja operativa para decidir reposicion.`,
      accion: 'Ver alertas',
      ruta: '/alertas',
      color: '#FF8F00',
    };
  }
  if (pedidosPendientes > 0) {
    return {
      titulo: 'preparar pedidos pendientes',
      descripcion: `Hay ${pedidosPendientes} pedido(s) esperando atencion. Revise preparacion y despacho.`,
      accion: puedeVerPedidos ? 'Ver pedidos' : 'Ver resumen',
      ruta: puedeVerPedidos ? '/pedidos' : '/dashboard',
      color: '#1565C0',
    };
  }
  return {
    titulo: 'operacion estable',
    descripcion: 'No hay alertas activas ni pedidos pendientes. Mantenga el monitoreo de inventario y ventas.',
    accion: 'Ver inventario',
    ruta: '/productos',
    color: '#43A047',
  };
}

function obtenerTituloIa(riesgoIaTotal, alertasIa) {
  if (riesgoIaTotal === 0) return 'Sin riesgos predictivos activos.';
  if (alertasIa > 0) return 'Riesgos predictivos ya enviados a Alertas.';
  return 'Riesgos predictivos pendientes de accion.';
}

function obtenerMensajeIa(riesgoIaTotal, alertasIa, riesgosIaPendientes) {
  if (riesgoIaTotal === 0) {
    return 'La ultima prediccion no muestra faltantes urgentes. Revise IA si necesita analizar otra categoria o periodo.';
  }
  if (alertasIa > 0 && riesgosIaPendientes === 0) {
    return `Hay ${alertasIa} alerta(s) IA activa(s). Use la bandeja de Alertas para coordinar reposicion y cierre operativo.`;
  }
  return `Hay ${riesgosIaPendientes} riesgo(s) predictivo(s) pendiente(s) de enviar a Alertas. Revise IA antes de registrar nuevas salidas.`;
}

function WireMetric({ title, value, suffix, tone }) {
  const color = tone === 'warning' ? '#f59e0b' : tone === 'success' ? '#16a34a' : tone === 'info' ? '#2563eb' : 'var(--text-primary)';
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

const colorMap = {
  danger: { bg: '#FFEBEE', icon: '#E53935', border: '#FFCDD2' },
  warning: { bg: '#FFF8E1', icon: '#FF8F00', border: '#FFE0B2' },
  info: { bg: '#E3F2FD', icon: '#1565C0', border: '#BBDEFB' },
  accent: { bg: '#F1F8E9', icon: '#558B2F', border: '#C5E1A5' },
  neutral: { bg: '#F5F5F5', icon: '#9E9E9E', border: '#E0E0E0' },
};

function MetricCard({ icon, value, label, sublabel, color }) {
  const c = colorMap[color] || colorMap.info;
  return (
    <div className="card metric-card" style={{ borderTopColor: c.icon }}>
      <div className="metric-icon" style={{ background: c.bg, color: c.icon }}>{icon}</div>
      <div className="metric-value" style={{ color: c.icon }}>{value}</div>
      <div className="metric-label">{label}</div>
      {sublabel && <div className="micro" style={{ marginTop: 3 }}>{sublabel}</div>}
    </div>
  );
}
