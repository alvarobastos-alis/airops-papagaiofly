# AirOps AI — Documentação Comercial

> Plataforma de Atendimento ao Cliente com IA para Aviação Civil

---

## Proposta de Valor

AirOps AI é uma plataforma completa de atendimento ao cliente baseada em inteligência artificial, projetada especificamente para o setor de aviação civil brasileira.

### Problemas que Resolve

1. **Alto volume de atendimento** — Automatiza 80%+ das interações de suporte
2. **Compliance regulatório** — Garante conformidade automática com política de direitos do passageiro
3. **Custo operacional** — Reduz custo por atendimento em até 70%
4. **Experiência do cliente** — CSAT consistente acima de 4.0/5.0
5. **Viés e discriminação** — Sistema anti-viés obrigatório em todas as interações

---

## Funcionalidades Principais

### 🤖 Agente IA Inteligente
- Atendimento 24/7 por chat, voz (WebRTC) e WhatsApp
- Busca semântica (RAG) na base de conhecimento regulatória
- Motor de decisão determinístico baseado na política da Papagaio Fly
- Classificação automática de intenção e sentimento

### 🛡️ Segurança em 5 Camadas
- **PII Masking**: CPF, email, telefone, cartão de crédito nunca chegam ao LLM
- **Anti-Jailbreak**: Detecção de tentativas de manipulação
- **Safety Injection**: Prompt de segurança inviolável
- **Output Guardrails**: Filtro de conteúdo ofensivo, jurídico e alucinações
- **RBAC**: 7 perfis de acesso com limites por ação

### ⚖️ Compliance Automático (Política Papagaio Fly)
- Cálculo automático de direitos por atraso, cancelamento e overbooking
- Avaliação de elegibilidade de reembolso por tarifa
- Rastreamento de bagagem com prazos da política
- Vouchers de assistência material automáticos

### 📊 Analytics Operacional
- Dashboard em tempo real com KPIs
- Taxa de automação, CSAT, latência, custos
- Distribuição por cenário e canal
- Métricas financeiras (reembolsos evitados, custo de vouchers)

### 🎭 Personalização Ética
- Adaptação de tom por contexto (informativo, empático, resolução, segurança)
- **Guardrail Anti-Viés**: Direitos nunca mudam por perfil demográfico
- Detecção de sinais conversacionais (confusão, frustração, urgência)

---

## Métricas de Referência

| KPI | Valor |
|---|---|
| Taxa de Automação | ~80% |
| CSAT Médio | 3.8/5.0 |
| Latência Média | ~1.5s por turno |
| Cenários Suportados | 10 (status, atraso, cancelamento, bagagem, reembolso, etc.) |
| Base de Conhecimento | 25 documentos (políticas internas + normas) |
| Dados Demo | 200 voos, 1000 PNRs, 5000 casos |

---

## Arquitetura

- **Backend**: Python 3.14+ / FastAPI (async)
- **Banco**: SQLite (31 tabelas, escalável para PostgreSQL)
- **Frontend**: React + Vite
- **LLM**: GPT-4o com Function Calling
- **Voz**: WebRTC via OpenAI Realtime API
- **RAG**: Base vetorial com fallback keyword

---

## Modelo de Implantação

### SaaS (Multi-tenant)
- Deploy em cloud (AWS/GCP/Azure)
- Isolamento por tenant via RBAC
- Escalabilidade horizontal

### On-Premise
- Container Docker
- Banco PostgreSQL dedicado
- Conformidade com LGPD local

---

## Roadmap

1. ✅ Agente de chat com Decision Engine
2. ✅ 5 camadas de segurança
3. ✅ Analytics operacional
4. ✅ Personalização ética (Tone Engine)
5. 🔜 Voz WebRTC em produção
6. 🔜 Integração com PSS real (Amadeus/Sabre)
7. 🔜 Multi-idioma (EN, ES)
8. 🔜 Módulo de treinamento e QA

---

*Gerado automaticamente em 25/04/2026 18:58 por `docs/generate_docs.py`*
