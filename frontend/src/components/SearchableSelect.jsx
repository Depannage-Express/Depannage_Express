import { useState, useRef, useEffect } from 'react'

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Rechercher...',
  disabled = false,
  className = '',
}) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const inputRef          = useRef(null)
  const containerRef      = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (opt) => {
    onChange(opt)
    setOpen(false)
    setQuery('')
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%' }}
      className={className}
    >
      <div
        onClick={() => {
          if (!disabled) {
            setOpen(!open)
            setTimeout(() => inputRef.current?.focus(), 50)
          }
        }}
        style={{
          border: '2px solid #d1d5db',
          borderRadius: '12px',
          padding: '8px 12px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? '#f5f5f5' : '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '40px',
          fontSize: '14px',
        }}
      >
        <span style={{ color: value ? '#000' : '#9ca3af' }}>
          {value || placeholder}
        </span>
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>
          {open ? '▲' : '▼'}
        </span>
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#fff',
          border: '2px solid #d1d5db',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          maxHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          marginTop: '4px',
        }}>
          <div style={{ padding: '8px' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Taper pour filtrer..."
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: '12px',
                color: '#9ca3af',
                textAlign: 'center',
                fontSize: '13px',
              }}>
                Aucun résultat pour &quot;{query}&quot;
              </div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: '9px 14px',
                    cursor: 'pointer',
                    background: opt === value ? '#f0f7ff' : 'transparent',
                    fontWeight: opt === value ? '600' : 'normal',
                    fontSize: '13px',
                    borderBottom: '1px solid #f5f5f5',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#f5f5f5'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background =
                      opt === value ? '#f0f7ff' : 'transparent'
                  }}
                >
                  {opt}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
