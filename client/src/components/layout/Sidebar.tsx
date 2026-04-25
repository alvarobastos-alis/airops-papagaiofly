// ==========================================
// Papagaio Fly — Sidebar Component
// ==========================================

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Plane,
  BookOpen,
  Scale,
  Settings,
  Activity,
  Headphones,
  Smartphone,
  GitBranch,
  Radio,
} from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <img src="/papagaio_logo.png" alt="Papagaio Fly" className="sidebar-brand-logo" />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Papagaio Fly</span>
          <span className="sidebar-brand-sub">Agente Virtual</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Principal</span>
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard className="sidebar-link-icon" />
          Dashboard
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <MessageSquare className="sidebar-link-icon" />
          Agente Conversacional
          <span className="sidebar-link-badge">3</span>
        </NavLink>
        <NavLink to="/flights" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Plane className="sidebar-link-icon" />
          Painel de Voos
        </NavLink>

        <span className="sidebar-section-label">Operações</span>
        <NavLink to="/sac-queue" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Radio className="sidebar-link-icon" />
          Fila SAC ao Vivo
        </NavLink>
        <NavLink to="/scenarios" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <BookOpen className="sidebar-link-icon" />
          Cenários SAC
        </NavLink>
        <NavLink to="/rules" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Scale className="sidebar-link-icon" />
          Regras ANAC
        </NavLink>
        <NavLink to="/decision-tree" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <GitBranch className="sidebar-link-icon" />
          Árvore de Decisão
        </NavLink>

        <span className="sidebar-section-label">Sistema</span>
        <NavLink to="/monitoring" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Activity className="sidebar-link-icon" />
          Monitoramento
        </NavLink>
        <NavLink to="/simulator" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Smartphone className="sidebar-link-icon" />
          Dual-View (Simulador)
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Settings className="sidebar-link-icon" />
          Configurações
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className="sidebar-status-dot" />
          <Headphones size={14} />
          Agente ativo — 3 sessões
        </div>
      </div>
    </aside>
  );
}
