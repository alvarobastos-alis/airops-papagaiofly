// ==========================================
// AirOps AI — Flights Page
// ==========================================

import { useState, useMemo } from 'react';
import { Plane, AlertTriangle, Clock, MapPin, Users, RefreshCw } from 'lucide-react';
import Header from '../components/layout/Header';
import { mockFlights, mockIROPs, mockFlightStatusEvents } from '../data/mockData';
import { FilterBar } from '../components/ui/FilterBar';

const FILTER_MAP: Record<string, string | null> = {
  'Todos': null,
  'Atrasados': 'delayed',
  'Cancelados': 'cancelled',
  'Críticos': '__critical__', // >120min or cancelled
};

export default function FlightsPage() {
  const [tabFilter, setTabFilter] = useState<string>('all');
  const [barFilter, setBarFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let list = mockFlights;

    // 1. Apply tab filter
    if (tabFilter !== 'all') {
      list = list.filter(f => f.status === tabFilter);
    }

    // 2. Apply FilterBar quick-filter
    const mapped = FILTER_MAP[barFilter];
    if (mapped === '__critical__') {
      list = list.filter(f => f.status === 'cancelled' || (f.delayMinutes && f.delayMinutes >= 120));
    } else if (mapped) {
      list = list.filter(f => f.status === mapped);
    }

    // 3. Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f =>
        f.flightNumber.toLowerCase().includes(q) ||
        f.origin.code.toLowerCase().includes(q) ||
        (f.origin.city?.toLowerCase() || '').includes(q) ||
        f.destination.code.toLowerCase().includes(q) ||
        (f.destination.city?.toLowerCase() || '').includes(q) ||
        f.aircraft?.toLowerCase().includes(q) ||
        f.gate?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [tabFilter, barFilter, searchQuery]);

  const statusCounts = {
    all: mockFlights.length,
    'on-time': mockFlights.filter(f => f.status === 'on-time').length,
    delayed: mockFlights.filter(f => f.status === 'delayed').length,
    cancelled: mockFlights.filter(f => f.status === 'cancelled').length,
    boarding: mockFlights.filter(f => f.status === 'boarding').length,
    landed: mockFlights.filter(f => f.status === 'landed').length,
  };

  return (
    <>
      <Header title="Painel de Voos (FIDS)" subtitle="Monitoramento da Malha em Tempo Real" />
      <div className="app-content">
        <FilterBar
          onSearch={setSearchQuery}
          filters={['Atrasados', 'Cancelados', 'Críticos']}
          onFilterChange={(f) => {
            setBarFilter(f);
            // Reset tab when using bar filter
            if (f !== 'Todos') setTabFilter('all');
          }}
        />
        
        <div className="glass-card full-width">
          <div className="page-header-row">
            <div>
              <h2 className="page-title">Operações do Dia</h2>
              <p className="page-subtitle">{mockFlights.length} voos monitorados • {mockIROPs.length} disrupções ativas</p>
            </div>
            <button className="btn btn-ghost">
              <RefreshCw size={14} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="tabs">
          {Object.entries(statusCounts).map(([key, count]) => (
            <button
              key={key}
              className={`tab ${tabFilter === key ? 'active' : ''}`}
              onClick={() => {
                setTabFilter(key);
                setBarFilter('Todos');
              }}
            >
              {key === 'all' ? 'Todos' : key === 'on-time' ? 'No Horário' : key === 'delayed' ? 'Atrasado' : key === 'cancelled' ? 'Cancelado' : key === 'boarding' ? 'Embarque' : 'Pousou'} ({count})
            </button>
          ))}
        </div>

        {/* Disruption Alerts */}
        {mockIROPs.length > 0 && (
          <div className="glass-card" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="glass-card-header">
              <span className="glass-card-title">
                <AlertTriangle size={16} style={{ color: 'var(--warning)' }} /> Alertas de Disrupção
              </span>
            </div>
            {mockIROPs.map((irop) => (
              <div key={irop.id} className={`disruption-alert severity-${irop.severity}`}>
                <div style={{ flex: 1 }}>
                  <div className="disruption-alert-title">
                    {irop.type === 'cancellation' ? '❌' : '⏱️'} {irop.flightNumber} — {irop.type === 'cancellation' ? 'Cancelado' : `Atraso ${irop.delayMinutes}min`}
                  </div>
                  <div className="disruption-alert-desc">
                    {irop.reason}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={10} /> {irop.affectedPassengers} passageiros
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> Assistência: {irop.assistanceLevelRequired}
                    </span>
                    {irop.alternativeFlights && (
                      <span style={{ fontSize: 10, color: 'var(--success-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Plane size={10} /> {irop.alternativeFlights.length} alternativas
                      </span>
                    )}
                  </div>
                </div>
                <span className="disruption-alert-time">
                  {new Date(irop.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Flight Board */}
        <div className="glass-card">
          <div className="glass-card-header">
            <span className="glass-card-title">
              <Plane size={16} /> Painel de Voos
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
              {filtered.length} de {mockFlights.length} voos
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="flight-board">
              <thead>
                <tr>
                  <th>Voo</th>
                  <th>Origem</th>
                  <th>Destino</th>
                  <th>Partida</th>
                  <th>Chegada</th>
                  <th>Status</th>
                  <th>Portão</th>
                  <th>Terminal</th>
                  <th>Aeronave</th>
                  <th>Atraso</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                      Nenhum voo encontrado para o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((flight) => (
                    <tr key={flight.id}>
                      <td><span className="flight-number">{flight.flightNumber}</span></td>
                      <td>
                        <div>
                          <span className="flight-route-code">{flight.origin.code}</span>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{flight.origin.city}</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span className="flight-route-code">{flight.destination.code}</span>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{flight.destination.city}</div>
                        </div>
                      </td>
                      <td className="flight-time">
                        {new Date(flight.scheduledDeparture).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="flight-time">
                        {flight.scheduledArrival
                          ? new Date(flight.scheduledArrival).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td>
                        <span className={`badge ${flight.status === 'on-time' ? 'on-time' : flight.status}`}>
                          <span className="badge-dot" />
                          {flight.status === 'on-time' ? 'No horário' : flight.status === 'delayed' ? 'Atrasado' : flight.status === 'cancelled' ? 'Cancelado' : flight.status === 'boarding' ? 'Embarque' : 'Pousou'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{flight.gate || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{flight.terminal || '—'}</td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{flight.aircraft}</td>
                      <td>
                        {flight.delayMinutes ? (
                          <span style={{ color: 'var(--error)', fontWeight: 600, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
                            +{flight.delayMinutes}min
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Events Timeline */}
        <div className="glass-card" style={{ marginTop: 'var(--space-lg)' }}>
          <div className="glass-card-header">
            <span className="glass-card-title">
              <Clock size={16} /> Eventos Recentes
            </span>
          </div>
          <div>
            {mockFlightStatusEvents.map((event, idx) => (
              <div key={idx} className="session-item">
                <div className="session-avatar" style={{
                  background: event.eventType === 'cancellation' ? 'var(--error-bg)' : event.eventType === 'gate-change' ? 'var(--info-bg)' : 'var(--warning-bg)',
                  color: event.eventType === 'cancellation' ? 'var(--error-light)' : event.eventType === 'gate-change' ? 'var(--info-light)' : 'var(--warning-light)',
                }}>
                  {event.eventType === 'cancellation' ? '❌' : event.eventType === 'gate-change' ? '🚪' : '⏱️'}
                </div>
                <div className="session-info">
                  <div className="session-name">
                    {event.flightNumber} — {event.eventType === 'delay' ? `Atraso atualizado: ${event.delayMinutes}min` : event.eventType === 'cancellation' ? 'Cancelamento' : `Portão alterado: ${event.newGate}`}
                  </div>
                  <div className="session-intent">{event.reasonDescription}</div>
                </div>
                <span className="session-time">
                  {new Date(event.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
