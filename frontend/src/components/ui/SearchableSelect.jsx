import { useState, useRef, useEffect } from 'react';

export function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder,
  searchFields = ['nombre'],
  renderOption,
  renderSelected,
  required 
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find(o => o.id === value);
  
  const filtered = options.filter(o => {
    const q = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return searchFields.some(field => {
      const val = String(o[field] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return val.includes(q);
    });
  });

  useEffect(() => {
    function handleClickOut(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOut);
    return () => document.removeEventListener('mousedown', handleClickOut);
  }, []);

  const handleSelect = (item) => {
    onChange(item.id, item);
    setSearch('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange('', null);
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
        }}
        onClick={() => setOpen(!open)}
      >
        {selected ? (
          renderSelected ? renderSelected(selected) : (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected.nombre}
            </span>
          )
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>{placeholder || 'Seleccionar...'}</span>
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
                placeholder="Escriba para buscar..."
                autoFocus
                style={{ paddingLeft: 32, fontSize: 13, marginBottom: 0 }}
              />
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                No se encontraron resultados
              </div>
            ) : (
              filtered.slice(0, 50).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-light)',
                    background: value === item.id ? '#E3F2FD' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (value !== item.id) e.currentTarget.style.background = '#F5F7FA'; }}
                  onMouseLeave={(e) => { if (value !== item.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  {renderOption ? renderOption(item) : (
                    <span>{item.nombre}</span>
                  )}
                </div>
              ))
            )}
          </div>
          {filtered.length > 50 && (
            <div style={{ padding: '6px 12px', textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-light)' }}>
              Mostrando 50 de {filtered.length} resultados. Refine su búsqueda.
            </div>
          )}
        </div>
      )}
      {required && !value && <input type="hidden" required />}
    </div>
  );
}