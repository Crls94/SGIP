import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import api from '../api/client';

const emptyForm = { 
  sku: '', 
  nombre: '', 
  categoriaId: '', 
  proveedorId: '', 
  precioCosto: '', 
  precioVenta: '', 
  stockActual: '', 
  puntoPedido: '1' 
};

export default function Productos() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [productos, setProductos] = useState({ content: [], totalPages: 0 });
  const [page, setPage] = useState(0);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [proveedorFiltro, setProveedorFiltro] = useState('');
  const [stockFiltro, setStockFiltro] = useState('');

  const fetchProductos = useCallback(async () => {
    try {
      const { data } = await api.get(`/productos?page=${page}&size=10`);
      setProductos(data);
    } catch { toast('Error al cargar productos', 'error'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchProductos(); }, [fetchProductos]);

  useEffect(() => {
    api.get('/categorias').then(({ data }) => setCategorias(data)).catch(() => {});
    api.get('/proveedores').then(({ data }) => {
      setProveedores(data);
    }).catch(() => {});
  }, []);

  const openCreate = () => { 
    setForm(emptyForm); 
    setProveedorSeleccionado(null);
    setEditingId(null); 
    setModalOpen(true); 
  };

  const openEdit = (p) => {
    const catId = categorias.find(c => c.nombre === p.categoriaNombre)?.id || '';
    const provId = proveedores.find(pr => pr.nombre === p.proveedorNombre)?.id || '';
    const prov = proveedores.find(pr => pr.id === provId) || null;
    
    setForm({
      sku: p.sku, 
      nombre: p.nombre,
      categoriaId: catId,
      proveedorId: provId,
      precioCosto: p.precioCosto || '',
      precioVenta: p.precioVenta || '',
      stockActual: p.stockActual,
      puntoPedido: p.puntoPedido,
    });
    setProveedorSeleccionado(prov);
    setEditingId(p.id);
    setModalOpen(true);
  };

  const handleProveedorChange = (provId, prov) => {
    setForm({ ...form, proveedorId: provId });
    setProveedorSeleccionado(prov);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      categoriaId: parseInt(form.categoriaId),
      proveedorId: parseInt(form.proveedorId),
      precioCosto: parseFloat(form.precioCosto) || 0,
      precioVenta: parseFloat(form.precioVenta) || 0,
      stockActual: parseInt(form.stockActual) || 0,
      puntoPedido: parseInt(form.puntoPedido) || 1,
    };
    try {
      if (editingId) {
        await api.put(`/productos/${editingId}`, payload);
        toast('Producto actualizado', 'success');
      } else {
        await api.post('/productos', payload);
        toast('Producto creado', 'success');
      }
      setModalOpen(false);
      fetchProductos();
    } catch (err) {
      toast(err.response?.data?.error || 'Error al guardar', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este producto?')) return;
    try {
      await api.delete(`/productos/${id}`);
      toast('Producto eliminado', 'success');
      fetchProductos();
    } catch (err) {
      toast(err.response?.data?.error || 'Error al eliminar', 'error');
    }
  };

  const exportarInventario = async () => {
    try {
      const response = await api.get('/reportes/inventario', { params: { formato: 'xlsx' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventario.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch {
      toast('No se pudo exportar inventario', 'error');
    }
  };

  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const productosFiltrados = productos.content.filter((p) => {
    const term = search.trim().toLowerCase();
    const coincideTexto = !term || p.nombre.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
    const coincideCategoria = !categoriaFiltro || p.categoriaNombre === categoriaFiltro;
    const coincideProveedor = !proveedorFiltro || p.proveedorNombre === proveedorFiltro;
    const coincideStock = !stockFiltro
      || (stockFiltro === 'critico' && p.stockActual <= p.puntoPedido)
      || (stockFiltro === 'ok' && p.stockActual > p.puntoPedido)
      || (stockFiltro === 'sin_stock' && p.stockActual <= 0);
    return coincideTexto && coincideCategoria && coincideProveedor && coincideStock;
  });

  return (
    <div>
      <div className="page-header">
        <h1>Lista de Productos</h1>
        <div className="flex-row">
          {isAdmin && <button className="btn btn-outline" onClick={openCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Agregar Producto
          </button>}
          <button className="btn btn-outline" onClick={exportarInventario}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Exportar
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <input className="form-input" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
        <select className="form-input" value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Todas las categorias</option>
          {categorias.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </select>
        <select className="form-input" value={proveedorFiltro} onChange={(e) => setProveedorFiltro(e.target.value)} style={{ maxWidth: 190 }}>
          <option value="">Todos los proveedores</option>
          {proveedores.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
        </select>
        <select className="form-input" value={stockFiltro} onChange={(e) => setStockFiltro(e.target.value)} style={{ maxWidth: 150 }}>
          <option value="">Todo stock</option>
          <option value="critico">Stock critico</option>
          <option value="ok">Stock OK</option>
          <option value="sin_stock">Sin stock</option>
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-dark" style={{ width: 32, height: 32 }} /></div>
      ) : productosFiltrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
          </div>
          <h3>Sin productos</h3>
          <p>No hay productos registrados en el inventario.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Producto</th><th>Categoria</th><th>Stock</th><th>Precio</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((p) => (
                <tr key={p.id}>
                  <td><strong style={{ fontFamily: 'monospace', fontSize: 13 }}>{p.sku}</strong></td>
                  <td>{p.nombre}</td>
                  <td><span className="badge badge-neutral">{p.categoriaNombre}</span></td>
                  <td>
                    <span className={`badge ${p.stockActual <= p.puntoPedido ? 'badge-danger' : 'badge-success'}`}>
                      {p.stockActual}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>S/ {p.precioVenta}</td>
                  {isAdmin && (
                    <td>
                      <div className="flex-row" style={{ gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Eliminar</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {productos.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
          <span className="caption" style={{ fontWeight: 500 }}>Pagina {page + 1} de {productos.totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= productos.totalPages - 1} onClick={() => setPage(page + 1)}>Siguiente</button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Producto' : 'Nuevo Producto'}>
        <form onSubmit={handleSubmit}>
          <div className="flex-row" style={{ gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>SKU <span style={{ color: 'var(--text-tertiary)' }}>(Codigo unico)</span></label>
              <input className="form-input" value={form.sku} onChange={update('sku')} placeholder="Ej: PROD-001" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Nombre del Producto</label>
              <input className="form-input" value={form.nombre} onChange={update('nombre')} placeholder="Nombre descriptivo" required />
            </div>
          </div>

          <div className="form-group">
            <label>Categoria <span style={{ color: 'var(--text-tertiary)' }}>(Escriba para buscar)</span></label>
            <SearchableSelect
              options={categorias}
              value={form.categoriaId}
              onChange={(id) => setForm({ ...form, categoriaId: id })}
              placeholder="Buscar categoria..."
              searchFields={['nombre']}
              renderOption={(c) => <span>{c.nombre}</span>}
              renderSelected={(c) => <span>{c.nombre}</span>}
              required
            />
          </div>

          <div className="form-group">
            <label>Proveedor <span style={{ color: 'var(--text-tertiary)' }}>(Escriba para buscar por nombre)</span></label>
            <SearchableSelect
              options={proveedores}
              value={form.proveedorId}
              onChange={handleProveedorChange}
              placeholder="Buscar proveedor..."
              searchFields={['nombre', 'ruc', 'contacto']}
              renderOption={(p) => (
                <div>
                  <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {p.ruc && `RUC: ${p.ruc}`} {p.contacto && `• ${p.contacto}`}
                  </div>
                </div>
              )}
              renderSelected={(p) => <span>{p.nombre}</span>}
              required
            />
          </div>

          {proveedorSeleccionado && (
            <div className="card mb-16" style={{ background: '#F1F8E9', border: '1px solid #C5E1A5', borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#33691E', marginBottom: 6 }}>
                Datos del Proveedor
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                {proveedorSeleccionado.contacto && (
                  <div><span className="caption">Contacto:</span> <strong>{proveedorSeleccionado.contacto}</strong></div>
                )}
                {proveedorSeleccionado.telefono && (
                  <div><span className="caption">Telefono:</span> <strong>{proveedorSeleccionado.telefono}</strong></div>
                )}
                {proveedorSeleccionado.email && (
                  <div><span className="caption">Email:</span> <strong>{proveedorSeleccionado.email}</strong></div>
                )}
                {proveedorSeleccionado.direccion && (
                  <div style={{ gridColumn: '1 / -1' }}><span className="caption">Direccion:</span> <strong>{proveedorSeleccionado.direccion}</strong></div>
                )}
                {proveedorSeleccionado.leadTimeDias && (
                  <div><span className="caption">Lead Time:</span> <strong>{proveedorSeleccionado.leadTimeDias} dias</strong></div>
                )}
              </div>
            </div>
          )}

          <div className="flex-row" style={{ gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Precio Costo <span style={{ color: 'var(--text-tertiary)' }}>(Compra)</span></label>
              <input className="form-input" type="number" step="0.01" min="0" value={form.precioCosto} onChange={update('precioCosto')} placeholder="0.00" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Precio Venta <span style={{ color: 'var(--text-tertiary)' }}>(Venta al publico)</span></label>
              <input className="form-input" type="number" step="0.01" min="0" value={form.precioVenta} onChange={update('precioVenta')} placeholder="0.00" required />
            </div>
          </div>

          <div className="flex-row" style={{ gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Stock Inicial</label>
              <input className="form-input" type="number" min="0" value={form.stockActual} onChange={update('stockActual')} placeholder="0" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Punto de Pedido <span style={{ color: 'var(--text-tertiary)' }}>(Minimo antes de reordenar)</span></label>
              <input className="form-input" type="number" min="1" value={form.puntoPedido} onChange={update('puntoPedido')} placeholder="1" required />
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={saving}>
            {saving && <Spinner />}
            {editingId ? 'Actualizar Producto' : 'Crear Producto'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
