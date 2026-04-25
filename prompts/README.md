# Papagaio Fly — Prompt Management System

## Estrutura

```
prompts/
├── system/                # System prompts (identidade e comportamento dos agentes)
│   ├── sac-agent-v1.md            # Agente SAC principal (texto)
│   ├── sac-agent-voice-v1.md      # Agente SAC variante voz
│   ├── voice_front_agent.md       # Voice Front Agent (pipeline STT→TTS)
│   ├── sac_orchestrator.md        # Orquestrador central (roteamento)
│   ├── rag_policy.md              # Agente RAG (normas e regulações)
│   └── image_style.md             # Guia de estilo visual da marca
├── scenarios/             # Prompts por cenário de atendimento
│   ├── flight-status.md           # Status de voo
│   ├── delay-management.md        # Gestão de atrasos
│   ├── cancellation.md            # Cancelamento (IROP e voluntário)
│   ├── baggage-resolution.md      # Bagagem (atrasada, danificada, perdida)
│   └── denied-boarding.md         # Preterição / overbooking
├── guardrails/            # Safety & compliance prompts
│   ├── safety-preamble.md         # Preamble de segurança (SEMPRE injetado primeiro)
│   └── anac-compliance.md         # Regras ANAC (Resolução 400 etc.)
└── testing/               # Prompts para testes de qualidade
    ├── adversarial/               # Testes de segurança e injeção
    │   └── prompt-injection.md
    └── functional/                # Testes de fluxo funcional
        └── happy-path.md
```

## Convenções

### Identidade da Marca
- Companhia aérea: **Papagaio Fly**
- Assistente IA: **Zulu**
- Tom: simpática, acolhedora, eficiente
- Idioma padrão: Português Brasileiro (pt-BR)

### Versionamento
- Cada prompt tem versão no nome: `sac-agent-v1.md`, `sac-agent-v2.md`
- A versão ativa é configurada no backend via `ACTIVE_PROMPT_VERSION`
- Versões antigas nunca são deletadas — servem como audit trail

### Formato
- Todos os prompts são `.md` para facilitar revisão em PRs
- Variáveis usam `{{VARIABLE_NAME}}` — substituídas em runtime
- Seções com `<!-- REQUIRED -->` são obrigatórias em todo prompt

### Safety Preamble
O arquivo `guardrails/safety-preamble.md` é **SEMPRE** injetado antes de qualquer prompt.
Nenhum prompt pode ser enviado ao LLM sem o safety preamble.

### Hierarquia de Injeção
```
[safety-preamble.md]      ← sempre primeiro (inviolável)
[system/{agent}.md]       ← identidade do agente
[guardrails/anac.md]      ← regras regulatórias (se IROP/direitos)
[scenarios/{scenario}.md] ← contexto do cenário (se aplicável)
[user message]            ← mensagem do cliente
```

### Review Process
1. Todo prompt novo passa por code review
2. Prompts com regras ANAC precisam de validação jurídica
3. Testes adversariais rodam automaticamente contra prompts novos
4. Testes de happy-path validam fluxos operacionais

### Métricas de Qualidade
- Taxa de escalação para humano < 15%
- Confiança mínima do RAG para resposta autônoma: 0.78
- Tempo máximo de resposta de texto: 5s
- Tempo máximo de turno de voz: 30s
