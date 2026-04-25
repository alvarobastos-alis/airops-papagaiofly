// ==========================================
// AirOps AI — ANAC Rules Page
// With RAG Search Integration
// ==========================================

import { useState, useRef } from 'react';
import { Scale, Clock, Plane, Luggage, Shield, AlertTriangle, CheckCircle2, Users, ArrowRight, Search, Loader2, BookOpen, ExternalLink, MessageSquare } from 'lucide-react';
import Header from '../components/layout/Header';
import { anacTimeline, decisionPriority } from '../data/anacRules';

const baggageRules = [
  {
    title: 'Voo Doméstico',
    deadline: '7 dias',
    description: 'Prazo máximo para localização de bagagem em voos domésticos. Após esse prazo, a bagagem é considerada perdida e indenização é devida.',
    icon: '🇧🇷',
    color: '#10b981',
  },
  {
    title: 'Voo Internacional',
    deadline: '21 dias',
    description: 'Prazo máximo para localização de bagagem em voos internacionais. Após esse prazo, indenização integral conforme política e Convenção de Montreal.',
    icon: '🌍',
    color: '#06b6d4',
  },
];

const regulatoryAxis = [
  { question: 'Existe obrigação imediata de assistência?', description: 'Verificar se há dever de assistência material (comunicação, alimentação, hospedagem)' },
  { question: 'Existe direito de escolha?', description: 'Reacomodação, remarcação ou reembolso — passageiro escolhe' },
  { question: 'Há prazo legal ou regulatório correndo?', description: 'Tempo de atraso, prazo de bagagem, prazo de reembolso' },
];

const operationalAxis = [
  { question: 'Existe voo alternativo?', description: 'Verificar inventário para reacomodação' },
  { question: 'O cliente aceita crédito?', description: 'Priorizar voucher/crédito antes do reembolso' },
  { question: 'O passageiro tem status alto?', description: 'Priorizar atendimento de clientes premium' },
  { question: 'O problema é resolvível sem humano?', description: 'Automação vs escalação' },
  { question: 'Há risco de judicialização?', description: 'Avaliar risco reputacional e legal' },
];

interface RAGResult {
  answer: string;
  sources: Array<{ document_name?: string; article?: string; chunk_id?: string; relevance_score?: number }>;
  confidence: string;
  needs_human_review: boolean;
  disclaimer?: string;
}

function RAGSearchPanel() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ q: string; a: RAGResult }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('http://localhost:3001/api/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, channel: 'dashboard' }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Erro ${res.status}`);
      }

      const data: RAGResult = await res.json();
      setResult(data);
      setHistory(prev => [{ q, a: data }, ...prev.slice(0, 9)]);
    } catch (e: any) {
      setError(e.message || 'Falha ao consultar a base de conhecimento.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const confidenceColor = (c: string) => {
    if (c === 'alta') return '#10b981';
    if (c === 'média' || c === 'media') return '#f59e0b';
    return '#ef4444';
  };

  const suggestedQuestions = [
    'Quais são os direitos do passageiro em caso de atraso superior a 4 horas?',
    'Quando a companhia deve fornecer hospedagem?',
    'O passageiro pode pedir reembolso em tarifa não-reembolsável após cancelamento?',
    'Qual o prazo para reembolso segundo a Resolução 400?',
    'Bagagem extraviada em voo internacional: quais os direitos?',
  ];

  return (
    <div className="glass-card full-width" style={{ overflow: 'hidden' }}>
      <div className="glass-card-header" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <span className="glass-card-title">
          <Search size={16} /> Consultar Regras ANAC (RAG)
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
          Pesquisa semântica na base de documentos regulatórios
        </span>
      </div>

      {/* Search Input */}
      <div style={{ padding: 'var(--space-lg)', borderBottom: result || error ? '1px solid var(--border-default)' : 'none' }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)', padding: '4px 4px 4px 16px',
          transition: 'border-color 0.2s',
        }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre regras ANAC, direitos de passageiros, bagagem..."
            style={{
              flex: 1, border: 'none', background: 'transparent',
              color: 'var(--text-primary)', fontSize: 14, padding: '10px 0',
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            style={{
              padding: '8px 20px', borderRadius: 'var(--radius-sm)',
              border: 'none', background: loading ? 'var(--bg-card)' : 'var(--brand-primary)',
              color: '#fff', fontWeight: 600, fontSize: 13, cursor: loading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: !query.trim() ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
            {loading ? 'Buscando...' : 'Pesquisar'}
          </button>
        </div>

        {/* Suggested Questions */}
        {!result && !error && !loading && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Perguntas Sugeridas
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {suggestedQuestions.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(sq);
                    inputRef.current?.focus();
                  }}
                  style={{
                    padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border-default)',
                    background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                    fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.color = 'var(--brand-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-primary)', marginBottom: 8 }} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Consultando base de documentos regulatórios...</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: 'var(--space-lg)', background: 'rgba(239,68,68,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
            <AlertTriangle size={16} /> Erro na consulta
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{error}</div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div style={{ padding: 'var(--space-lg)' }}>
          {/* Confidence Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
              padding: '4px 10px', borderRadius: 20,
              background: `${confidenceColor(result.confidence)}15`,
              color: confidenceColor(result.confidence),
            }}>
              <CheckCircle2 size={12} /> Confiança: {result.confidence}
            </span>
            {result.needs_human_review && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
                padding: '4px 10px', borderRadius: 20,
                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              }}>
                <AlertTriangle size={12} /> Requer revisão humana
              </span>
            )}
          </div>

          {/* Answer */}
          <div style={{
            fontSize: 14, lineHeight: 1.75, color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap', padding: 16, borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)', borderLeft: `3px solid ${confidenceColor(result.confidence)}`,
          }}>
            {result.answer}
          </div>

          {/* Disclaimer */}
          {result.disclaimer && (
            <div style={{
              marginTop: 12, padding: 12, borderRadius: 'var(--radius-md)',
              background: 'rgba(245,158,11,0.06)', borderLeft: '3px solid #f59e0b',
              fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic',
            }}>
              ⚖️ {result.disclaimer}
            </div>
          )}

          {/* Sources */}
          {result.sources.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <BookOpen size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Fontes ({result.sources.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.sources.map((src, i) => (
                  <span key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 6,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                    fontSize: 11, color: 'var(--text-secondary)',
                  }}>
                    <ExternalLink size={10} />
                    {src.document_name || src.chunk_id || `Fonte ${i + 1}`}
                    {src.article && <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}> • {src.article}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && !loading && (
        <div style={{
          borderTop: '1px solid var(--border-default)', padding: 'var(--space-md) var(--space-lg)',
          maxHeight: 200, overflowY: 'auto',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <MessageSquare size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Consultas Recentes
          </div>
          {history.map((h, i) => (
            <button
              key={i}
              onClick={() => { setQuery(h.q); setResult(h.a); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '6px 10px', borderRadius: 6, border: 'none',
                background: i === 0 ? 'rgba(0,163,255,0.05)' : 'transparent',
                color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
                marginBottom: 2, transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = i === 0 ? 'rgba(0,163,255,0.05)' : 'transparent'; }}
            >
              {h.q}
              <span style={{ fontSize: 10, color: confidenceColor(h.a.confidence), marginLeft: 8 }}>({h.a.confidence})</span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function RulesPage() {
  return (
    <>
      <Header title="Motor de Regras ANAC" subtitle="Resolução 400 codificada para o agente decisório" />
      <div className="app-content">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h2 className="page-title">⚖️ Regras ANAC — Resolução 400</h2>
              <p className="page-subtitle">Motor regulatório e operacional que guia as decisões do agente AirOps AI</p>
            </div>
          </div>
        </div>

        {/* RAG Search Panel — Featured at the top */}
        <RAGSearchPanel />

        <div className="dashboard-grid">
          {/* ANAC Assistance Timeline */}
          <div className="glass-card">
            <div className="glass-card-header">
              <span className="glass-card-title">
                <Clock size={16} /> Escala de Assistência Material
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
              A assistência material é obrigatória independentemente do motivo da disrupção (inclusive força maior).
            </p>
            <div className="rules-timeline">
              {anacTimeline.slice(0, 4).map((rule, idx) => (
                <div key={idx} className="rule-item">
                  <div className="rule-time" style={{ color: rule.color }}>{rule.time}</div>
                  <div className="rule-title">{rule.title}</div>
                  <div className="rule-desc">{rule.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Baggage Rules */}
          <div className="glass-card">
            <div className="glass-card-header">
              <span className="glass-card-title">
                <Luggage size={16} /> Prazos de Bagagem
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
              Prazos legais para localização antes de considerar a bagagem como perdida.
            </p>
            {baggageRules.map((rule, idx) => (
              <div key={idx} style={{
                padding: 'var(--space-lg)',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                borderLeft: `3px solid ${rule.color}`,
                marginBottom: 'var(--space-md)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 'var(--text-lg)' }}>{rule.icon}</span>
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{rule.title}</span>
                  <span style={{
                    marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontWeight: 700,
                    fontSize: 'var(--text-lg)', color: rule.color,
                  }}>{rule.deadline}</span>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {rule.description}
                </p>
              </div>
            ))}

            <div style={{ marginTop: 'var(--space-lg)' }}>
              <div className="glass-card-header">
                <span className="glass-card-title">
                  <Luggage size={16} /> Fluxo de Bagagem
                </span>
              </div>
              {['Registrar PIR/ocorrência', 'Rastrear e localizar', 'Entregar no destino informado', 'Indenizar/reembolsar se prazo ultrapassado'].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16,185,129,0.12)', color: 'var(--success-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{step}</span>
                  {i < 3 && <ArrowRight size={12} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Decision Axes */}
          <div className="glass-card">
            <div className="glass-card-header">
              <span className="glass-card-title">
                <Shield size={16} /> Eixo Regulatório
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
              Perguntas que o agente avalia para determinar obrigações legais.
            </p>
            {regulatoryAxis.map((item, i) => (
              <div key={i} style={{
                padding: 'var(--space-md)', background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)',
                borderLeft: '3px solid var(--warning)',
              }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  ⚖️ {item.question}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{item.description}</div>
              </div>
            ))}
          </div>

          <div className="glass-card">
            <div className="glass-card-header">
              <span className="glass-card-title">
                <Scale size={16} /> Eixo Operacional / Comercial
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
              Critérios de negócio que influenciam a decisão do agente.
            </p>
            {operationalAxis.map((item, i) => (
              <div key={i} style={{
                padding: 'var(--space-md)', background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)',
                borderLeft: '3px solid var(--brand-primary)',
              }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  💡 {item.question}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{item.description}</div>
              </div>
            ))}
          </div>

          {/* Decision Priority */}
          <div className="glass-card full-width">
            <div className="glass-card-header">
              <span className="glass-card-title">
                <Users size={16} /> Matriz de Priorização de Decisões
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
              Ordem de prioridade para resolução, conforme tipo de ocorrência.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
              {Object.values(decisionPriority).map((dp) => (
                <div key={dp.label} style={{
                  padding: 'var(--space-lg)', background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)',
                }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {dp.label}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 12 }}>
                    {dp.description}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {dp.priority.map((p, i) => (
                      <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 'var(--radius-sm)',
                          background: i === 0 ? 'var(--success-bg)' : i === 1 ? 'var(--info-bg)' : 'rgba(148,163,184,0.08)',
                          color: i === 0 ? 'var(--success-light)' : i === 1 ? 'var(--info-light)' : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, flexShrink: 0,
                        }}>{i + 1}</div>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
