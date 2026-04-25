import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Users, Clock, Smile, AlertTriangle, PhoneCall } from 'lucide-react';
import Header from '../components/layout/Header';

export default function LiveQueuePage() {
  const [data, setData] = useState<any>(null);
  const [now, setNow] = useState(Date.now());

  // Polling data
  useEffect(() => {
    const fetchData = () => {
      fetch('http://localhost:3001/api/sac/live-queue')
        .then(r => r.json())
        .then(d => setData(d))
        .catch(e => console.error('Error fetching live queue', e));
    };
    
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update clock for live duration counters
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!data) return <div style={{ padding: 40, color: 'white' }}>Carregando Torre de Controle...</div>;

  const formatDuration = (startedAt: string) => {
    const diff = Math.floor((now - new Date(startedAt).getTime()) / 1000);
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'var(--success)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--danger)';
  };

  const formatTMA = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      <Header title="Torre de Controle (Live Queue)" subtitle="Monitoramento da Fila de IA e Transbordo SAC" />
      <div className="app-content">
        
        {/* KPIs */}
        <motion.div 
          className="kpi-grid"
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="kpi-card primary">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Sessões IA Ativas</span>
              <div className="kpi-card-icon"><Headphones size={20} /></div>
            </div>
            <div className="kpi-card-value">{data.metrics.activeCalls}</div>
            <div className="kpi-card-change positive">Atendimentos automáticos fluindo</div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="kpi-card danger">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Aguardando Humano</span>
              <div className="kpi-card-icon"><Users size={20} /></div>
            </div>
            <div className="kpi-card-value" style={{ color: data.metrics.waitingCalls > 0 ? 'var(--danger)' : 'inherit' }}>
              {data.metrics.waitingCalls}
            </div>
            <div className="kpi-card-change" style={{ color: 'var(--text-muted)' }}>Fila de Transbordo (Escalonamento)</div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="kpi-card warning">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Tempo Médio (TMA)</span>
              <div className="kpi-card-icon"><Clock size={20} /></div>
            </div>
            <div className="kpi-card-value">{formatTMA(data.metrics.avgDurationSeconds)}</div>
            <div className="kpi-card-change">Duração global do atendimento</div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="kpi-card success">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Satisfação (Score)</span>
              <div className="kpi-card-icon"><Smile size={20} /></div>
            </div>
            <div className="kpi-card-value" style={{ color: getScoreColor(data.metrics.avgSatisfactionScore) }}>
              {data.metrics.avgSatisfactionScore}%
            </div>
            <div className="kpi-card-change">Média de Sentimento ao Vivo</div>
          </motion.div>
        </motion.div>

        {/* Call List */}
        <motion.div 
          className="dashboard-grid"
          style={{ gridTemplateColumns: '1fr', marginTop: '24px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="glass-card-header" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="glass-card-title"><PhoneCall size={16} /> Fila de Atendimento ao Vivo</span>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 24px', fontWeight: 600 }}>PNR / Passageiro</th>
                    <th style={{ padding: '12px 24px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 24px', fontWeight: 600 }}>Duração</th>
                    <th style={{ padding: '12px 24px', fontWeight: 600 }}>Árvore de Decisão</th>
                    <th style={{ padding: '12px 24px', fontWeight: 600 }}>Score (Satisfação)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.calls.sort((a:any, b:any) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()).map((call: any) => (
                    <tr 
                      key={call.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: call.status === 'waiting_human' ? 'rgba(255, 68, 68, 0.05)' : 'transparent',
                        animation: call.status === 'waiting_human' ? 'pulse 2s infinite' : 'none'
                      }}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{call.pnr}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{call.customerName}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {call.status === 'ai_handling' && <span style={{ color: 'var(--brand-primary)', background: 'rgba(0, 163, 255, 0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>🤖 IA Atendendo</span>}
                        {call.status === 'waiting_human' && <span style={{ color: 'var(--danger)', background: 'rgba(255, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}><AlertTriangle size={12} style={{display:'inline', marginBottom:'-2px', marginRight:'4px'}}/>Aguardando Humano</span>}
                        {call.status === 'human_handling' && <span style={{ color: 'var(--warning)', background: 'rgba(255, 170, 0, 0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>👨‍💻 Em Atendimento (Humano)</span>}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{call.agentId}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '14px', 
                          fontWeight: 700,
                          color: (now - new Date(call.startedAt).getTime() > 300000 && call.status === 'waiting_human') ? 'var(--danger)' : 'var(--text-primary)'
                        }}>
                          {formatDuration(call.startedAt)}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                        {call.currentNode}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${call.satisfactionScore}%`, 
                              background: getScoreColor(call.satisfactionScore),
                              transition: 'width 0.5s ease-in-out'
                            }} />
                          </div>
                          <span style={{ fontWeight: 600, color: getScoreColor(call.satisfactionScore) }}>
                            {call.satisfactionScore}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.calls.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhuma chamada ativa no momento.
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { background-color: rgba(255, 68, 68, 0.05); }
          50% { background-color: rgba(255, 68, 68, 0.15); }
          100% { background-color: rgba(255, 68, 68, 0.05); }
        }
      `}</style>
    </>
  );
}
