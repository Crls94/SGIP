import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ui/Toast';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { ProductSelect } from '../components/ui/ProductSelect';
import api from '../api/client';

export default function Movimientos() {
  const toast = useToast();
  const [movimientos, setMovimientos] = useState({ content: [], totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ productoId: '', tipo: 'ENTRADA', cantidad: '', motivo: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ productoId: '', tipo: '' });

  const fetchMovimientos = useCallback(async () => {
    try {
      const params = { page, size: 15 };
      if (filters.productoId) params.productoId = filters.productoId;
      if (filters.tipo) params.tipo = filters.tipo;
      const { data } = await api.get('/movimientos', { params });
      setMovimientos(data);
    } catch { toast('Error al cargar movimientos', 'error'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchMovimientos(); }, [fetchMovimientos]);

  useEffect(() => {
    api.get('/productos?size=100').then(({ data }) => setProductos(data.content || [])).catch(() => {});
  }, []);

  const cantidadExcedeStock = form.tipo === 'SALIDA' && selectedProduct && parseInt(form.cantidad) > selectedProduct.stockActual;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cantidadExcedeStock) {
      toast('Error: Cantidad excede el stock disponible', 'error');
      return;
    }
    if (!selectedProduct) return;

    setSaving(true);
    try {
      const payload = {
        productoId: form.productoId,
        tipo: form.tipo,
        cantidad: parseInt(form.cantidad),
        motivo: form.motivo || null,
      };
      await api.post('/movimientos', payload);
      toast(`Movimiento de ${form.tipo} registrado`, 'success');
      setModalOpen(false);
      setForm({ productoId: '', tipo: 'ENTRADA', cantidad: '', motivo: '' });
      setSelectedProduct(null);
      fetchMovimientos();
    } catch (err) {
      toast(err.response?.data?.error || 'Error al registrar', 'error');
    } finally { setSaving(false); }
  };

  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div>
      <div className="page-header">
        <h1>Control de Stock</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Registrar Movimiento
        </button>
      </div>

      <div className="card mb-24" style={{ padding: '16px 20px' }}>
        <div className="filter-bar">
          <div className="form-group" style={{ minWidth: 220, marginBottom: 0 }}>
            <select className="form-input" value={filters.productoId} onChange={(e) => setFilters({ ...filters, productoId: e.target.value })}>
              <option value="">Todos los productos</option>
              {productos.map((p) => <option key={p.id} value={p.id}>{p.sku} - {p.nombre}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 160, marginBottom: 0 }}>
            <select className="form-input" value={filters.tipo} onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}>
              <option value="">Todos los tipos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="AJUSTE">Ajuste</option>
              <option value="MERMA">Merma</option>
              <option value="DEVOLUCION">Devolucion</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-dark" style={{ width: 32, height: 32 }} /></div>
      ) : movimientos.content.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>
          </div>
          <h3>Sin movimientos</h3>
          <p>No se han registrado entradas ni salidas de stock.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Stock Antes</th><th>Stock Despues</th><th>Motivo</th><th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.content.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.productoNombre || m.producto?.nombre || productName(m.producto)}</strong>
                    {(m.productoSku || m.producto?.sku) && <div className="micro">{m.productoSku || m.producto?.sku}</div>}
                  </td>
                  <td>
                    <span className={`badge ${tipoBadge(m.tipo)}`}>
                      {tipoLabel(m.tipo)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{m.cantidad}</td>
                  <td>{m.stockAntes ?? '—'}</td>
                  <td>{m.stockDespues ?? '—'}</td>
                  <td className="caption">{m.motivo || '—'}</td>
                  <td className="caption">{m.fecha ? new Date(m.fecha).toLocaleString('es-PE') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {movimientos.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
          <span className="caption" style={{ fontWeight: 500 }}>Pagina {page + 1} de {movimientos.totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= movimientos.totalPages - 1} onClick={() => setPage(page + 1)}>Siguiente</button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSelectedProduct(null); }} title="Registrar Movimiento">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Producto</label>
            <ProductSelect
              products={productos}
              value={form.productoId}
              onChange={(id) => {
                setForm({ ...form, productoId: id });
                const prod = productos.find(p => p.id === id);
                setSelectedProduct(prod || null);
              }}
              placeholder="Buscar producto por nombre o SKU..."
              required
            />
          </div>

          {selectedProduct && (
            <div className="card mb-16" style={{ background: '#E3F2FD', border: '1px solid #BBDEFB', borderRadius: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedProduct.sku} — {selectedProduct.nombre}</div>
              <div className="caption">Stock actual: <strong>{selectedProduct.stockActual}</strong> &middot; Precio: ${selectedProduct.precioVenta}</div>
            </div>
          )}

          <div className="form-group">
            <label>Tipo de Movimiento</label>
            <select className="form-input" value={form.tipo} onChange={update('tipo')}>
              <option value="ENTRADA">Entrada (+ stock)</option>
              <option value="SALIDA">Salida (- stock)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Cantidad</label>
            <input
              className={`form-input ${cantidadExcedeStock ? 'error' : ''}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.cantidad}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm({ ...form, cantidad: val });
              }}
              placeholder="Ingrese solo numeros"
              required
            />
            {cantidadExcedeStock && (
              <div className="error-message">Excede el stock disponible ({selectedProduct.stockActual})</div>
            )}
          </div>

          <div className="form-group">
            <label>Motivo (opcional)</label>
            <input className="form-input" value={form.motivo} onChange={update('motivo')} placeholder="Ej: venta, reposicion, merma" />
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={saving || cantidadExcedeStock || !form.productoId}
          >
            {saving ? <><Spinner /> Procesando...</> : `Registrar ${form.tipo}`}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function productName(ref) {
  if (!ref) return '—';
  return typeof ref === 'string' ? ref : ref.id || '—';
}

function tipoBadge(tipo) {
  const map = {
    ENTRADA: 'badge-success',
    SALIDA: 'badge-danger',
    AJUSTE: 'badge-warning',
    MERMA: 'badge-neutral',
    DEVOLUCION: 'badge-info',
  };
  return map[tipo] || 'badge-neutral';
}

function tipoLabel(tipo) {
  const map = {
    ENTRADA: '↑ Entrada',
    SALIDA: '↓ Salida',
    AJUSTE: 'Ajuste',
    MERMA: 'Merma',
    DEVOLUCION: 'Devolucion',
  };
  return map[tipo] || tipo || '—';
}
