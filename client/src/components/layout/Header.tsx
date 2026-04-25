// ==========================================
// AirOps AI — Header Component
// ==========================================

import { Search, Bell, User, Wifi } from 'lucide-react';
import { RoleBadge } from '../auth/AuthWall';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <div>
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="header-right">
        <div className="header-search">
          <Search className="header-search-icon" />
          <input type="text" placeholder="Buscar PNR, voo, passageiro..." />
        </div>
        <RoleBadge />
        <button className="header-btn" title="Conexões">
          <Wifi size={16} />
        </button>
        <button className="header-btn" title="Notificações">
          <Bell size={16} />
          <span className="header-btn-badge">4</span>
        </button>
        <button className="header-btn" title="Perfil">
          <User size={16} />
        </button>
      </div>
    </header>
  );
}
