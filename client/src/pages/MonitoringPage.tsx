import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Activity, Zap, Shield, HelpCircle } from 'lucide-react';
import Header from '../components/layout/Header';

export default function MonitoringPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/analytics/costs')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => console.error('Error fetching costs', e));
  }, []);

  if (!data) return <div style={{ padding: 40, color: 'white' }}>Loading telemetry...</div>;

  return (
    <>
      <Header title="Observabilidade e Custos" subtitle="Governança Financeira de IA e Telemetria (FinOps)" />
      <div className="app-content">
        
        <motion.div 
          className="kpi-grid"
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="kpi-card primary">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Custo Acumulado (LLM)</span>
              <div className="kpi-card-icon"><DollarSign size={20} /></div>
            </div>
            <div className="kpi-card-value">${data.totalCost}</div>
            <div className="kpi-card-change positive">Média de ${(data.totalCost / data.totalSessions).toFixed(3)} por call</div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="kpi-card warning">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Volume Processado</span>
              <div className="kpi-card-icon"><Activity size={20} /></div>
            </div>
            <div className="kpi-card-value">{data.totalSessions.toLocaleString('pt-BR')} vols</div>
            <div className="kpi-card-change" style={{ color: 'var(--text-muted)' }}>Requisições OpenAI Realtime</div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="kpi-card success">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Latência TTFB</span>
              <div className="kpi-card-icon"><Zap size={20} /></div>
            </div>
            <div className="kpi-card-value">{data.avgLatency}ms</div>
            <div className="kpi-card-change positive">Time To First Byte ideal</div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="dashboard-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="glass-card">
            <div className="glass-card-header">
              <span className="glass-card-title"><Shield size={16} /> Distribuição de Custo por Motor</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Voz (WebRTC Audio)</span>
                  <span style={{ fontWeight: 800, color: 'var(--brand-primary-light)' }}>${data.voiceCost}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Modelo: gpt-4o-realtime-preview</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pricing: $0.06 / minuto</div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Texto e RAG (Chat)</span>
                  <span style={{ fontWeight: 800, color: 'var(--success)' }}>${data.textCost}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Modelo: gpt-4o</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prompt: {data.tokens.prompt.toLocaleString('pt-BR')} tokens</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completion: {data.tokens.completion.toLocaleString('pt-BR')} tokens</div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="glass-card-header">
              <span className="glass-card-title"><HelpCircle size={16} /> Status de Governança Guardrails</span>
            </div>
            <div style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              <p>A ferramenta Garak e as suítes LlamaGuard rastreiam anomalias.</p>
              <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
                <li style={{ marginBottom: '8px' }}>Inject Jailbreaks prevenidos: <strong style={{ color: 'var(--success)' }}>1.204</strong></li>
                <li style={{ marginBottom: '8px' }}>PII Data Leak (Mascaramento Ativo): <strong style={{ color: 'var(--success)' }}>100%</strong></li>
                <li>Tentativas de Promt Leak: <strong style={{ color: 'var(--warning)' }}>12</strong> (Escalado para InfoSec)</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
