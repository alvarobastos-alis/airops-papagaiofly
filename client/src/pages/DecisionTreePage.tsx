// ==========================================
// Papagaio Fly — Decision Tree Page
// Interactive visualization of LLM-generated SAC flows
// ==========================================

import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import {
  GitBranch, ChevronDown, ChevronRight, Bot, UserRound, Globe, AlertTriangle,
  CheckCircle2, Loader2, RefreshCw,
} from 'lucide-react';

interface ScenarioNode {
  scenario: string;
  ai_resolution_steps: string[];
  english_guidance: string;
  escalate_to_human: boolean;
  escalation_reason: string | null;
}

interface Category {
  category: string;
  nodes: ScenarioNode[];
}

interface DecisionTree {
  scenarios: Category[];
}

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  'Cancelamentos':     { icon: '❌', color: '#ef4444' },
  'Bagagem':           { icon: '🧳', color: '#f59e0b' },
  'Pagamentos':        { icon: '💳', color: '#8b5cf6' },
  'Check-in':          { icon: '✈️', color: '#06b6d4' },
  'Alterações de Voo': { icon: '🔄', color: '#3b82f6' },
  'Reembolsos':        { icon: '💰', color: '#10b981' },
};

function getMetaFor(cat: string) {
  return CATEGORY_META[cat] || { icon: '📋', color: '#64748b' };
}

export default function DecisionTreePage() {
  const [tree, setTree] = useState<DecisionTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const fetchTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/decision-tree');
      if (!res.ok) throw new Error('Árvore de decisão ainda não foi gerada.');
      const data = await res.json();
      setTree(data);
      // Expand the first category by default
      if (data.scenarios?.length) {
        setExpandedCats(new Set([data.scenarios[0].category]));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTree(); }, []);

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const toggleNode = (key: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Stats
  const totalScenarios = tree?.scenarios.reduce((acc, c) => acc + c.nodes.length, 0) || 0;
  const aiResolvable = tree?.scenarios.reduce((acc, c) => acc + c.nodes.filter(n => !n.escalate_to_human).length, 0) || 0;
  const humanEscalation = totalScenarios - aiResolvable;

  return (
    <>
      <Header title="Árvore de Decisão" subtitle="Fluxos gerados por IA com validação de compliance ANAC" />
      <div className="app-content">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h2 className="page-title">🌳 Árvore de Decisão — SAC Papagaio Fly</h2>
              <p className="page-subtitle">Gerada automaticamente via Agentic Workflow (Brainstorm → Arquiteto → Crítico ANAC)</p>
            </div>
            <button onClick={fetchTree} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--brand-primary)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <RefreshCw size={14} /> Recarregar
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
          <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--brand-primary)' }}>{tree?.scenarios.length || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Categorias</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{totalScenarios}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Cenários Mapeados</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>{aiResolvable}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Resolvíveis pela IA</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>{humanEscalation}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Escalação Humana</div>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="empty-state">
            <Loader2 className="empty-state-icon" style={{ animation: 'spin 1s linear infinite' }} />
            <div className="empty-state-title">Carregando árvore de decisão...</div>
          </div>
        )}
        {error && (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">{error}</div>
            <div className="empty-state-desc">Execute o script <code>generate_decision_tree.py</code> para gerar a base de conhecimento.</div>
          </div>
        )}

        {/* Decision Tree Visualization */}
        {tree && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {tree.scenarios.map((cat) => {
              const meta = getMetaFor(cat.category);
              const isExpanded = expandedCats.has(cat.category);
              return (
                <div key={cat.category} className="glass-card" style={{ overflow: 'hidden' }}>
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCat(cat.category)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--space-lg)',
                      cursor: 'pointer', userSelect: 'none',
                      borderBottom: isExpanded ? '1px solid var(--border-default)' : 'none',
                    }}
                  >
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span style={{ fontSize: 22 }}>{meta.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {cat.category}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {cat.nodes.length} cenários • {cat.nodes.filter(n => !n.escalate_to_human).length} IA /&nbsp;
                        {cat.nodes.filter(n => n.escalate_to_human).length} humano
                      </div>
                    </div>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', backgroundColor: meta.color,
                      boxShadow: `0 0 8px ${meta.color}50`
                    }} />
                  </div>

                  {/* Nodes */}
                  {isExpanded && (
                    <div style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                      {cat.nodes.map((node, nIdx) => {
                        const nodeKey = `${cat.category}-${nIdx}`;
                        const isNodeExpanded = expandedNodes.has(nodeKey);
                        return (
                          <div key={nIdx} style={{
                            marginBottom: 'var(--space-md)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-default)',
                            background: 'var(--bg-elevated)',
                            overflow: 'hidden',
                          }}>
                            {/* Node Header */}
                            <div
                              onClick={() => toggleNode(nodeKey)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '12px 16px', cursor: 'pointer', userSelect: 'none',
                              }}
                            >
                              {isNodeExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              <GitBranch size={14} style={{ color: meta.color, flexShrink: 0 }} />
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                                {node.scenario}
                              </span>
                              {node.escalate_to_human ? (
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                                  background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                  <UserRound size={10} /> Humano
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                                  background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                  <Bot size={10} /> IA
                                </span>
                              )}
                            </div>

                            {/* Node Body */}
                            {isNodeExpanded && (
                              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-default)' }}>
                                {/* AI Resolution Steps */}
                                <div style={{ marginTop: 12 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <Bot size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                    Passos de Resolução (IA)
                                  </div>
                                  {node.ai_resolution_steps.map((step, sIdx) => (
                                    <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0' }}>
                                      <div style={{
                                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                        background: `${meta.color}18`, color: meta.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 700,
                                      }}>{sIdx + 1}</div>
                                      <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{step}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* English Guidance */}
                                <div style={{
                                  marginTop: 16, padding: 12, borderRadius: 8,
                                  background: 'rgba(59,130,246,0.06)', borderLeft: '3px solid #3b82f6',
                                }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Globe size={12} /> English Guidance (Foreigners)
                                  </div>
                                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                                    "{node.english_guidance}"
                                  </p>
                                </div>

                                {/* Escalation Warning */}
                                {node.escalate_to_human && node.escalation_reason && (
                                  <div style={{
                                    marginTop: 12, padding: 12, borderRadius: 8,
                                    background: 'rgba(239,68,68,0.06)', borderLeft: '3px solid #ef4444',
                                  }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <AlertTriangle size={12} /> Escalação para Humano
                                    </div>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                      {node.escalation_reason}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
