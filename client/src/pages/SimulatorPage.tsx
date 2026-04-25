// ==========================================
// AirOps AI — Dual-View Simulator
// Left: Customer View (Mobile App)
// Right: SAC Operator Workspace
// ==========================================

import { useState, useRef, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, User, ChevronRight, Shield, ShieldCheck, ShieldAlert, Sparkles, PhoneCall, Disc, MessageCircle, Wifi, Battery, Signal, ArrowLeft } from 'lucide-react';
import Header from '../components/layout/Header';
import { useVoiceSession, type VoiceTranscript } from '../hooks/useVoiceSession';
import { useConversation } from '../hooks/useConversation';
import WaveformVisualizer from '../components/audio/WaveformVisualizer';

const formatMessage = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, lineIdx) => {
    // Basic bold markdown parser
    const boldParts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <Fragment key={lineIdx}>
        {boldParts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
        {lineIdx < text.split('\n').length - 1 && <br />}
      </Fragment>
    );
  });
};

export default function SimulatorPage() {
  const [inputText, setInputText] = useState('');
  const [channelMode, setChannelMode] = useState<'voice' | 'whatsapp'>('voice');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  // Assuming voice agent can do both voice and text for simulator
  const voiceSession = useVoiceSession();
  const textSession = useConversation();

  // Scroll to bottom when transcripts change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [voiceSession.transcripts, voiceSession.isAgentSpeaking, voiceSession.isUserSpeaking, textSession.messages]);

  const handleSendText = () => {
    if (!inputText.trim()) return;
    
    if (channelMode === 'whatsapp') {
      textSession.sendMessage(inputText);
      setInputText('');
    } else {
      if (voiceSession.state === 'connected' || voiceSession.state === 'speaking' || voiceSession.state === 'listening') {
        if (voiceSession.sendTextMessage) {
          voiceSession.sendTextMessage(inputText);
          setInputText('');
        }
      } else {
        textSession.sendMessage(inputText);
        setInputText('');
      }
    }
  };

  const formatSecs = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <>
      <Header title="Simulator: Dual-View" subtitle="Test the customer journey and SAC monitor in real-time" />
      <div className="dual-view-container" style={{ display: 'flex', height: 'calc(100vh - var(--header-height))', background: 'var(--bg-main)' }}>
        
        {/* ==================================
            LEFT PANE: CUSTOMER VIEW
            Mobile app mockup
        ================================== */}
        <div style={{ flex: '0 0 400px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0', borderRight: '1px solid var(--border-color)' }}>
          
          <div className="mobile-mockup" style={{ 
            width: 320, height: 650, background: channelMode === 'whatsapp' ? '#efeae2' : '#fff', borderRadius: 36, 
            boxShadow: '0 20px 40px rgba(0,0,0,0.1), inset 0 0 0 8px #0f172a',
            overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative'
          }}>
            {/* Mobile Header */}
            <div style={{ 
              padding: '12px 20px 16px', 
              background: channelMode === 'whatsapp' ? '#075e54' : 'rgba(16, 185, 129, 0.85)', 
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              display: 'flex', flexDirection: 'column',
              position: 'relative',
              zIndex: 10
            }}>
              {/* Status Bar & Notch */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: 12, fontWeight: 600 }}>
                <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <div style={{ width: 80, height: 24, background: '#000', borderRadius: 12, position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 8 }} />
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <Signal size={14} />
                  <Wifi size={14} />
                  <Battery size={16} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {channelMode !== 'whatsapp' && <ArrowLeft size={20} style={{ cursor: 'pointer' }} />}
                  <span style={{ fontWeight: 600, fontSize: 18 }}>{channelMode === 'whatsapp' ? 'WhatsApp' : 'Papagaio Fly'}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.8)' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.8)' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.8)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: channelMode === 'whatsapp' ? '#fff' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: channelMode === 'whatsapp' ? '#075e54' : '#fff', overflow: 'hidden' }}>
                  {channelMode === 'whatsapp' ? <Sparkles size={20} /> : <img src="/papagaio_logo.png" alt="Zulu Logo" style={{ width: 40, height: 40, objectFit: 'cover' }} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{channelMode === 'whatsapp' ? 'Papagaio Fly SAC' : 'Zulu - Assistente IA'}</h3>
                  <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>{channelMode === 'whatsapp' ? 'Conta comercial verificada' : 'Online'}</p>
                </div>
              </div>
            </div>

            {/* Mobile Chat View / Voice View */}
            <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, backgroundImage: channelMode === 'whatsapp' ? 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' : 'linear-gradient(to bottom, #f0fdf4, #ffffff)', backgroundSize: 'cover' }}>
              
              <AnimatePresence>
              {/* Transcripts */}
              {channelMode === 'whatsapp' ? textSession.messages.map((m, idx) => {
                const isAgent = m.role === 'agent';
                return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      key={m.id} style={{ 
                      alignSelf: isAgent ? 'flex-start' : 'flex-end',
                      backgroundColor: isAgent ? '#fff' : '#dcf8c6',
                      color: '#303030',
                      padding: '8px 12px', borderRadius: 8,
                      borderTopLeftRadius: isAgent ? 0 : 8,
                      borderTopRightRadius: !isAgent ? 0 : 8,
                      maxWidth: '85%', fontSize: 14, lineHeight: 1.4,
                      boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
                    }}>
                      {formatMessage(m.content)}
                      <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)', textAlign: 'right', marginTop: 4 }}>
                         {m.timestamp}
                      </div>
                    </motion.div>
                );
              }) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: 20 }}>
                  <div style={{ width: 140, height: 140, borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 12px 32px rgba(16, 185, 129, 0.4)' }}>
                     <img src="/papagaio_logo.png" style={{ width: 140, height: 140, objectFit: 'cover' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                     <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Zulu</h2>
                     <p style={{ fontSize: 16, color: 'var(--text-muted)', margin: 0 }}>
                       {voiceSession.state === 'connected' || voiceSession.state === 'speaking' || voiceSession.state === 'listening' 
                         ? formatSecs(voiceSession.callDuration) 
                         : voiceSession.state === 'connecting' ? 'Conectando...' : 'Assistente de Voz'}
                     </p>
                  </div>
                  
                  <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(voiceSession.state === 'connected' || voiceSession.state === 'speaking' || voiceSession.state === 'listening') && (
                      <WaveformVisualizer isActive={voiceSession.isAgentSpeaking || voiceSession.isUserSpeaking} color={voiceSession.isUserSpeaking ? "#3b82f6" : "#10b981"} height={40} bars={9} />
                    )}
                  </div>
                </div>
              )}
              </AnimatePresence>

              <div ref={chatBottomRef} />
            </div>

            {/* Mobile Footer / Voice Controls */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: channelMode === 'whatsapp' ? '#f0f2f5' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 10 }}>
              {/* Status indicator */}
              {voiceSession.state !== 'idle' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ 
                    width: 8, height: 8, borderRadius: '50%', 
                    backgroundColor: voiceSession.state === 'connected' || voiceSession.state === 'speaking' || voiceSession.state === 'listening' ? 'var(--success)' : 
                                    voiceSession.state === 'connecting' ? 'var(--warning)' : 'var(--error)' 
                  }} />
                  {voiceSession.state === 'connecting' ? 'Conectando...' : 
                   voiceSession.state === 'error' ? 'Erro de Conexão' : 
                   `Chamada ativa • ${formatSecs(voiceSession.callDuration)}`}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                {(voiceSession.state === 'idle' || voiceSession.state === 'ended' || voiceSession.state === 'error') ? (
                  <button 
                    onClick={voiceSession.startCall}
                    style={{ background: channelMode === 'whatsapp' ? '#25d366' : '#10b981', color: '#fff', border: 'none', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.4)', transition: 'all 0.2s', transform: 'scale(1)' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <PhoneCall size={24} />
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={voiceSession.toggleMute}
                      style={{ background: voiceSession.isMuted ? '#f1f5f9' : 'var(--bg-elevated)', color: voiceSession.isMuted ? 'var(--error)' : 'var(--text-primary)', border: `1px solid ${voiceSession.isMuted ? 'var(--error)' : '#e2e8f0'}`, borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      {voiceSession.isMuted ? <MicOff size={24} /> : <div style={{display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center'}}><WaveformVisualizer isActive={voiceSession.isUserSpeaking} height={20} color="#10b981" bars={5} /></div>}
                    </button>
                    <button 
                      onClick={voiceSession.endCall}
                      style={{ background: 'var(--error)', color: '#fff', border: 'none', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                    >
                      <PhoneCall size={24} style={{ transform: 'rotate(135deg)' }} />
                    </button>
                  </>
                )}
              </div>
              
              {/* Optional text input fallback */}
              <div style={{ display: 'flex', gap: 8, background: channelMode === 'whatsapp' ? '#fff' : '#f1f5f9', borderRadius: 20, padding: '4px 4px 4px 16px', marginTop: 12 }}>
                <input 
                  type="text" 
                  placeholder="Ou digite aqui..." 
                  value={inputText} 
                  onChange={e => setInputText(e.target.value)} 
                  onKeyDown={e => { if (e.key === 'Enter') handleSendText(); }}
                  style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, fontSize: 13 }} 
                />
                <button onClick={handleSendText} className="hover-scale" style={{ background: channelMode === 'whatsapp' ? '#075e54' : '#10b981', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}><Send size={14} /></button>
              </div>
            </div>
            
          </div>
          
        </div>

        {/* ==================================
            RIGHT PANE: SAC OPERATOR WORKSPACE
        ================================== */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)', overflow: 'hidden' }}>
          
          {/* Top Info Bar */}
          <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                Monitoramento Ativo
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: voiceSession.state === 'connected' ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)', color: voiceSession.state === 'connected' ? 'var(--success)' : 'var(--text-muted)' }}>
                  {voiceSession.state === 'connected' || voiceSession.state === 'listening' || voiceSession.state === 'speaking' ? '● Em Andamento' : 'Ocioso'}
                </span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Canal: Voz (OpenAI Realtime API) • Intent classification live</p>
            </div>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: 8, padding: 4, height: 36 }}>
                <button 
                  onClick={() => setChannelMode('voice')} 
                  style={{ background: channelMode === 'voice' ? 'var(--primary)' : 'transparent', color: channelMode === 'voice' ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 6, padding: '0 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Mic size={14} /> Papagaio App
                </button>
                <button 
                  onClick={() => setChannelMode('whatsapp')} 
                  style={{ background: channelMode === 'whatsapp' ? '#25d366' : 'transparent', color: channelMode === 'whatsapp' ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 6, padding: '0 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
               </div>
               <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                 <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>SLA Atendimento</div>
                 <div style={{ fontWeight: 600, color: 'var(--success)' }}>00:{formatSecs(voiceSession.callDuration)}</div>
               </div>
            </div>
          </div>

          {/* SAC Content */}
          <div style={{ flex: 1, display: 'flex', padding: 24, gap: 24, overflowY: 'auto' }}>
            
            {/* Live Context Card */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div className="card" style={{ padding: 20 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 12, marginBottom: 16 }}>
                    <ShieldCheck size={20} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: 16 }}>Security Pipeline Log (Terminal da IA)</h3>
                 </div>
                 
                 <div style={{ background: '#022c22', borderRadius: 8, padding: 16, fontFamily: 'monospace', color: '#6ee7b7', fontSize: 12, height: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div><span style={{ color: '#94a3b8' }}>[SYSTEM]</span> Inicializando conexão WebRTC...</div>
                    {(voiceSession.state === 'connecting' || voiceSession.state === 'connected') && (
                      <div><span style={{ color: '#22c55e' }}>[SUCCESS]</span> Ephemeral token gerado. WebRTC Connectado.</div>
                    )}
                    {voiceSession.error && (
                      <div style={{ color: '#ef4444' }}>[ERRO_CRITICO] {voiceSession.error}</div>
                    )}
                    
                    {(channelMode === 'whatsapp' ? textSession.messages : [...textSession.messages, ...voiceSession.transcripts]).map((t, i) => (
                      <div key={i} style={{ borderLeft: `2px solid ${t.role === 'user' ? '#f59e0b' : '#6ee7b7'}`, paddingLeft: 8 }}>
                        <div style={{ color: t.role === 'user' ? '#f59e0b' : '#6ee7b7', fontWeight: 600 }}>
                          [{t.role === 'user' ? 'UTTERANCE' : 'GENERATION'}]
                        </div>
                        <div style={{ color: '#e2e8f0' }}>{'text' in t ? t.text : t.content}</div>
                        {t.role === 'user' && (
                          <div style={{ color: '#22c55e', fontSize: 11, marginTop: 4 }}>► Pipeline L1 (PII Masking): Pass • L2 (Injection): Pass</div>
                        )}
                        {t.role === 'agent' && (
                          <div style={{ color: '#22c55e', fontSize: 11, marginTop: 4 }}>► Pipeline L3 (Guardrails): Seguido. Resposta segura.</div>
                        )}
                      </div>
                    ))}
                    
                    {voiceSession.isUserSpeaking && (
                       <div><span style={{ color: '#f59e0b' }}>[AUDIO]</span> Recebendo chunks (VAD ativado)...</div>
                    )}
                    {voiceSession.isAgentSpeaking && (
                       <div><span style={{ color: '#6ee7b7' }}>[INFERENCIA]</span> Modelo gerando áudio e enviando delta...</div>
                    )}
                 </div>
              </div>

               <div className="card" style={{ padding: 20 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 12, marginBottom: 16 }}>
                    <Sparkles size={20} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: 16 }}>Agente IA (Tools Chamadas)</h3>
                 </div>
                 
                 {voiceSession.toolEvents && voiceSession.toolEvents.length === 0 ? (
                   <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Nenhuma chamada de ferramenta registrada ainda.</p>
                 ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                     {voiceSession.toolEvents?.map((t) => (
                       <div key={t.id} style={{ padding: 12, background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderLeft: `3px solid ${t.status === 'success' ? 'var(--success)' : t.status === 'error' ? 'var(--error)' : 'var(--warning)'}`, borderRadius: 6 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>call: {t.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>args: {JSON.stringify(t.args)}</div>
                          {t.status === 'success' && <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4, fontFamily: 'monospace', maxHeight: 80, overflow: 'auto' }}>result: {t.result}</div>}
                          {t.status === 'error' && <div style={{ fontSize: 11, color: 'var(--error)', marginTop: 4, fontFamily: 'monospace' }}>error: {t.result}</div>}
                       </div>
                     ))}
                   </div>
                 )}
               </div>

            </div>

            {/* Entity Panel */}
            <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 14, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Identificação</h3>
                {voiceSession.state !== 'idle' ? (
                  <p style={{ fontSize: 13, margin: 0, color: 'var(--warning-dark)' }}>Aguardando passageiro informar PNR...</p>
                ) : (
                  <p style={{ fontSize: 13, margin: 0, color: 'var(--text-muted)' }}>Inicie a chamada para visualizar dados em tempo real.</p>
                )}
              </div>
              
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 14, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status Atendimento</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Score de Sentimento</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: voiceSession.sentiment.score >= 8 ? 'var(--error)' : voiceSession.sentiment.score >= 5 ? 'var(--warning-dark)' : 'var(--text-primary)' }}>
                      {voiceSession.sentiment.emotion} ({voiceSession.sentiment.score * 10}%)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Risco Churn</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: voiceSession.sentiment.churnRisk === 'Alto' ? 'var(--error)' : voiceSession.sentiment.churnRisk === 'Médio' ? 'var(--warning-dark)' : 'var(--success)' }}>
                      {voiceSession.sentiment.churnRisk}
                    </span>
                  </div>
                  <button style={{ marginTop: 8, padding: '8px 0', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <User size={14} /> Assumir Chamada (Intervenção)
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
