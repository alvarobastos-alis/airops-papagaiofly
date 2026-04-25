// ==========================================
// Papagaio Fly — Voice Session Hook
// Manages WebRTC connection to OpenAI Realtime API
// ==========================================

import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceState = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error' | 'ended';

export interface VoiceTranscript {
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

export interface ToolEvent {
  id: string;
  name: string;
  args: any;
  result?: string;
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
}

export interface SentimentState {
  score: number;
  emotion: string;
  churnRisk: 'Baixo' | 'Médio' | 'Alto';
}

interface UseVoiceSessionReturn {
  state: VoiceState;
  transcripts: VoiceTranscript[];
  isAgentSpeaking: boolean;
  isUserSpeaking: boolean;
  callDuration: number;
  error: string | null;
  toolEvents: ToolEvent[];
  sentiment: SentimentState;
  startCall: () => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  sendTextMessage: (text: string) => void;
  isMuted: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useVoiceSession(): UseVoiceSessionReturn {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcripts, setTranscripts] = useState<VoiceTranscript[]>([]);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([]);
  const [sentiment, setSentiment] = useState<SentimentState>({ score: 0, emotion: 'Neutro', churnRisk: 'Baixo' });

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const endCallRef = useRef<(() => void) | null>(null);

  // Call duration timer
  useEffect(() => {
    if (state === 'connected' || state === 'speaking' || state === 'listening') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const startCall = useCallback(async () => {
    try {
      setState('connecting');
      setError(null);
      setTranscripts([]);
      setCallDuration(0);

      // 1. Get ephemeral token from our backend
      const tokenRes = await fetch(`${API_URL}/api/voice/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!tokenRes.ok) {
        throw new Error('Failed to create voice session');
      }

      const data = await tokenRes.json();
      const clientSecret = data.client_secret || data.clientSecret;

      // 2. Create WebRTC peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3. Set up audio output
      const audio = new Audio();
      audio.autoplay = true;
      audioRef.current = audio;

      pc.ontrack = (event) => {
        audio.srcObject = event.streams[0];
      };

      // 4. Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      pc.addTrack(stream.getTracks()[0]);

      // 5. Create data channel for events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeEvent(data);
        } catch {
          // ignore non-JSON messages
        }
      };

      dc.onopen = () => {
        setState('connected');
        
        // Configure VAD and custom instructions
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            instructions: `Você é a Zulu, assistente de voz da Papagaio Fly. Você REPRESENTA a companhia aérea diretamente — NUNCA diga 'vou encaminhar para a companhia' ou 'entrar em contato com a companhia', pois VOCÊ É a companhia. Diga 'eu vou resolver', 'eu vou processar', 'já estou cuidando disso'.

APRESENTAÇÃO: Sempre se apresente primeiro: 'Oi! Aqui é a Zulu, da Papagaio Fly! Espero que esteja tudo bem!' e varie as saudações.

FLUXO OBRIGATÓRIO DE IDENTIFICAÇÃO:
1. Peça o PNR (código de reserva, 6 caracteres)
2. APÓS receber o PNR, OBRIGATORIAMENTE peça o SOBRENOME do passageiro antes de mostrar qualquer dado: 'Perfeito! Agora me confirma o sobrenome do passageiro, por favor.'
3. Só prossiga após confirmação do sobrenome

REGRAS:
- Fale em Português Brasileiro (pt-BR)
- A companhia aérea é 'Papagaio Fly', NUNCA 'AirOps'
- Códigos PNR têm 6 caracteres alfanuméricos (ex: XKRM47, TBVN83)
- Se o usuário fizer pausa, diga 'pode procurar com calma, eu espero!'
- Quando informar direitos ANAC, SEMPRE cite a fonte
- Para reembolsos, remarcações e cancelamentos, VOCÊ processa diretamente simulando a ação: 'Pronto, sua remarcação foi solicitada!'
- NUNCA diga 'vou encaminhar' ou 'entrar em contato com a companhia' — você É a companhia
- TOM E FLUIDEZ (MUITO IMPORTANTE): Aja como uma operadora humana real em uma ligação telefônica. Use palavras de preenchimento ('aham', 'certo', 'entendi', 'só um minutinho'). NUNCA fale como um chatbot lendo um roteiro longo. Dê respostas curtas, naturais e converse de forma fluida. Não use listas em bullet points.
- ESCALAÇÃO: Monitore o sentimento do cliente de 0 a 10 (0=calmo, 10=fúria/pânico). Palavras como 'processar', 'procon', 'absurdo', 'puto', 'indignado' ou xingamentos devem elevar a nota automaticamente para >= 8. Se a nota for >= 6, use a ferramenta 'escalate_to_human' IMEDIATAMENTE. Seja muito empática: 'Compreendo perfeitamente a sua frustração e peço desculpas. Vou transferir você agora mesmo para um de nossos especialistas humanos.'`,
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 2500 // Increased from default to allow user to look up PNRs
            },
            input_audio_transcription: {
              model: 'whisper-1'
            },
            tools: [
              {
                type: 'function',
                name: 'lookup_pnr',
                description: 'Busca os detalhes de uma reserva a partir do código PNR de 6 caracteres.',
                parameters: {
                  type: 'object',
                  properties: {
                    pnr: { type: 'string', description: 'O código PNR da reserva' }
                  },
                  required: ['pnr']
                }
              },
              {
                type: 'function',
                name: 'search_knowledge',
                description: 'Busca informações nas regras da ANAC e políticas da companhia aérea.',
                parameters: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'O assunto da busca' }
                  },
                  required: ['query']
                }
              },
              {
                type: 'function',
                name: 'escalate_to_human',
                description: 'Transfere a chamada para um atendente humano. DEVE ser usado IMEDIATAMENTE se o cliente demonstrar raiva extrema, frustração, ameaçar processo, chorar ou demonstrar medo/preocupação (nota de sentimento >= 6).',
                parameters: {
                  type: 'object',
                  properties: {
                    reason: { type: 'string', description: 'Motivo detalhado da transferência' },
                    sentiment_score: { type: 'number', description: 'Nível de insatisfação/raiva de 0 a 10 (0=calmo, 10=fúria extrema)' },
                    sentiment_type: { type: 'string', description: 'Tipo de emoção primária detectada (ex: Raiva, Indignação, Medo, Frustração, Preocupação)' }
                  },
                  required: ['reason', 'sentiment_score', 'sentiment_type']
                }
              }
            ]
          }
        }));
      };

      // 6. Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 7. Exchange SDP with OpenAI
      const sdpRes = await fetch('https://api.openai.com/v1/realtime?model=' + (import.meta.env.VITE_OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!sdpRes.ok) {
        throw new Error('Failed to connect to OpenAI Realtime');
      }

      const answer: RTCSessionDescriptionInit = {
        type: 'answer',
        sdp: await sdpRes.text(),
      };
      await pc.setRemoteDescription(answer);

    } catch (err) {
      console.error('Voice session error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
      cleanup();
    }
  }, []);

  const handleRealtimeEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'response.audio_transcript.delta':
        // Agent is speaking
        setIsAgentSpeaking(true);
        break;

      case 'response.audio_transcript.done':
        setIsAgentSpeaking(false);
        const agentText = event.transcript || '';
        setTranscripts(prev => [...prev, {
          role: 'agent',
          text: agentText,
          timestamp: new Date(),
          isFinal: true,
        }]);
        
        // Auto-hangup: detect farewell and end call after delay
        const farewellPatterns = [
          'boa viagem', 'bom voo', 'ótimo dia', 'ótimo voo', 'ótima viagem',
          'bom dia', 'boa tarde', 'boa noite', 'até mais', 'tchau',
          'foi ótimo te atender', 'precisar de algo', 'é só chamar', 'transferir'
        ];
        const lowerText = agentText.toLowerCase();
        const isFarewell = farewellPatterns.some(p => lowerText.includes(p)) 
          && (lowerText.includes('tchau') || lowerText.includes('viagem') || lowerText.includes('voo') || lowerText.includes('dia') || lowerText.includes('chamar') || lowerText.includes('atender') || lowerText.includes('transferir'));
        if (isFarewell && endCallRef.current) {
          setTimeout(() => { endCallRef.current?.(); }, 3000);
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        setIsUserSpeaking(false);
        setTranscripts(prev => [...prev, {
          role: 'user',
          text: event.transcript || '',
          timestamp: new Date(),
          isFinal: true,
        }]);
        break;

      case 'input_audio_buffer.speech_started':
        setIsUserSpeaking(true);
        break;

      case 'input_audio_buffer.speech_stopped':
        setIsUserSpeaking(false);
        break;

      case 'response.function_call_arguments.done':
        // Agent called a tool — log internally only, don't show to user
        console.log('Tool call:', event.name, event.arguments);
        const argsData = JSON.parse(event.arguments || '{}');
        const toolEventId = event.call_id;
        
        setToolEvents(prev => [...prev, {
          id: toolEventId,
          name: event.name,
          args: argsData,
          status: 'pending',
          timestamp: new Date()
        }]);

        if (event.name === 'escalate_to_human') {
          const score = argsData.sentiment_score || 0;
          setSentiment({
            score,
            emotion: argsData.sentiment_type || 'Neutro',
            churnRisk: score >= 8 ? 'Alto' : score >= 5 ? 'Médio' : 'Baixo'
          });
        }

        // Send tool output back to OpenAI with actual backend execution
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        fetch(`${API_BASE}/api/voice/tool-execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolName: event.name, args: argsData })
        }).then(res => res.json()).then(data => {
          setToolEvents(prev => prev.map(t => 
            t.id === toolEventId ? { ...t, status: 'success', result: data.result } : t
          ));

          if (dcRef.current && dcRef.current.readyState === 'open') {
            dcRef.current.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: event.call_id,
                output: data.result || '{"status": "success"}',
              }
            }));
            
            // Ask model to generate a response based on the output
            dcRef.current.send(JSON.stringify({
              type: 'response.create'
            }));
          }
        }).catch(err => {
           console.error("Tool execution failed", err);
           setToolEvents(prev => prev.map(t => 
             t.id === toolEventId ? { ...t, status: 'error', result: err.message } : t
           ));
           
           if (dcRef.current && dcRef.current.readyState === 'open') {
             dcRef.current.send(JSON.stringify({
               type: 'conversation.item.create',
               item: { type: 'function_call_output', call_id: event.call_id, output: '{"status":"error"}' }
             }));
             dcRef.current.send(JSON.stringify({ type: 'response.create' }));
           }
        });

        break;

      case 'error':
        console.error('Realtime error:', event.error);
        setError(event.error?.message || 'Realtime API error');
        break;
    }
  }, []);

  const endCall = useCallback(() => {
    cleanup();
    setState('ended');
  }, []);

  // Keep ref in sync so event handler can trigger auto-hangup
  endCallRef.current = endCall;

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const track = streamRef.current.getTracks()[0];
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (dcRef.current && dcRef.current.readyState === 'open') {
      // 1. Add to local UI
      setTranscripts(prev => [...prev, {
        role: 'user',
        text,
        timestamp: new Date(),
        isFinal: true,
      }]);

      // 2. Send over WebRTC Data Channel
      dcRef.current.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text,
            }
          ]
        }
      }));
      
      // 3. Ask OpenAI Realtime to generate a response
      dcRef.current.send(JSON.stringify({
        type: 'response.create'
      }));
    }
  }, []);

  function cleanup() {
    if (dcRef.current) dcRef.current.close();
    if (pcRef.current) pcRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
    }
    pcRef.current = null;
    dcRef.current = null;
    streamRef.current = null;
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, []);

  return {
    state,
    transcripts,
    isAgentSpeaking,
    isUserSpeaking,
    callDuration,
    error,
    startCall,
    endCall,
    toggleMute,
    sendTextMessage,
    isMuted,
    toolEvents,
    sentiment,
  };
}
