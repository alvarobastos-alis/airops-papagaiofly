import { useState } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';

interface FilterBarProps {
  onSearch: (q: string) => void;
  filters: string[];
  onFilterChange?: (filter: string) => void;
}

export function FilterBar({ onSearch, filters, onFilterChange }: FilterBarProps) {
  const [activeFilter, setActiveFilter] = useState('Todos');

  const handleFilter = (f: string) => {
    setActiveFilter(f);
    onFilterChange?.(f);
  };

  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
      <div className="header-search" style={{ flex: 1, minWidth: '200px' }}>
        <Search className="header-search-icon" />
        <input 
          type="text" 
          placeholder="Buscar PNR, voo ou nome..." 
          onChange={(e) => onSearch(e.target.value)} 
        />
      </div>
      
      <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
        {['Todos', ...filters].map(filter => (
          <button
            key={filter}
            onClick={() => handleFilter(filter)}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: activeFilter === filter ? 'var(--brand-primary-light)' : 'transparent',
              color: activeFilter === filter ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      <button className="header-btn" title="Filtrar por Data">
        <Calendar size={16} />
      </button>
      <button className="header-btn" title="Mais Filtros">
        <Filter size={16} />
      </button>
    </div>
  );
}
