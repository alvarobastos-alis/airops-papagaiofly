// ==========================================
// AirOps AI — Chat Page (Agent Conversacional)
// ==========================================

import { useState, useRef, useEffect } from 'react';
import {
  Send, Mic, Plane, User, CheckCircle2,
  CreditCard, Luggage, Clock, Shield, ChevronRight, Sparkles,
  Phone, Award, Ticket,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useConversation } from '../hooks/useConversation';
import type { AgentAction } from '../types/agent';

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export default function ChatPage() {
  const { messages, isThinking, currentPNR, currentIntent, identified, sendMessage, selectAction } = useConversation();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const suggestions = !identified
    ? ['Meu PNR é XKRM47', 'Reserva TBVN83', 'PNR JPWQ56', 'Localizador RNGS15', 'PNR WDLA68']
    : ['Qual o status do meu voo?', 'Quero remarcar meu voo', 'Preciso cancelar', 'Minha bagagem não chegou', 'Perdi minha conexão', 'Quero reembolso'];

  const passenger = currentPNR?.passengers[0];
  const segment = currentPNR?.segments[0];
  const ticket = currentPNR?.tickets[0];

  return (
    <>
      <Header title="Agente Conversacional" subtitle="Simulação de atendimento AirOps AI" />
      <div className="chat-page" style={{ height: 'calc(100vh - var(--header-height))' }}>
        {/* Chat Main Area */}
        <div className="chat-main">
          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.role}`}>
                <div className={`chat-avatar ${msg.role === 'agent' ? 'agent-avatar' : 'user-avatar'}`}>
                  {msg.role === 'agent' ? <Sparkles size={16} /> : <User size={16} />}
                </div>
                <div style={{ maxWidth: '100%' }}>
                  <div
                    className="chat-bubble"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                  />

                  {/* Thinking Steps */}
                  {msg.thinkingSteps && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {msg.thinkingSteps.map((step) => (
                        <span key={step.id} className="thinking-step done" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 'var(--radius-full)', color: 'var(--success-light)' }}>
                          <CheckCircle2 size={11} />
                          {step.label.replace('...', '')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Cards */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                      {msg.actions.map((action, i) => (
                        <ActionCard key={i} action={action} onSelect={selectAction} />
                      ))}
                    </div>
                  )}

                  {/* Security Pipeline Indicators */}
                  {msg.securityPipeline && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: '9px', borderTop: '1px solid var(--border-color)', paddingTop: 6 }}>
                      <span style={{ padding: '2px 6px', background: 'var(--bg-elevated)', borderRadius: 4, display: 'flex', alignItems: 'center', color: msg.securityPipeline.piiMasked ? 'var(--warning)' : 'var(--text-muted)' }} title="Layer 1: Data protection">
                        <Shield size={10} style={{ marginRight: 4 }} />
                        L1: PII Masking {msg.securityPipeline.piiMasked && '(Redacted)'}
                      </span>
                      <span style={{ padding: '2px 6px', background: 'var(--bg-elevated)', borderRadius: 4, display: 'flex', alignItems: 'center', color: msg.securityPipeline.jailbreakDetected ? 'var(--error)' : 'var(--success)' }} title="Layer 2: Anti-jailbreak">
                        <Shield size={10} style={{ marginRight: 4 }} />
                        L2: Safety Check
                      </span>
                      <span style={{ padding: '2px 6px', background: 'var(--bg-elevated)', borderRadius: 4, display: 'flex', alignItems: 'center', color: msg.securityPipeline.guardrailsPassed ? 'var(--success)' : 'var(--error)' }} title="Layer 3: Output filtering">
                        <Shield size={10} style={{ marginRight: 4 }} />
                        L3: Guardrails
                      </span>
                      {msg.securityPipeline.violations?.map((v, idx) => (
                        <span key={idx} style={{ padding: '2px 6px', background: 'var(--error-light)', color: '#fff', borderRadius: 4, display: 'flex', alignItems: 'center' }}>
                          Violated: {v.rule}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="chat-timestamp">{msg.timestamp}</div>
                </div>
              </div>
            ))}

            {/* Agent Thinking Animation */}
            {isThinking && (
              <div className="agent-thinking">
                <div className="chat-avatar agent-avatar">
                  <Sparkles size={16} />
                </div>
                <div className="thinking-bubble">
                  <div className="thinking-steps">
                    <div className="thinking-step active">
                      <span className="thinking-spinner" />
                      Processando...
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div className="chat-suggestions" style={{ padding: '0 var(--space-lg)' }}>
            {suggestions.map((s) => (
              <button key={s} className="chat-suggestion-btn" onClick={() => { setInput(s); sendMessage(s); }}>
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <div className="chat-input-wrapper">
              <button className="header-btn" style={{ border: 'none', background: 'none' }} title="Voz">
                <Mic size={18} />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
              />
              <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim()}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Passenger Context Sidebar */}
        <div className="chat-context">
          <div className="context-panel">
            <div className="context-section">
              <div className="context-section-title">
                <User size={12} style={{ display: 'inline', marginRight: 6 }} />
                Passageiro
              </div>
              {passenger ? (
                <>
                  <div className="context-field">
                    <span className="context-field-label">Nome</span>
                    <span className="context-field-value">{passenger.firstName} {passenger.lastName}</span>
                  </div>
                  <div className="context-field">
                    <span className="context-field-label">PNR</span>
                    <span className="context-field-value">{currentPNR?.locator}</span>
                  </div>
                  <div className="context-field">
                    <span className="context-field-label">Fidelidade</span>
                    <span className="context-field-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Award size={12} style={{ color: passenger.loyaltyTier === 'diamond' ? '#b9f2ff' : passenger.loyaltyTier === 'platinum' ? '#c0c0c0' : passenger.loyaltyTier === 'gold' ? '#ffd700' : 'var(--text-muted)' }} />
                      {passenger.loyaltyTier.toUpperCase()}
                    </span>
                  </div>
                  {passenger.loyaltyMiles && (
                    <div className="context-field">
                      <span className="context-field-label">Milhas</span>
                      <span className="context-field-value">{passenger.loyaltyMiles.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  <div className="context-field">
                    <span className="context-field-label">Telefone</span>
                    <span className="context-field-value" style={{ fontSize: 'var(--text-xs)' }}>{passenger.phone}</span>
                  </div>
                  <div className="context-field">
                    <span className="context-field-label">E-mail</span>
                    <span className="context-field-value" style={{ fontSize: 10 }}>{passenger.email}</span>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', padding: 'var(--space-md) 0' }}>
                  Aguardando identificação...
                </div>
              )}
            </div>

            {segment && (
              <div className="context-section">
                <div className="context-section-title">
                  <Plane size={12} style={{ display: 'inline', marginRight: 6 }} />
                  Voo
                </div>
                <div className="context-field">
                  <span className="context-field-label">Voo</span>
                  <span className="context-field-value">{segment.flightNumber}</span>
                </div>
                <div className="context-field">
                  <span className="context-field-label">Rota</span>
                  <span className="context-field-value">{segment.origin.code} → {segment.destination.code}</span>
                </div>
                <div className="context-field">
                  <span className="context-field-label">Status</span>
                  <span className={`badge ${segment.status === 'on-time' ? 'on-time' : segment.status}`}>
                    <span className="badge-dot" />
                    {segment.status === 'on-time' ? 'No horário' : segment.status === 'delayed' ? 'Atrasado' : segment.status === 'cancelled' ? 'Cancelado' : segment.status}
                  </span>
                </div>
                <div className="context-field">
                  <span className="context-field-label">Partida</span>
                  <span className="context-field-value">{new Date(segment.scheduledDeparture).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {segment.gate && (
                  <div className="context-field">
                    <span className="context-field-label">Portão</span>
                    <span className="context-field-value">{segment.gate}</span>
                  </div>
                )}
                {segment.delayMinutes && (
                  <div className="context-field">
                    <span className="context-field-label">Atraso</span>
                    <span className="context-field-value" style={{ color: 'var(--error)' }}>{segment.delayMinutes} min</span>
                  </div>
                )}
                <div className="context-field">
                  <span className="context-field-label">Aeronave</span>
                  <span className="context-field-value">{segment.aircraft}</span>
                </div>
                <div className="context-field">
                  <span className="context-field-label">Assento</span>
                  <span className="context-field-value">{segment.seatNumber}</span>
                </div>
              </div>
            )}

            {ticket && (
              <div className="context-section">
                <div className="context-section-title">
                  <Ticket size={12} style={{ display: 'inline', marginRight: 6 }} />
                  Bilhete
                </div>
                <div className="context-field">
                  <span className="context-field-label">E-ticket</span>
                  <span className="context-field-value" style={{ fontSize: 10 }}>{ticket.eTicket}</span>
                </div>
                <div className="context-field">
                  <span className="context-field-label">Tarifa</span>
                  <span className="context-field-value">{ticket.fareBasis}</span>
                </div>
                <div className="context-field">
                  <span className="context-field-label">Valor</span>
                  <span className="context-field-value">R$ {ticket.amount.toFixed(2)}</span>
                </div>
                <div className="context-field">
                  <span className="context-field-label">Reembolsável</span>
                  <span className="context-field-value" style={{ color: ticket.fareRules.refundable ? 'var(--success)' : 'var(--error)' }}>
                    {ticket.fareRules.refundable ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className="context-field">
                  <span className="context-field-label">Taxa alteração</span>
                  <span className="context-field-value">
                    {ticket.fareRules.changeFee > 0 ? `R$ ${ticket.fareRules.changeFee.toFixed(2)}` : 'Gratuita'}
                  </span>
                </div>
              </div>
            )}

            {currentIntent && (
              <div className="context-section">
                <div className="context-section-title">
                  <Sparkles size={12} style={{ display: 'inline', marginRight: 6 }} />
                  Agente IA
                </div>
                <div className="context-field">
                  <span className="context-field-label">Intent</span>
                  <span className="context-field-value" style={{ fontSize: 'var(--text-xs)' }}>{currentIntent}</span>
                </div>
                <div className="context-field">
                  <span className="context-field-label">Canal</span>
                  <span className="context-field-value">Chat</span>
                </div>
                <div className="context-field">
                  <span className="context-field-label">Motor</span>
                  <span className="context-field-value" style={{ fontSize: 10 }}>Rule-based v1</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Action Card Component
function ActionCard({ action, onSelect }: { action: AgentAction; onSelect: (a: AgentAction) => void }) {
  const iconMap: Record<string, React.ReactNode> = {
    reaccommodation: <Plane size={16} />,
    reschedule: <Clock size={16} />,
    credit: <CreditCard size={16} />,
    refund: <CreditCard size={16} />,
    voucher: <CreditCard size={16} />,
    'baggage-report': <Luggage size={16} />,
    escalation: <Phone size={16} />,
    info: <Shield size={16} />,
  };

  return (
    <div className="action-card" onClick={() => action.selectable && onSelect(action)} style={{ cursor: action.selectable ? 'pointer' : 'default' }}>
      <div className="action-card-header">
        <div className="action-card-icon">
          {iconMap[action.type] || <ChevronRight size={16} />}
        </div>
        <span className="action-card-title">{action.title}</span>
        {action.selectable && <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />}
      </div>
      <div className="action-card-body">{action.description}</div>
      {action.details && (
        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
          {Object.entries(action.details).map(([k, v]) => (
            <span key={k} style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {k}: <strong style={{ color: 'var(--text-primary)' }}>{v}</strong>
            </span>
          ))}
        </div>
      )}
      {action.selectable && (
        <button className="action-card-btn">Selecionar</button>
      )}
    </div>
  );
}
