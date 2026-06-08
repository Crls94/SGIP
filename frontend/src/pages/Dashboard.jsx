import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import api from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#1565C0', '#FF8F00', '#7CB342', '#E53935', '#9C27B0', '#00BCD4', '#795548', '#607D8B'];
const CANAL_COLORS = ['#1565C0', '#FF8F00'];

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

  const alertasByProducto = alertasData.slice(0, 8).map(a => ({
    name: a.productoNombre?.length > 14 ? a.productoNombre.substring(0, 14) + '...' : a.productoNombre || 'N/A',
    stock: a.stockAlGenerar,
    puntoPedido: a.puntoPedidoReferencia,
  }));

  const topPredicciones = predicciones.slice(0, 6).map(p => ({
    name: p.productoNombre?.length > 12 ? p.productoNombre.substring(0, 12) + '...' : p.productoNombre || 'N/A',
    cantidad: p.cantidadPredicha,
    confianza: Math.round((p.confianza || 0) * 100),
  }));

  const productosByStock = productosData.slice(0, 8).map(p => ({
    name: p.nombre?.length > 12 ? p.nombre.substring(0, 12) + '...' : p.nombre,
    stock: p.stockActual,
    puntoPedido: p.puntoPedido,
  }));

  const totalPedidos = pedidosData.length;
  const deliveryCount = pedidosData.filter(p => p.canal === 'DELIVERY').length;
  const localCount = pedidosData.filter(p => p.canal === 'LOCAL').length;
  const deliveryPct = totalPedidos > 0 ? Math.round((deliveryCount / totalPedidos) * 100) : 0;

  const inventarioPorEstado = data.inventarioPorEstado || {};
  const stockOkCount = inventarioPorEstado.EN_STOCK ?? productosData.filter(p => p.stockActual > p.puntoPedido).length;
  const stockLowCount = inventarioPorEstado.STOCK_BAJO ?? productosData.filter(p => p.stockActual > 0 && p.stockActual <= p.puntoPedido).length;
  const stockZeroCount = inventarioPorEstado.SIN_STOCK ?? productosData.filter(p => p.stockActual <= 0).length;
  const stockByStatus = [
    { name: 'En Stock', value: stockOkCount, color: '#43A047' },
    { name: 'Stock Bajo', value: stockLowCount, color: '#FF8F00' },
    { name: 'Sin Stock', value: stockZeroCount, color: '#E53935' },
  ].filter(s => s.value > 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hola, {user?.nombre || (isGerente ? 'Gerente' : 'Administrador')}</h1>
          <span className="caption">Resumen general de la tienda</span>
        </div>
        <span className="micro">Dashboard principal</span>
      </div>

      <div className="wire-card-grid mb-24">
        <WireMetric title="Stock Critico" value={data.alertasStockCritico ?? 0} suffix="productos" tone="warning" />
        <WireMetric title="Pedidos Pendientes" value={data.pedidosEnCola ?? 0} suffix="pedidos" tone="info" />
        <WireMetric title="Venta Hoy" value={`S/ ${Math.round(Number(data.ventaHoy ?? 0)).toLocaleString('es-PE')}`} suffix="pedidos no cancelados" tone="success" />
        <WireMetric title="Productos Activos" value={Number(data.productosActivos ?? productosData.length).toLocaleString('es-PE')} suffix="productos" tone="neutral" />
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
          <h3>Prediccion IA - Proxima Semana</h3>
          <p className="caption mt-8">Demanda estimada por producto</p>
          {topPredicciones.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topPredicciones} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E6ED', fontSize: 13 }} />
                <Bar dataKey="cantidad" name="Unidades" fill="#7CB342" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (<p className="caption mt-16">Sin predicciones disponibles</p>)}
          {predicciones.length > 0 && (
            <p className="caption mt-8">
              Confianza promedio: {Math.round(predicciones.reduce((a, p) => a + (p.confianza || 0), 0) / predicciones.length * 100)}%
            </p>
          )}
        </div>
      </div>

      <div className="dashboard-charts" style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}><h3 style={{ fontSize: 15 }}>Pedidos por Canal</h3><p className="caption" style={{ marginTop: 2 }}>Distribucion local vs delivery</p></div>
          {pedidosByCanal.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pedidosByCanal} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                  {pedidosByCanal.map((_, i) => <Cell key={i} fill={CANAL_COLORS[i % CANAL_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} pedidos`, n]} />
                <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (<div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Sin datos de pedidos</div>)}
          {totalPedidos > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: '#1565C0' }} /><span className="caption">Local ({localCount}) - {100 - deliveryPct}%</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: '#FF8F00' }} /><span className="caption">Delivery ({deliveryCount}) - {deliveryPct}%</span></div>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}><h3 style={{ fontSize: 15 }}>Estado de Pedidos</h3><p className="caption" style={{ marginTop: 2 }}>Distribucion por estado actual</p></div>
          {pedidosByEstado.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pedidosByEstado} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E6ED', fontSize: 13 }} />
                <Bar dataKey="value" name="Pedidos" radius={[6, 6, 0, 0]} maxBarSize={48}>{pedidosByEstado.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (<div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Sin datos de pedidos</div>)}
        </div>
      </div>

      <div className="dashboard-charts" style={{ marginTop: 16 }}>
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

        <div className="card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}><h3 style={{ fontSize: 15 }}>Predicciones de Demanda</h3><p className="caption" style={{ marginTop: 2 }}>Cantidad predicha por producto</p></div>
          {topPredicciones.length > 0 ? (
            <div>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#7CB342' }}>{predicciones.length}</div>
                  <div className="micro" style={{ color: 'var(--text-tertiary)', marginTop: 2 }}>Productos predichos</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#1565C0' }}>
                    {predicciones.length > 0 ? `${Math.round(predicciones.reduce((a, p) => a + (p.confianza || 0), 0) / predicciones.length * 100)}%` : '--'}
                  </div>
                  <div className="micro" style={{ color: 'var(--text-tertiary)', marginTop: 2 }}>Confianza promedio</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topPredicciones} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E6ED', fontSize: 13 }} />
                  <Bar dataKey="cantidad" name="Unidades predichas" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {topPredicciones.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (<div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Sin predicciones disponibles</div>)}
        </div>
      </div>
    </div>
  );
}

function translateEstado(e) {
  const map = { PENDIENTE: 'Pendiente', EN_PROCESO: 'En Proceso', LISTO: 'Listo', DESPACHADO: 'Despachado', CANCELADO: 'Cancelado' };
  return map[e] || e;
}

function WireMetric({ title, value, suffix, tone }) {
  const color = tone === 'warning' ? '#f59e0b' : tone === 'success' ? '#16a34a' : tone === 'info' ? '#2563eb' : 'var(--text-primary)';
  return (
    <div className="wire-panel">
      <h3 style={{ maxWidth: 130 }}>{title}</h3>
      <div className="mock-stat" style={{ color }}>{value}</div>
      <p className="caption">{suffix}</p>
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
