// ==========================================
// AirOps AI — Main Application
// ==========================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import FlightsPage from './pages/FlightsPage';
import ScenariosPage from './pages/ScenariosPage';
import RulesPage from './pages/RulesPage';
import SimulatorPage from './pages/SimulatorPage';
import MonitoringPage from './pages/MonitoringPage';
import LiveQueuePage from './pages/LiveQueuePage';
import DecisionTreePage from './pages/DecisionTreePage';
import AuthWall from './components/auth/AuthWall';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      <div className="empty-state">
        <div className="empty-state-icon">⚙️</div>
        <div className="empty-state-title">{title}</div>
        <div className="empty-state-desc">Esta seção estará disponível em uma versão futura do AirOps AI.</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthWall>
        <div className="app-layout">
          <Sidebar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/flights" element={<FlightsPage />} />
              <Route path="/scenarios" element={<ScenariosPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/simulator" element={<SimulatorPage />} />
              <Route path="/pnr" element={<PlaceholderPage title="Gestão de PNR" />} />
              <Route path="/monitoring" element={<MonitoringPage />} />
              <Route path="/sac-queue" element={<LiveQueuePage />} />
              <Route path="/decision-tree" element={<DecisionTreePage />} />
              <Route path="/security" element={<PlaceholderPage title="Segurança & Guardrails" />} />
              <Route path="/settings" element={<PlaceholderPage title="Configurações do Sistema" />} />
            </Routes>
          </main>
        </div>
      </AuthWall>
    </BrowserRouter>
  );
}
