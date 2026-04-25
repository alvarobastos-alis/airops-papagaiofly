// ==========================================
// AirOps AI — Dashboard Page
// ==========================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart as BarChartComponent, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  Zap, Clock, DollarSign, TrendingUp, BarChart3,
  AlertTriangle, Plane, MessageSquare, ArrowUp, ArrowDown,
  Headphones, Target, Star,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { mockFlights, mockIROPs } from '../data/mockData';


const kpis = [
  { label: 'Taxa de Automação', value: '78.4%', change: '+4.2%', positive: true, icon: Zap, variant: 'primary' as const },
  { label: 'FCR (1º Contato)', value: '85.1%', change: '+2.7%', positive: true, icon: Target, variant: 'success' as const },
  { label: 'Tempo Médio (AHT)', value: '2m 34s', change: '-18s', positive: true, icon: Clock, variant: 'info' as const },
  { label: 'Custo / Atendimento', value: 'R$ 3,20', change: '-R$ 0,80', positive: true, icon: DollarSign, variant: 'warning' as const },
  { label: 'NPS', value: '72', change: '+5', positive: true, icon: Star, variant: 'primary' as const },
  { label: 'Sessões Ativas', value: '14', change: '', positive: true, icon: Headphones, variant: 'success' as const },
];

const scenarioVolume = [
  { name: 'Status', volume: 342, color: '#3b82f6' },
  { name: 'IROPs', volume: 189, color: '#f59e0b' },
  { name: 'Alteração', volume: 156, color: '#8b5cf6' },
  { name: 'Cancel.', volume: 98, color: '#ef4444' },
  { name: 'Conexão', volume: 67, color: '#06b6d4' },
  { name: 'Bagagem', volume: 54, color: '#10b981' },
  { name: 'Financ.', volume: 89, color: '#f97316' },
  { name: 'Fidelidde', volume: 45, color: '#eab308' },
];

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}h`,
  atendimentos: Math.floor(Math.random() * 80 + (i >= 7 && i <= 22 ? 40 : 5)),
  automatizados: Math.floor(Math.random() * 60 + (i >= 7 && i <= 22 ? 30 : 3)),
}));



const recentSessions = [
  { id: 1, name: 'Carlos Mendes', pnr: 'ABC123', intent: 'Atraso > 4h — Reacomodação', status: 'resolved', time: '2min', channel: 'voice' },
  { id: 2, name: 'Maria Silva', pnr: 'XYZ789', intent: 'Cancelamento — Reembolso', status: 'active', time: '1min', channel: 'chat' },
  { id: 3, name: 'João Santos', pnr: 'DEF456', intent: 'Status do voo', status: 'resolved', time: '45s', channel: 'chat' },
  { id: 4, name: 'Ana Oliveira', pnr: 'GHI012', intent: 'Bagagem atrasada', status: 'active', time: '3min', channel: 'voice' },
  { id: 5, name: 'Roberto Ferreira', pnr: 'JKL345', intent: 'Atraso > 4h — Hospedagem', status: 'escalated', time: '5min', channel: 'whatsapp' },
];

const voucherAcceptance = [
  { name: 'Aceitou Crédito', value: 62 },
  { name: 'Pediu Reembolso', value: 38 },
];

const VOUCHER_COLORS = ['#10b981', '#ef4444'];

import { FilterBar } from '../components/ui/FilterBar';

export default function DashboardPage() {
  const [animatedKpis, setAnimatedKpis] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setTimeout(() => setAnimatedKpis(true), 100);
    fetch('http://localhost:3001/api/analytics/dashboard')
      .then(r => r.json())
      .then(d => setApiData(d))
      .catch(e => console.error('Failed to load real data', e));
  }, []);

  // Merge static UI format with fetched dynamic volume
  const dynamicKpis = apiData ? [
    { label: 'Taxa de Automação', value: `${apiData.kpis.automationRate}%`, change: '+4.2%', positive: true, icon: Zap, variant: 'primary' as const },
    { label: 'FCR (1º Contato)', value: '85.1%', change: '+2.7%', positive: true, icon: Target, variant: 'success' as const },
    { label: 'Total Contatos', value: apiData.kpis.totalContacts.toLocaleString('pt-BR'), change: '', positive: true, icon: Headphones, variant: 'info' as const },
    { label: 'Custo / Atendimento', value: 'R$ 3,20', change: '-R$ 0,80', positive: true, icon: DollarSign, variant: 'warning' as const },
    { label: 'NPS Médio', value: apiData.kpis.csat, change: '+5', positive: true, icon: Star, variant: 'primary' as const },
    { label: 'Resolvidos (Hoje)', value: apiData.kpis.resolvedContacts.toLocaleString('pt-BR'), change: '', positive: true, icon: Target, variant: 'success' as const },
  ] : kpis;

  const currentScenarioVolume = apiData ? apiData.scenarioVolume : scenarioVolume;
  const currentHourly = apiData ? apiData.hourlyData : hourlyData;
  const currentSessions = apiData ? apiData.recentSessions : recentSessions;

  return (
    <>
      <Header title="Dashboard Operacional" subtitle={`Papagaio Fly — ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`} />
      <div className="app-content">
        <FilterBar onSearch={setSearchQuery} filters={['Hoje', 'Últimos 7 dias', 'Críticos']} />
        
        {/* KPI Cards */}
        <motion.div 
          className="kpi-grid"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {dynamicKpis.map((kpi) => (
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }} key={kpi.label} className={`kpi-card ${kpi.variant}`}>
              <div className="kpi-card-header">
                <span className="kpi-card-label">{kpi.label}</span>
                <div className="kpi-card-icon">
                  <kpi.icon size={20} />
                </div>
              </div>
              <div className="kpi-card-value">{kpi.value}</div>
              {kpi.change && (
                <div className={`kpi-card-change ${kpi.positive ? 'positive' : 'negative'}`}>
                  {kpi.positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {kpi.change} vs ontem
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Main Charts Grid */}
        <motion.div 
          className="dashboard-grid"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
          }}
        >
          {/* Atendimentos por Hora */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-card">
            <div className="glass-card-header">
              <span className="glass-card-title">
                <MessageSquare size={16} /> Atendimentos por Hora
              </span>
            </div>
            <div className="chart-container" style={{ height: 220 }}>
              <ResponsiveContainer>
                <AreaChart data={currentHourly}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAuto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ background: '#1a2236', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Area type="monotone" dataKey="atendimentos" stroke="#eab308" fill="url(#colorTotal)" strokeWidth={2} name="Total" />
                  <Area type="monotone" dataKey="automatizados" stroke="#10b981" fill="url(#colorAuto)" strokeWidth={2} name="Automatizados" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Volume por Cenário */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-card">
            <div className="glass-card-header">
              <span className="glass-card-title">
                <BarChart3 size={16} /> Volume por Cenário
              </span>
            </div>
            <div className="chart-container" style={{ height: 220 }}>
              <ResponsiveContainer>
                <BarChartComponent data={currentScenarioVolume} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ background: '#1a2236', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="volume" radius={[0, 4, 4, 0]} name="Atendimentos">
                    {currentScenarioVolume.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChartComponent>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Disruption Alerts */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-card">
            <div className="glass-card-header">
              <span className="glass-card-title">
                <AlertTriangle size={16} /> Disrupções Ativas
              </span>
              <span className="badge cancelled"><span className="badge-dot" />{mockIROPs.length} ativos</span>
            </div>
            <div>
              {mockIROPs.map((irop) => (
                <div key={irop.id} className={`disruption-alert severity-${irop.severity}`}>
                  <div style={{ flex: 1 }}>
                    <div className="disruption-alert-title">
                      {irop.type === 'cancellation' ? '❌' : '⏱️'} {irop.flightNumber} — {irop.type === 'cancellation' ? 'Cancelado' : `Atraso ${irop.delayMinutes}min`}
                    </div>
                    <div className="disruption-alert-desc">
                      {irop.reason} • {irop.affectedPassengers} passageiros afetados
                    </div>
                  </div>
                  <span className="disruption-alert-time">
                    {new Date(irop.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Voucher Acceptance + Automation Gauge */}
          <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }} className="glass-card">
            <div className="glass-card-header">
              <span className="glass-card-title">
                <TrendingUp size={16} /> Aceitação de Crédito vs Reembolso
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, height: 200 }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={voucherAcceptance}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {voucherAcceptance.map((_, index) => (
                      <Cell key={index} fill={VOUCHER_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a2236', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div>
                {voucherAcceptance.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: VOUCHER_COLORS[i] }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{item.name}: <strong style={{ color: 'var(--text-primary)' }}>{item.value}%</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Sessions */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} className="glass-card full-width">
            <div className="glass-card-header">
              <span className="glass-card-title">
                <Headphones size={16} /> Sessões Recentes
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Últimas 5 interações</span>
            </div>
            <div>
                {currentSessions.map((session: any) => (
                  <div key={session.id} className="session-item">
                    <div className="session-avatar">
                      {session.name.split(' ').map((n:string) => n[0]).join('')}
                    </div>
                    <div className="session-info">
                      <div className="session-name">{session.name} <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>({session.pnr})</span></div>
                      <div className="session-intent">{session.intent}</div>
                    </div>
                    <span className={`badge ${session.status === 'resolved' ? 'on-time' : session.status === 'escalated' ? 'cancelled' : 'boarding'}`}>
                      <span className="badge-dot" />
                      {session.status === 'resolved' ? 'Resolvido' : session.status === 'escalated' ? 'Escalado' : 'Ativo'}
                    </span>
                    <span className="session-time">{session.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Flight Board Mini */}
            <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} className="glass-card full-width">
              <div className="glass-card-header">
                <span className="glass-card-title">
                  <Plane size={16} /> Painel de Voos em Recuperação
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{apiData?.disruptions?.length || 0} anomalias</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="flight-board">
                  <thead>
                    <tr>
                      <th>Voo</th>
                      <th>Ocorrência</th>
                      <th>Afetados</th>
                      <th>Status</th>
                      <th>Atraso Estim.</th>
                      <th>Severidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(apiData ? apiData.disruptions : mockIROPs).map((flight: any) => (
                      <tr key={flight.id}>
                        <td><span className="flight-number">{flight.flightNumber || flight.flight_number}</span></td>
                        <td>{flight.reason}</td>
                        <td>{flight.affectedPassengers || flight.affected_passengers} pax</td>
                        <td>
                          <span className={`badge ${flight.type === 'cancelled' ? 'cancelled' : 'delay'}`}>
                            <span className="badge-dot" />
                            {(flight.type || flight.irop_type) === 'cancellation' ? 'Cancelado' : 'Atrasado'}
                          </span>
                        </td>
                        <td className="flight-time">
                          {flight.delayMinutes ? <span style={{ color: 'var(--error)' }}>+{flight.delayMinutes}min</span> : '—'}
                        </td>
                        <td>
                          <span className={`badge ${flight.severity === 'high' ? 'cancelled' : 'warning'}`}>
                            {flight.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
