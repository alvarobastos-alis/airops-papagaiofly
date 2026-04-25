import express from 'express';
import { v4 as uuid } from 'uuid';

const router = express.Router();

// Função auxiliar para gerar datas no passado (para duração)
const getPastDate = (secondsAgo: number) => {
  return new Date(Date.now() - secondsAgo * 1000).toISOString();
};

let MOCK_ACTIVE_CALLS = [
  {
    id: uuid(),
    pnr: 'DEMO11',
    customerName: 'Roberto Gomes',
    status: 'ai_handling',
    startedAt: getPastDate(145), // 2m 25s
    satisfactionScore: 65,
    currentNode: 'Identificando cenário de Força Maior (Chuva)',
    channel: 'voice',
    agentId: 'Agente IA (Zulu)',
  },
  {
    id: uuid(),
    pnr: 'DEMO12',
    customerName: 'Camila Souza',
    status: 'human_handling',
    startedAt: getPastDate(610), // 10m 10s
    satisfactionScore: 35,
    currentNode: 'Atendimento Humanizado (Crise)',
    channel: 'voice',
    agentId: 'Operador Humano (Fernanda)',
  },
  {
    id: uuid(),
    pnr: 'DEMO15',
    customerName: 'Lucas Martins',
    status: 'waiting_human',
    startedAt: getPastDate(320), // 5m 20s
    satisfactionScore: 42,
    currentNode: 'Aguardando Transbordo (Greve)',
    channel: 'chat',
    agentId: 'Fila Nível 2',
  },
  {
    id: uuid(),
    pnr: 'DEMO17',
    customerName: 'Ricardo Alves',
    status: 'ai_handling',
    startedAt: getPastDate(45), // 45s
    satisfactionScore: 88,
    currentNode: 'Oferecendo FoodPass e Reacomodação',
    channel: 'chat',
    agentId: 'Agente IA (Zulu)',
  },
  {
    id: uuid(),
    pnr: 'DEMO19',
    customerName: 'Bruno Teixeira',
    status: 'waiting_human',
    startedAt: getPastDate(480), // 8m
    satisfactionScore: 12,
    currentNode: 'Passageiro Indisciplinado (Escalonamento VIP)',
    channel: 'voice',
    agentId: 'Fila Nível 3 (Segurança)',
  },
  {
    id: uuid(),
    pnr: 'DEMO23',
    customerName: 'Letícia Silva',
    status: 'human_handling',
    startedAt: getPastDate(1250), // ~20m
    satisfactionScore: 95,
    currentNode: 'MedAssist Acionado (Parto a Bordo)',
    channel: 'voice',
    agentId: 'Operador Especializado (Carlos)',
  }
];

// Opcional: Atualizar durações e flutuar satisfação pra parecer real
setInterval(() => {
  MOCK_ACTIVE_CALLS = MOCK_ACTIVE_CALLS.map(call => {
    // Flutuação aleatória da satisfação
    let score = call.satisfactionScore + (Math.floor(Math.random() * 5) - 2);
    score = Math.max(0, Math.min(100, score));
    return { ...call, satisfactionScore: score };
  });
}, 5000);

router.get('/live-queue', (req, res) => {
  const activeCount = MOCK_ACTIVE_CALLS.filter(c => c.status === 'ai_handling' || c.status === 'human_handling').length;
  const waitingCount = MOCK_ACTIVE_CALLS.filter(c => c.status === 'waiting_human').length;
  
  // Calcular TMA em segundos
  const totalSeconds = MOCK_ACTIVE_CALLS.reduce((acc, call) => {
    return acc + Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000);
  }, 0);
  const avgDuration = Math.floor(totalSeconds / MOCK_ACTIVE_CALLS.length);
  
  // Satisfação geral
  const avgSatisfaction = Math.floor(MOCK_ACTIVE_CALLS.reduce((acc, call) => acc + call.satisfactionScore, 0) / MOCK_ACTIVE_CALLS.length);

  res.json({
    metrics: {
      activeCalls: activeCount,
      waitingCalls: waitingCount,
      avgDurationSeconds: avgDuration,
      avgSatisfactionScore: avgSatisfaction
    },
    calls: MOCK_ACTIVE_CALLS
  });
});

export default router;
