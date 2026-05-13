import { useState, useRef, useEffect } from 'react';

export function ProductSelect({ products, value, onChange, placeholder, required }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = products.find(p => p.id === value);
  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  useEffect(() => {
    function handleClickOut(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOut);
    return () => document.removeEventListener('mousedown', handleClickOut);
  }, []);

  const handleSelect = (p) => {
    onChange(p.id);
    setSearch('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        className="form-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          minHeight: 42,
          padding: selected ? '8px 12px' : undefined,
        }}
        onClick={() => setOpen(!open)}
      >
        {selected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace', color: 'var(--color-primary)' }}>{selected.sku}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.nombre}</span>
            <span className={`badge ${selected.stockActual <= selected.puntoPedido ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: 11 }}>
              Stock: {selected.stockActual}
            </span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>{placeholder || 'Buscar producto...'}</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {selected && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 2, fontSize: 16, lineHeight: 1 }}
            >
              &times;
            </button>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-btn)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
          marginTop: 4,
          maxHeight: 320,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="form-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                autoFocus
                style={{ paddingLeft: 32, fontSize: 13, marginBottom: 0 }}
              />
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                No se encontraron productos
              </div>
            ) : (
              filtered.slice(0, 50).map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderBottom: '1px solid var(--border-light)',
                    background: value === p.id ? '#E3F2FD' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (value !== p.id) e.currentTarget.style.background = '#F5F7FA'; }}
                  onMouseLeave={(e) => { if (value !== p.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 12, fontFamily: 'monospace', color: 'var(--color-primary)' }}>{p.sku}</span>
                      <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                      <span className="micro">${p.precioVenta}</span>
                      <span className={`micro ${p.stockActual <= p.puntoPedido ? '' : ''}`} style={{ color: p.stockActual <= p.puntoPedido ? 'var(--color-danger)' : 'var(--color-accent-dark)' }}>
                        Stock: {p.stockActual}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {required && !value && <input type="hidden" required />}
    </div>
  );
}