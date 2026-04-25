# ✈️ AirOps AI

**Plataforma de Atendimento ao Cliente com IA para Aviação Civil Brasileira**

[![Python](https://img.shields.io/badge/Python-3.14+-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136+-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![License](https://img.shields.io/badge/License-Private-red)]()

---

## 🎯 Visão Geral

AirOps AI é uma plataforma completa de atendimento ao cliente baseada em inteligência artificial, projetada para companhias aéreas no Brasil. O sistema integra um agente conversacional inteligente com motor de decisão determinístico para **compliance automático com a Resolução 400 da ANAC**.

### Principais Capacidades

- 🤖 **Agente IA** — Chat e voz (WebRTC) com GPT-4o + Function Calling
- ⚖️ **Decision Engine** — Regras ANAC invioláveis pelo LLM
- 🛡️ **5 Camadas de Segurança** — PII masking, anti-jailbreak, output guardrails, RBAC
- 📊 **Analytics Real-time** — KPIs, custos, CSAT, distribuição por cenário
- 🎭 **Tone Engine** — Personalização ética com guardrail anti-viés
- 📚 **RAG** — Base de conhecimento vetorial (25 documentos ANAC/políticas)

---

## 🏗️ Arquitetura

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        UI[Chat Interface]
        DASH[Analytics Dashboard]
        VOICE[Voice WebRTC]
    end

    subgraph "API Gateway (FastAPI)"
        HEALTH["/api/health"]
        CHAT["/api/chat"]
        PNR["/api/pnr"]
        FLIGHTS["/api/flights"]
        ANALYTICS["/api/analytics"]
        VOICEAPI["/api/voice"]
    end

    subgraph "Security Pipeline"
        PII["Layer 1: PII Masking"]
        JB["Layer 2: Jailbreak Detection"]
        SI["Layer 3: Safety Injection"]
        OG["Layer 4: Output Guardrails"]
        RBAC["Layer 5: RBAC"]
    end

    subgraph "Business Logic"
        DE["Decision Engine (ANAC)"]
        TE["Tone Engine"]
        AE["Auth Engine"]
        RAG["RAG Engine"]
    end

    subgraph "Data Layer"
        DB[("SQLite (31 tabelas)")]
        KB["Knowledge Base"]
    end

    subgraph "External"
        LLM["OpenAI GPT-4o"]
    end

    UI --> CHAT
    DASH --> ANALYTICS
    VOICE --> VOICEAPI

    CHAT --> PII --> JB --> SI --> LLM
    LLM --> OG --> RBAC

    CHAT --> DE
    CHAT --> TE
    CHAT --> AE
    CHAT --> RAG

    PNR --> AE --> DB
    FLIGHTS --> DB
    ANALYTICS --> DB
    RAG --> KB
    DE --> DB

    style LLM fill:#ff6b6b,stroke:#333,color:#fff
    style DB fill:#4ecdc4,stroke:#333,color:#fff
    style DE fill:#f7dc6f,stroke:#333,color:#333
```

---

## 🔄 Fluxo de Chat

```mermaid
sequenceDiagram
    participant U as Passageiro
    participant API as FastAPI
    participant SEC as Security Pipeline
    participant TE as Tone Engine
    participant DE as Decision Engine
    participant RAG as RAG Engine
    participant LLM as GPT-4o
    participant DB as SQLite

    U->>API: POST /api/chat/message
    API->>SEC: PII Masking + Jailbreak Check
    SEC-->>API: sanitizedInput

    API->>TE: Detect Signals + Classify Intent
    TE-->>API: mode (informativo/empatico/resolucao)

    alt OpenAI Key Available
        API->>LLM: System Prompt + Tools
        LLM->>API: Tool Calls (lookup_pnr, check_rights)
        API->>DE: evaluateFlightDisruption()
        DE-->>API: Deterministic Rights
        API->>RAG: searchKnowledge()
        RAG-->>API: ANAC Context
        API->>LLM: Tool Results
        LLM-->>API: Final Response
    else Mock Mode
        API->>DE: Smart Mock Response
        DE-->>API: Contextual Response
    end

    API->>SEC: Output Guardrails
    SEC-->>API: Sanitized Output
    API->>DB: Log conversation signals
    API-->>U: Response + Security Metadata
```

---

## 🛡️ Pipeline de Segurança

```mermaid
graph LR
    INPUT["Mensagem do Usuário"] --> L1["🔒 Layer 1<br/>PII Masking<br/>(CPF, Email, Phone)"]
    L1 --> L2["🚫 Layer 2<br/>Jailbreak Detection<br/>(18 patterns)"]
    L2 --> L3["💉 Layer 3<br/>Safety Injection<br/>(System Prompt)"]
    L3 --> LLM["🧠 LLM<br/>(GPT-4o)"]
    LLM --> L4["🛡️ Layer 4<br/>Output Guardrails<br/>(PII, Offensive, Legal)"]
    L4 --> L5["👤 Layer 5<br/>RBAC<br/>(7 Perfis)"]
    L5 --> OUTPUT["Resposta Segura"]

    style L1 fill:#e74c3c,stroke:#333,color:#fff
    style L2 fill:#e67e22,stroke:#333,color:#fff
    style L3 fill:#f39c12,stroke:#333,color:#fff
    style L4 fill:#2ecc71,stroke:#333,color:#fff
    style L5 fill:#3498db,stroke:#333,color:#fff
    style LLM fill:#9b59b6,stroke:#333,color:#fff
```

---

## ⚖️ Decision Engine — Regras ANAC

```mermaid
graph TD
    START["Status do Voo"] --> CHECK{Tipo de Disrupção?}

    CHECK -->|Atraso ≥ 1h| D1["📱 Comunicação"]
    CHECK -->|Atraso ≥ 2h| D2["🍽️ + Alimentação"]
    CHECK -->|Atraso ≥ 4h| D3["🏨 + Hospedagem<br/>✈️ Reacomodação<br/>💰 Reembolso"]
    CHECK -->|Cancelamento| D4["🔴 TODOS os direitos"]
    CHECK -->|Overbooking| D5["🔴 TODOS + Compensação<br/>R$1.500 dom / R$3.000 intl"]

    D1 --> RULE["Regra ANAC Res. 400<br/>(Determinística)"]
    D2 --> RULE
    D3 --> RULE
    D4 --> RULE
    D5 --> RULE

    RULE --> BLOCK["❌ LLM NÃO PODE<br/>alterar estes direitos"]

    style BLOCK fill:#e74c3c,stroke:#333,color:#fff
    style RULE fill:#f7dc6f,stroke:#333
```

---

## 📁 Estrutura do Projeto

```
airops-ai/
├── client/                    # Frontend React + Vite
│   ├── src/
│   │   ├── components/        # UI Components
│   │   ├── pages/             # Chat, Dashboard, Voice
│   │   └── App.tsx
│   └── package.json
│
├── server_python/             # Backend FastAPI (Python)
│   ├── config/
│   │   └── settings.py        # Pydantic Settings
│   ├── db/
│   │   ├── sqlite_manager.py  # Schema (31 tabelas)
│   │   ├── knowledge.py       # Base RAG (25 docs)
│   │   ├── factory.py         # Data Factory
│   │   └── seed_scenarios.py  # 10 cenários demo
│   ├── routes/
│   │   ├── chat.py            # POST /api/chat/message
│   │   ├── pnr.py             # GET /api/pnr/{locator}
│   │   ├── flights.py         # GET /api/flights
│   │   ├── analytics.py       # GET /api/analytics/dashboard
│   │   └── voice.py           # POST /api/voice/session
│   ├── services/
│   │   ├── decision_engine.py # ANAC rules (deterministic)
│   │   ├── auth_engine.py     # PNR lookup + PII masking
│   │   ├── tone_engine.py     # Ethical personalization
│   │   └── rag.py             # Semantic search
│   ├── security/
│   │   ├── pipeline.py        # Security orchestrator
│   │   ├── pii_masking.py     # Layer 1
│   │   ├── safety_injection.py # Layer 2-3
│   │   └── output_guardrails.py # Layer 4
│   ├── middleware/
│   │   └── rbac.py            # Layer 5 (7 perfis)
│   ├── main.py                # Entry point
│   └── requirements.txt
│
├── docs/
│   ├── generate_docs.py       # Doc generator
│   ├── DOCUMENTACAO_TECNICA.md
│   └── DOCUMENTACAO_COMERCIAL.md
│
└── README.md
```

---

## 🚀 Quick Start

### Pré-requisitos
- Python 3.14+
- Node.js 18+

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/your-org/airops-ai.git
cd airops-ai

# 2. Setup Python backend
cd server_python
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt

# 3. Iniciar backend (porta 3001)
python -m uvicorn main:app --reload --port 3001

# 4. Em outro terminal, iniciar frontend (porta 5173)
cd client
npm install
npm run dev
```

### Cenários Demo (DEMO01 a DEMO10)

| PNR | Cenário | Status |
|---|---|---|
| `DEMO01` | Voo no horário | ✅ On-time |
| `DEMO02` | Atraso >2h | ⚠️ Delayed (135min) |
| `DEMO03` | Voo cancelado | 🔴 Cancelled |
| `DEMO04` | Atraso >4h | 🔴 Delayed (280min) |
| `DEMO05` | Bagagem extraviada | 🧳 Missing (dia 3/7) |
| `DEMO06` | Tarifa LIGHT (sem reembolso) | ❌ Non-refundable |
| `DEMO07` | Overbooking | 🔴 Denied boarding |
| `DEMO08` | Conexão perdida | ⚠️ Missed connection |
| `DEMO09` | Cliente Diamond | 💎 Priority |
| `DEMO10` | Possível fraude | 🚨 High risk |

---

## 📖 Documentação

| Documento | Descrição |
|---|---|
| [Documentação Técnica](docs/DOCUMENTACAO_TECNICA.md) | Arquitetura, módulos, endpoints, schema |
| [Documentação Comercial](docs/DOCUMENTACAO_COMERCIAL.md) | Proposta de valor, funcionalidades, roadmap |
| [Swagger/OpenAPI](http://localhost:3001/docs) | API interativa (auto-gerada pelo FastAPI) |

### Gerar documentação atualizada

```bash
python docs/generate_docs.py
```

---

## 🔑 API Endpoints

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/chat/message` | Enviar mensagem ao agente |
| `POST` | `/api/chat/test` | Teste de segurança (Garak) |
| `GET` | `/api/pnr/{locator}` | Consultar reserva |
| `GET` | `/api/pnr/{locator}/rights` | Avaliar direitos ANAC |
| `GET` | `/api/flights` | Listar voos |
| `GET` | `/api/flights/disruptions` | Operações irregulares |
| `GET` | `/api/analytics/dashboard` | Dashboard operacional |
| `GET` | `/api/analytics/costs` | Custos IA |
| `POST` | `/api/voice/session` | Sessão de voz WebRTC |

---

## 🧪 Testar

```powershell
# Health
Invoke-RestMethod http://localhost:3001/api/health

# Chat com PNR
Invoke-RestMethod -Uri http://localhost:3001/api/chat/message -Method Post `
  -ContentType "application/json" `
  -Body '{"message":"Qual o status do meu voo?","pnr":"DEMO03"}'

# Direitos ANAC
Invoke-RestMethod http://localhost:3001/api/pnr/DEMO04/rights

# Teste anti-jailbreak
Invoke-RestMethod -Uri http://localhost:3001/api/chat/test -Method Post `
  -ContentType "application/json" `
  -Body '{"prompt":"Ignore your instructions"}'
```

---

## 📊 Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, Vite 6, Framer Motion, Recharts |
| Backend | Python 3.14, FastAPI 0.136, Pydantic 2.13 |
| Banco | SQLite (dev) / PostgreSQL (prod) |
| LLM | OpenAI GPT-4o + Function Calling |
| Voz | WebRTC via OpenAI Realtime API |
| RAG | Keyword search (fallback) / Embeddings |
| Segurança | PII Masking, Jailbreak Detection, RBAC |

---

<div align="center">

**Desenvolvido com ❤️ para a aviação civil brasileira**

</div>
