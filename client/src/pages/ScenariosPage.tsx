// ==========================================
// AirOps AI — Scenarios Catalog Page
// ==========================================

import { useState } from 'react';
import { BookOpen, Zap, ChevronRight, CheckCircle2, AlertCircle, Circle, ArrowRight, X } from 'lucide-react';
import Header from '../components/layout/Header';
import { FilterBar } from '../components/ui/FilterBar';
import { scenarios, scenarioBlocks } from '../data/scenarioCatalog';
import type { Scenario } from '../types/scenarios';

export default function ScenariosPage() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = activeBlock
    ? scenarios.filter(s => s.block === activeBlock)
    : scenarios;

  return (
    <>
      <Header title="Catálogo de Cenários" subtitle="20 cenários de SAC codificados com regras ANAC e decisões do agente" />
      <div className="app-content">
        <FilterBar onSearch={setSearchQuery} filters={['Alta Fricção', 'Cobrança', 'Info']} />
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h2 className="page-title">Matriz Completa de Cenários</h2>
              <p className="page-subtitle">Cada cenário define dados consultados, regras aplicáveis, decisão do agente e saída</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: 'var(--brand-primary-light)' }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Automatização média: <strong style={{ color: 'var(--text-primary)' }}>79.3%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Block Filter Tabs */}
        <div className="tabs" style={{ flexWrap: 'wrap' }}>
          <button className={`tab ${!activeBlock ? 'active' : ''}`} onClick={() => setActiveBlock(null)}>
            Todos ({scenarios.length})
          </button>
          {scenarioBlocks.map(block => (
            <button
              key={block.id}
              className={`tab ${activeBlock === block.id ? 'active' : ''}`}
              onClick={() => setActiveBlock(block.id === activeBlock ? null : block.id)}
            >
              {block.emoji} {block.titlePt} ({block.scenarios.length})
            </button>
          ))}
        </div>

        {/* Scenario Grid */}
        <div className="scenario-grid stagger-children">
          {filtered.map(scenario => (
            <div
              key={scenario.id}
              className="scenario-card"
              onClick={() => setSelectedScenario(scenario)}
            >
              <div className="scenario-card-number">{scenario.blockEmoji} Cenário #{scenario.number}</div>
              <div className="scenario-card-title">{scenario.title}</div>
              <div className="scenario-card-desc">{scenario.description}</div>
              <div className="scenario-card-footer">
                <div className="scenario-card-tags">
                  {scenario.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="scenario-tag">{tag}</span>
                  ))}
                </div>
                <span className={`badge automation-${scenario.automationLevel === 'total' || scenario.automationLevel === 'high' ? 'high' : scenario.automationLevel === 'medium' ? 'medium' : 'low'}`}>
                  {scenario.automationPercent}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Scenario Detail Modal */}
        {selectedScenario && (
          <div style={{
            position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 'var(--z-modal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)',
          }} onClick={() => setSelectedScenario(null)}>
            <div
              className="glass-card animate-slide-up"
              style={{ maxWidth: 640, width: '100%', maxHeight: '80vh', overflow: 'auto', background: 'var(--bg-surface)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>
                    {selectedScenario.blockEmoji} Cenário #{selectedScenario.number}
                  </div>
                  <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedScenario.title}
                  </h2>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {selectedScenario.description}
                  </p>
                </div>
                <button className="header-btn" onClick={() => setSelectedScenario(null)}>
                  <X size={16} />
                </button>
              </div>

              {/* Data Sources */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-accent)', marginBottom: 8 }}>
                  📊 Dados Consultados
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedScenario.dataSources.map(ds => (
                    <span key={ds} style={{
                      padding: '4px 12px', borderRadius: 'var(--radius-full)',
                      background: 'rgba(99,102,241,0.08)', color: 'var(--brand-primary-light)',
                      fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
                    }}>{ds}</span>
                  ))}
                </div>
              </div>

              {/* Rules */}
              {(selectedScenario.anacRule || selectedScenario.businessRule) && (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-accent)', marginBottom: 8 }}>
                    ⚖️ Regras
                  </h3>
                  {selectedScenario.anacRule && (
                    <div style={{
                      padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                      background: 'var(--warning-bg)', borderLeft: '3px solid var(--warning)',
                      fontSize: 'var(--text-xs)', color: 'var(--text-primary)', marginBottom: 8,
                    }}>
                      <strong>ANAC:</strong> {selectedScenario.anacRule}
                    </div>
                  )}
                  {selectedScenario.businessRule && (
                    <div style={{
                      padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                      background: 'var(--info-bg)', borderLeft: '3px solid var(--info)',
                      fontSize: 'var(--text-xs)', color: 'var(--text-primary)',
                    }}>
                      <strong>Negócio:</strong> {selectedScenario.businessRule}
                    </div>
                  )}
                </div>
              )}

              {/* Decision Flow */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-accent)', marginBottom: 8 }}>
                  🧠 Fluxo de Decisão do Agente
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedScenario.steps.map((step, idx) => (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: step.type === 'action' ? 'var(--success-bg)' : step.type === 'decision' ? 'rgba(99,102,241,0.12)' : step.type === 'rule-check' ? 'var(--warning-bg)' : step.type === 'escalation' ? 'var(--error-bg)' : 'rgba(148,163,184,0.08)',
                        color: step.type === 'action' ? 'var(--success-light)' : step.type === 'decision' ? 'var(--brand-primary-light)' : step.type === 'rule-check' ? 'var(--warning-light)' : step.type === 'escalation' ? 'var(--error-light)' : 'var(--text-muted)',
                        fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0,
                      }}>
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{step.label}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{step.description}</div>
                      </div>
                      {idx < selectedScenario.steps.length - 1 && (
                        <ArrowRight size={12} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Outputs */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-accent)', marginBottom: 8 }}>
                  📤 Saídas Possíveis
                </h3>
                {selectedScenario.outputs.map(out => (
                  <div key={out} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    {out}
                  </div>
                ))}
              </div>

              {/* Automation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--space-md)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <Zap size={16} style={{ color: 'var(--brand-primary-light)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Nível de Automação</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${selectedScenario.automationPercent}%`, height: '100%',
                        background: selectedScenario.automationPercent >= 80 ? 'var(--brand-gradient-success)' : selectedScenario.automationPercent >= 60 ? 'var(--brand-gradient)' : 'var(--brand-gradient-warm)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{selectedScenario.automationPercent}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
