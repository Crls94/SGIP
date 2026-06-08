import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ui/Toast';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { ProductSelect } from '../components/ui/ProductSelect';
import api from '../api/client';

const ESTADOS = ['PENDIENTE', 'EN_PROCESO', 'LISTO', 'DESPACHADO', 'CANCELADO'];

const estadoConfig = {
  PENDIENTE: { label: 'Pendiente', badge: 'badge-warning' },
  EN_PROCESO: { label: 'En Proceso', badge: 'badge-info' },
  LISTO: { label: 'Listo', badge: 'badge-success' },
  DESPACHADO: { label: 'Despachado', badge: 'badge-neutral' },
  CANCELADO: { label: 'Cancelado', badge: 'badge-danger' },
};

export default function Pedidos() {
  const toast = useToast();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState([{ productoId: '', cantidad: 1 }]);
  const [form, setForm] = useState({ canal: 'LOCAL', clienteNombre: '', clienteTelefono: '', clienteDireccion: '', observaciones: '' });
  const [saving, setSaving] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const [detallePedido, setDetallePedido] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [tab, setTab] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [canalFiltro, setCanalFiltro] = useState('');
  const [prioridadFiltro, setPrioridadFiltro] = useState('');

  const fetchPedidos = useCallback(async () => {
    try {
      const { data } = await api.get('/pedidos/cola');
      setPedidos(data);
    } catch { toast('Error al cargar pedidos', 'error'); }
    finally { setLoading(false); }
  }, []);

  const fetchProductos = useCallback(() => {
    api.get('/productos?size=200').then(({ data }) => setProductos(data.content || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const addItem = () => setItems([...items, { productoId: '', cantidad: 1 }]);

  const updateItem = (idx, field) => (e) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: field === 'cantidad' ? parseInt(e.target.value) || 0 : e.target.value };
    setItems(newItems);
  };

  const updateItemProduct = (idx, productId) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], productoId: productId };
    setItems(newItems);
  };

  const removeItem = (idx) => { if (items.length <= 1) return; setItems(items.filter((_, i) => i !== idx)); };

  const getStockDisponible = (productoId) => { if (!productoId) return null; return productos.find(p => p.id === productoId)?.stockActual; };
  const getProduct = (productId) => { if (!productId) return null; return productos.find(p => p.id === productId); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      canal: form.canal,
      clienteNombre: form.clienteNombre || null,
      clienteTelefono: form.clienteTelefono || null,
      clienteDireccion: form.clienteDireccion || null,
      observaciones: form.observaciones || null,
      items: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })),
    };

    if (!confirmacion) {
      const detalles = payload.items.map(i => {
        const prod = productos.find(p => p.id === i.productoId);
        return prod ? `${i.cantidad}x ${prod.nombre}` : '';
      }).filter(Boolean).join(', ');
      setConfirmacion({ payload, detalles });
      return;
    }

    setSaving(true);
    try {
      await api.post('/pedidos', confirmacion.payload);
      toast('Pedido creado exitosamente', 'success');
      setModalOpen(false);
      setConfirmacion(null);
      setItems([{ productoId: '', cantidad: 1 }]);
      setForm({ canal: 'LOCAL', clienteNombre: '', clienteTelefono: '', clienteDireccion: '', observaciones: '' });
      fetchPedidos();
      fetchProductos();
    } catch (err) {
      toast(err.response?.data?.error || 'Error al crear pedido', 'error');
    } finally { setSaving(false); setConfirmacion(null); }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await api.patch(`/pedidos/${id}/estado`, null, { params: { estado } });
      toast('Estado actualizado', 'success');
      fetchPedidos();
    } catch (err) {
      toast(err.response?.data?.error || 'Error', 'error');
    }
  };

  const verDetalle = async (id) => {
    setLoadingDetalle(true);
    try {
      const { data } = await api.get(`/pedidos/${id}`);
      setDetallePedido(data);
    } catch {
      toast('No se pudo cargar el detalle del pedido', 'error');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const tabs = [
    { id: 'TODOS', label: 'Todos' },
    { id: 'PENDIENTE', label: 'Pendientes' },
    { id: 'EN_PROCESO', label: 'Preparando' },
    { id: 'LISTO', label: 'En camino' },
    { id: 'DESPACHADO', label: 'Entregados' },
    { id: 'CANCELADO', label: 'Cancelados' },
  ];

  const pedidosFiltrados = pedidos
    .filter((p) => tab === 'TODOS' || p.estado === tab)
    .filter((p) => !canalFiltro || p.canal === canalFiltro)
    .filter((p) => {
      if (!prioridadFiltro) return true;
      if (prioridadFiltro === 'alta') return p.prioridad <= 3;
      if (prioridadFiltro === 'media') return p.prioridad === 4;
      return p.prioridad >= 5;
    })
    .filter((p) => {
      const term = busqueda.trim().toLowerCase();
      if (!term) return true;
      const numero = String(p.numero || '').toLowerCase();
      const cliente = String(p.clienteNombre || '').toLowerCase();
      return numero.includes(term) || cliente.includes(term);
    });

  return (
    <div>
      <div className="page-header">
        <h1>Pedidos</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nuevo Pedido
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-dark" style={{ width: 32, height: 32 }} /></div>
      ) : pedidos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg></div>
          <h3>Cola vacia</h3>
          <p>No hay pedidos pendientes en este momento.</p>
        </div>
      ) : (
        <div className="card">
          <div className="tabs-row">
            {tabs.map((t) => (
              <button type="button" key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="filter-bar" style={{ marginTop: 12 }}>
            <input
              className="form-input"
              placeholder="Buscar pedido o cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ maxWidth: 340 }}
            />
            <select className="form-input" value={canalFiltro} onChange={(e) => setCanalFiltro(e.target.value)} style={{ maxWidth: 150 }}>
              <option value="">Todos los canales</option>
              <option value="LOCAL">Local</option>
              <option value="DELIVERY">Delivery</option>
            </select>
            <select className="form-input" value={prioridadFiltro} onChange={(e) => setPrioridadFiltro(e.target.value)} style={{ maxWidth: 150 }}>
              <option value="">Toda prioridad</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          <div className="table-wrapper" style={{ marginTop: 8 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID Pedido</th><th>Cliente</th><th>Tipo</th><th>Prioridad</th><th>Estado</th><th>Total</th><th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((p) => {
                  const ec = estadoConfig[p.estado] || estadoConfig.PENDIENTE;
                  return (
                    <tr key={p.id}>
                      <td><strong style={{ fontFamily: 'monospace' }}>#{p.numero}</strong></td>
                      <td>{p.clienteNombre || 'Consumidor final'}</td>
                      <td>{p.canal === 'DELIVERY' ? 'Delivery' : 'Local'}</td>
                      <td>{p.prioridad <= 3 ? 'Alta' : p.prioridad === 4 ? 'Media' : 'Baja'}</td>
                      <td><span className={`badge ${ec.badge}`}>{ec.label}</span></td>
                      <td>S/ {p.total}</td>
                      <td>
                        <div className="flex-row" style={{ gap: 6 }}>
                          <button type="button" className="btn btn-outline btn-sm" title="Ver detalle" onClick={() => verDetalle(p.id)} disabled={loadingDetalle}>Ver</button>
                          <select className="form-input" style={{ width: 145, padding: '5px 28px 5px 10px', fontSize: 'var(--font-caption)' }} value={p.estado} onChange={(e) => cambiarEstado(p.id, e.target.value)}>
                            {ESTADOS.map((e) => <option key={e} value={e} disabled={e === p.estado}>{estadoConfig[e]?.label || e}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="caption mt-16">Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos</p>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setConfirmacion(null); }} title="Nuevo Pedido">
        {confirmacion ? (
          <div>
            <div className="card mb-16" style={{ background: '#E3F2FD', border: '1px solid #BBDEFB', borderRadius: 10 }}>
              <h3 style={{ marginBottom: 8 }}>Confirmar Pedido</h3>
              <p><strong>Canal:</strong> {confirmacion.payload.canal === 'LOCAL' ? 'Local' : 'Delivery'}</p>
              <p>Productos: <strong>{confirmacion.detalles}</strong></p>
              <p className="caption mt-16">Desea confirmar este pedido?</p>
            </div>
            <div className="flex-row" style={{ gap: 8 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setConfirmacion(null)}>Cancelar</button>
              <button className="btn btn-accent" style={{ flex: 1 }} onClick={handleSubmit} disabled={saving}>
                {saving ? <><Spinner /> Procesando...</> : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Canal</label>
              <select className="form-input" value={form.canal} onChange={update('canal')}>
                <option value="LOCAL">Local (Prioridad 5)</option>
                <option value="DELIVERY">Delivery (Prioridad 3)</option>
              </select>
            </div>

            <div className="flex-row" style={{ gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Cliente</label>
                <input className="form-input" value={form.clienteNombre} onChange={update('clienteNombre')} placeholder="Nombre del cliente" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Telefono</label>
                <input className="form-input" value={form.clienteTelefono} onChange={update('clienteTelefono')} placeholder="Telefono" />
              </div>
            </div>

            <div className="form-group">
              <label>Direccion (Delivery)</label>
              <input className="form-input" value={form.clienteDireccion} onChange={update('clienteDireccion')} placeholder="Direccion de entrega" />
            </div>

            <h3 className="mb-16">Productos</h3>
            {items.map((item, idx) => {
              const stock = getStockDisponible(item.productoId);
              const excede = item.productoId && item.cantidad > (stock || 0);
              return (
                <div key={idx} className="flex-row mb-16" style={{ gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <label className="micro">Producto {idx + 1}</label>
                    <ProductSelect
                      products={productos}
                      value={item.productoId}
                      onChange={(id) => updateItemProduct(idx, id)}
                      placeholder="Buscar producto..."
                      required
                    />
                    {excede && <div className="error-message">Excede stock disponible ({stock})</div>}
                  </div>
                  <div style={{ width: 90 }}>
                    <label className="micro">Cant.</label>
                    <input
                      className={`form-input ${excede ? 'error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={item.cantidad}
                      onChange={(e) => updateItem(idx, 'cantidad')({ target: { value: e.target.value.replace(/[^0-9]/g, '') } })}
                      style={{ fontSize: 14 }}
                      required
                    />
                  </div>
                  {items.length > 1 && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeItem(idx)} style={{ marginTop: 20 }}>✕</button>
                  )}
                </div>
              );
            })}

            <button type="button" className="btn btn-outline btn-sm mb-16" onClick={addItem}>+ Agregar producto</button>

            <div className="form-group">
              <label>Observaciones</label>
              <textarea className="form-input" rows={2} value={form.observaciones} onChange={update('observaciones')} placeholder="Notas adicionales..." />
            </div>

            <button
              className="btn btn-accent btn-lg"
              style={{ width: '100%' }}
              disabled={items.some(i => !i.productoId) || items.some(i => i.cantidad < 1) || items.some(i => i.cantidad > (getStockDisponible(i.productoId) || 0))}
            >
              Confirmar Pedido
            </button>
          </form>
        )}
      </Modal>

      <Modal open={!!detallePedido} onClose={() => setDetallePedido(null)} title={`Detalle Pedido #${detallePedido?.numero || ''}`}>
        {detallePedido && (
          <div>
            <div className="card mb-16" style={{ borderRadius: 10 }}>
              <p><strong>Cliente:</strong> {detallePedido.clienteNombre || 'Consumidor final'}</p>
              <p><strong>Canal:</strong> {detallePedido.canal === 'DELIVERY' ? 'Delivery' : 'Local'}</p>
              <p><strong>Estado:</strong> {estadoConfig[detallePedido.estado]?.label || detallePedido.estado}</p>
              <p><strong>Telefono:</strong> {detallePedido.clienteTelefono || '-'}</p>
              <p><strong>Direccion:</strong> {detallePedido.clienteDireccion || '-'}</p>
              <p><strong>Observaciones:</strong> {detallePedido.observaciones || '-'}</p>
            </div>

            <div className="table-wrapper mb-16">
              <table className="table">
                <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {(detallePedido.items || []).map((item, idx) => (
                    <tr key={`${item.productoId}-${idx}`}>
                      <td>{item.productoNombre}</td>
                      <td>{item.cantidad}</td>
                      <td>S/ {item.precioUnitario ?? '-'}</td>
                      <td>S/ {item.subtotal ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3>Total: S/ {detallePedido.total}</h3>
          </div>
        )}
      </Modal>
    </div>
  );
}
