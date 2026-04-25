# AirOps AI — Documentação Técnica

> Gerado automaticamente em 25/04/2026 18:58

---

## 1. Visão Geral

| Métrica | Valor |
|---|---|
| Framework | FastAPI (Python 3.14+) |
| Banco de Dados | SQLite (31 tabelas) |
| Total de Módulos | 63 |
| Total de Linhas | 7,152 |
| Total de Funções | 144 |
| Total de Classes | 9 |
| Endpoints API | 13 |
| Security Layers | 5 (PII, Jailbreak, Safety, Guardrails, RBAC) |

---

## 2. Estrutura de Diretórios

```
server_python/
    ├── __init__.py  (4 linhas)
    ├── image_brand_agent.py  (84 linhas)
    ├── rag_policy_agent.py  (125 linhas)
    ├── sac_orchestrator.py  (291 linhas)
    ├── voice_front_agent.py  (100 linhas)
    ├── __init__.py  (2 linhas)
    ├── config_loader.py  (148 linhas)
    ├── settings.py  (66 linhas)
    ├── __init__.py  (2 linhas)
    ├── factory.py  (227 linhas)
    ├── knowledge.py  (32 linhas)
    ├── seed_scenarios.py  (94 linhas)
    ├── sqlite_manager.py  (605 linhas)
  ├── main.py  (131 linhas)
    ├── __init__.py  (2 linhas)
    ├── rbac.py  (52 linhas)
    ├── __init__.py  (2 linhas)
    ├── __init__.py  (2 linhas)
      ├── __init__.py  (2 linhas)
      ├── _verify_qdrant.py  (20 linhas)
      ├── chunker.py  (225 linhas)
      ├── create_all_samples.py  (479 linhas)
      ├── create_samples.py  (222 linhas)
      ├── eval_runner.py  (85 linhas)
      ├── eval_set.py  (132 linhas)
      ├── extractor.py  (223 linhas)
      ├── indexer.py  (257 linhas)
      ├── normalizer.py  (195 linhas)
      ├── test_pipeline.py  (166 linhas)
    ├── __init__.py  (2 linhas)
    ├── analytics.py  (101 linhas)
    ├── chat.py  (279 linhas)
    ├── decision_tree.py  (22 linhas)
    ├── flights.py  (47 linhas)
    ├── pnr.py  (52 linhas)
    ├── rag.py  (106 linhas)
    ├── sac.py  (121 linhas)
    ├── voice.py  (81 linhas)
    ├── voice_ws.py  (73 linhas)
    ├── generate_decision_tree.py  (229 linhas)
    ├── __init__.py  (2 linhas)
    ├── output_guardrails.py  (87 linhas)
    ├── pii_masking.py  (51 linhas)
    ├── pipeline.py  (51 linhas)
    ├── safety_injection.py  (84 linhas)
    ├── __init__.py  (2 linhas)
    ├── auth_engine.py  (136 linhas)
    ├── conflict_resolver.py  (75 linhas)
    ├── decision_engine.py  (164 linhas)
    ├── groundedness.py  (164 linhas)
    ├── i18n.py  (56 linhas)
    ├── openai_client.py  (24 linhas)
    ├── query_rewriter.py  (100 linhas)
    ├── rag.py  (107 linhas)
    ├── rag_pipeline.py  (299 linhas)
    ├── retriever.py  (213 linhas)
    ├── session_manager.py  (56 linhas)
    ├── tone_engine.py  (148 linhas)
    ├── __init__.py  (4 linhas)
    ├── flight_tools.py  (30 linhas)
    ├── handoff_tools.py  (88 linhas)
    ├── refund_tools.py  (62 linhas)
    ├── reservation_tools.py  (61 linhas)
```

---

## 3. Módulos Detalhados

### `agents/image_brand_agent.py`

> ========================================== AirOps AI — Image Brand Agent Visual asset generation with brand identity ==========================================

**Funções:**

- `generate_brand_image()` (L25) — Generate a brand-consistent image.

---

### `agents/rag_policy_agent.py`

> ========================================== AirOps AI — RAG Policy Agent Specialist in regulations and passenger rights NEVER generates without source documents ==========================================

**Funções:**

- `answer_policy_question()` (L28) — Full RAG pipeline for regulatory/policy questions.

---

### `agents/sac_orchestrator.py`

> ========================================== AirOps AI — SAC Orchestrator Agent Central router: decides direct response, RAG, or escalation ==========================================

**Funções:**

- `orchestrate()` (L111) — Main orchestrator entry point.

---

### `agents/voice_front_agent.py`

> ========================================== AirOps AI — Voice Front Agent Server-side pipeline: STT → RAG → TTS ==========================================

**Funções:**

- `process_voice_turn()` (L24) — Process a single voice turn: STT → Orchestrate → TTS.
- `handle_barge_in()` (L94) — Handle barge-in (user interruption during TTS playback).

---

### `config/config_loader.py`

> ========================================== AirOps AI — YAML Configuration Loader Loads all YAML configs at startup, validates with Pydantic ==========================================

**Funções:**

- `load_models_config()` (L24) — Load model definitions from models.yaml.
- `load_agents_config()` (L31) — Load agent definitions from agents.yaml.
- `load_guardrails_config()` (L38) — Load guardrail rules from guardrails.yaml.
- `load_voice_config()` (L45) — Load voice pipeline config from voice.yaml.
- `load_image_config()` (L52) — Load image generation config from image.yaml.
- `get_model_config()` (L58) — Get a specific model config by its reference name.
- `get_agent_config()` (L66) — Get a specific agent config by its name.
- `get_agent_model_config()` (L74) — Get the resolved model config for a specific agent.
- `get_guardrail_config()` (L83) — Get a specific guardrail config by its name.
- `get_agent_guardrails()` (L91) — Get all resolved guardrail configs for a specific agent.
- `get_agent_prompt_path()` (L101) — Get the absolute path to an agent's prompt file.
- `load_agent_prompt()` (L115) — Load and return the prompt text for a specific agent.
- `reload_all()` (L121) — Clear all caches and force reload of all configs.
- `validate_all()` (L130) — Validate all config files can be loaded without errors.

---

### `config/settings.py`

> ========================================== AirOps AI — Environment Configuration Validates all required env vars at startup ==========================================

**Classes:**

- `Settings` (L10)
- `Config` (L51)

**Funções:**

- `has_openai_key()` (L56) — Check if a real OpenAI API key is configured.

---

### `db/factory.py`

> ========================================== AirOps AI — Rich Data Factory Generates coherent synthetic airline data for 30+ tables based on scenarios ==========================================

**Funções:**

- `pick()` (L61)
- `rand_int()` (L62)
- `weighted_status()` (L64)
- `run_data_factory()` (L72)

---

### `db/knowledge.py`

> ========================================== AirOps AI — RAG Knowledge Base (25 documents) ==========================================

---

### `db/seed_scenarios.py`

> ========================================== AirOps AI — Demo Scenario Seeder Creates 10 known PNRs for testing/demo ==========================================

**Funções:**

- `seed_demo_scenarios()` (L24)

---

### `db/sqlite_manager.py`

> ========================================== AirOps AI — SQLite Database Manager Schema: 37 tables for airline operations ==========================================

**Funções:**

- `get_db()` (L17)
- `run_migrations()` (L591)
- `reset_db()` (L597)

---

### `main.py`

> ========================================== AirOps AI — FastAPI Server Entry Point ==========================================

**Funções:**

- `lifespan()` (L42) — Startup: seed data + compile RAG.
- `health()` (L106)

---

### `middleware/rbac.py`

> ========================================== AirOps AI — RBAC Middleware (7 profiles) ==========================================

**Classes:**

- `Role` (L9)

**Funções:**

- `has_permission()` (L41)
- `is_role_at_least()` (L45)
- `get_refund_limit()` (L49)

---

### `rag_aviacao/scripts/_verify_qdrant.py`

---

### `rag_aviacao/scripts/chunker.py`

> ========================================== AirOps AI — Intelligent Chunker Splits documents respecting legal boundaries ==========================================  Usage: python -m rag_aviacao.scripts.chunker  Input:  05_processados/normalized/*.json Output: 05_processados/chunks/*.json

**Funções:**

- `load_manifest()` (L32) — Load manifest indexed by document_id.
- `generate_chunk_id()` (L39) — Generate a deterministic chunk ID.
- `split_by_articles()` (L45) — Split legal text by articles (Art. N).
- `split_generic()` (L70) — Split non-legal text using recursive character splitter.
- `chunk_document()` (L100) — Chunk a single normalized document.
- `save_chunks()` (L179) — Save chunks as JSON.
- `run_chunking()` (L188) — Run chunking for all normalized documents.

---

### `rag_aviacao/scripts/create_all_samples.py`

> ========================================== AirOps AI — Full Sample Document Generator Creates all 18 regulatory documents for testing ==========================================

**Funções:**

- `create_all_sample_documents()` (L441) — Create all 14 remaining sample documents.

---

### `rag_aviacao/scripts/create_samples.py`

> ========================================== AirOps AI — Sample Document Generator Creates text-based sample documents for testing when real PDFs are not yet available ==========================================

**Funções:**

- `create_sample_documents()` (L183) — Create sample text documents for pipeline testing.

---

### `rag_aviacao/scripts/eval_runner.py`

> ========================================== AirOps AI — RAG Evaluation Runner Tests intent classification accuracy ==========================================

**Funções:**

- `run_intent_evaluation()` (L17) — Evaluate intent classification accuracy against the eval set.

---

### `rag_aviacao/scripts/eval_set.py`

> ========================================== AirOps AI — RAG Evaluation Set 330 test questions across all categories ==========================================

**Funções:**

- `save_eval_set()` (L114) — Save the evaluation set to a JSON file.

---

### `rag_aviacao/scripts/extractor.py`

> ========================================== AirOps AI — PDF Text Extractor Extracts text and tables from PDF documents ==========================================  Usage: python -m rag_aviacao.scripts.extractor python -m rag_aviacao.scripts.extractor --file path/to/specific.pdf  Output: JSON files in 05_processados/extracted/

**Funções:**

- `load_manifest()` (L35) — Load the document manifest.
- `extract_text_pymupdf()` (L41) — Extract text from each page using PyMuPDF (fast, works for most PDFs).
- `extract_tables_pdfplumber()` (L65) — Extract tables from PDF pages using pdfplumber.
- `extract_text_file()` (L93) — Extract text from a plain text file (used for samples).
- `extract_document()` (L105) — Extract text and tables from a single document (PDF or TXT).
- `save_extraction()` (L159) — Save extraction result as JSON.
- `run_extraction()` (L170) — Run extraction for all documents in manifest or a specific file.

---

### `rag_aviacao/scripts/indexer.py`

> ========================================== AirOps AI — Embedding Generator + Qdrant Indexer Generates embeddings and indexes into Qdrant ==========================================  Usage: python -m rag_aviacao.scripts.indexer  Prerequisites: - Qdrant running: docker compose up -d

**Funções:**

- `get_openai_client()` (L68) — Create OpenAI client (returns None in test mode).
- `get_qdrant_client()` (L81) — Create Qdrant client.
- `create_collection()` (L95) — Create or recreate the Qdrant collection.
- `generate_embeddings()` (L114) — Generate embeddings for a batch of texts.
- `load_all_chunks()` (L133) — Load all chunk files from the chunks directory.
- `index_chunks()` (L148) — Generate embeddings and index all chunks into Qdrant.
- `verify_index()` (L216) — Verify the index by running a test query.
- `run_indexing()` (L224) — Run the full indexing pipeline.

---

### `rag_aviacao/scripts/normalizer.py`

> ========================================== AirOps AI — Text Normalizer Cleans extracted text and identifies legal structure ==========================================  Usage: python -m rag_aviacao.scripts.normalizer  Input:  05_processados/extracted/*.json Output: 05_processados/normalized/*.json

**Funções:**

- `clean_text()` (L23) — Remove common PDF artifacts and normalize whitespace.
- `identify_legal_structure()` (L55) — Identify legal hierarchy elements in the text.
- `normalize_document()` (L109) — Normalize an extracted document.
- `save_normalized()` (L159) — Save normalized result as JSON.
- `run_normalization()` (L170) — Run normalization for all extracted documents.

---

### `rag_aviacao/scripts/test_pipeline.py`

> ========================================== AirOps AI — Local Pipeline Test Tests the full pipeline: chunks → Qdrant (in-memory) → retrieval No Docker or OpenAI key needed ==========================================

**Funções:**

- `load_all_chunks()` (L29) — Load all chunked documents.
- `generate_fake_embedding()` (L48) — Generate a deterministic fake embedding for testing.
- `test_pipeline()` (L57) — Run full pipeline test.

---

### `routes/analytics.py`

> ========================================== AirOps AI — Analytics API (Real SQLite Data) ==========================================

**Funções:**

- `dashboard()` (L15)
- `costs()` (L82)

---

### `routes/chat.py`

> ========================================== AirOps AI — Chat Route (Refactored) Integrates Decision Engine + Auth + RAG + Tone Engine ==========================================

**Classes:**

- `ChatMessage` (L31)
- `TestPrompt` (L38)

**Funções:**

- `chat_message()` (L43)
- `chat_test()` (L101)

---

### `routes/decision_tree.py`

> ========================================== Papagaio Fly — Decision Tree API Route Serves the LLM-generated decision tree JSON ==========================================

**Funções:**

- `get_decision_tree()` (L15) — Return the full decision tree JSON generated by the Agentic Workflow.

---

### `routes/flights.py`

> ========================================== AirOps AI — Flights API Route ==========================================

**Funções:**

- `list_flights()` (L12)
- `get_disruptions()` (L31)
- `get_flight_events()` (L44)

---

### `routes/pnr.py`

> ========================================== AirOps AI — PNR API Route ==========================================

**Funções:**

- `get_pnr()` (L13)
- `get_pnr_rights()` (L21)

---

### `routes/rag.py`

> ========================================== AirOps AI — RAG API Route POST /api/rag/ask — Main RAG endpoint ==========================================

**Classes:**

- `AskRequest` (L15)
- `SourceItem` (L22)
- `AskResponse` (L29)

**Funções:**

- `rag_ask()` (L42) — Ask a question to the RAG pipeline.
- `rag_health()` (L77) — Check RAG pipeline health.

---

### `routes/sac.py`

**Funções:**

- `get_past_date()` (L12)
- `get_live_queue()` (L90)
- `parse_iso()` (L103)

---

### `routes/voice.py`

> ========================================== AirOps AI — Voice API Route (WebRTC proxy stub) ==========================================

**Classes:**

- `ToolExecuteRequest` (L47)

**Funções:**

- `create_voice_session()` (L13) — Create a WebRTC voice session by returning an ephemeral key.
- `execute_voice_tool()` (L52) — Executes a tool requested by the Voice Agent.

---

### `routes/voice_ws.py`

> ========================================== AirOps AI — Voice WebRTC WebSocket Relay Proxy between Client and OpenAI Realtime API ==========================================

**Funções:**

- `voice_websocket_endpoint()` (L19)
- `client_to_openai()` (L46)
- `openai_to_client()` (L54)

---

### `scripts/generate_decision_tree.py`

> Load environment

**Funções:**

- `generate_decision_tree()` (L113)

---

### `security/output_guardrails.py`

> ========================================== AirOps AI — Security: Output Guardrails (Layer 3) ==========================================

**Funções:**

- `mask_output_pii()` (L9) — Guardrail 3: Ensure sensitive data is never output fully.
- `validate_output()` (L41)

---

### `security/pii_masking.py`

> ========================================== AirOps AI — Security: PII Masking (Layer 1) ==========================================

**Funções:**

- `mask_pii()` (L27)
- `contains_pii()` (L46)

---

### `security/pipeline.py`

> ========================================== AirOps AI — Security Pipeline (Orchestrator) Chains all security layers together ==========================================

**Funções:**

- `create_security_context()` (L12) — Pre-process pipeline: PII mask → jailbreak detect → safety injection.
- `validate_response()` (L36) — Post-process: output guardrails + PII masking on output (Guardrail 3).

---

### `security/safety_injection.py`

> ========================================== AirOps AI — Security: Safety Injection (Layer 2) Anti-jailbreak + system prompt builder ==========================================

**Funções:**

- `get_system_prompt()` (L43) — Load system prompt from file or use fallback.
- `detect_jailbreak()` (L54) — Simple heuristic jailbreak detection.

---

### `services/auth_engine.py`

> ========================================== AirOps AI — Auth Engine (Session Security) PII masking + secure PNR lookup ==========================================

**Funções:**

- `mask_sensitive_fields()` (L10) — Mask PII fields in a dict recursively.
- `secure_pnr_lookup()` (L35) — Lookup PNR with security scope, joining all related tables.

---

### `services/conflict_resolver.py`

> ========================================== AirOps AI — Conflict Resolver Detects and resolves norm vs policy conflicts ==========================================

**Funções:**

- `check_conflicts()` (L9) — Check if retrieved chunks contain conflicting sources.
- `resolve_conflict()` (L59) — Resolve a detected conflict by applying priority rules.

---

### `services/decision_engine.py`

> ========================================== AirOps AI — Decision Engine (Anti-Hallucination) Deterministic rules that LLM can NEVER override ==========================================

**Funções:**

- `evaluate_flight_disruption()` (L7)
- `evaluate_refund_eligibility()` (L68)
- `evaluate_baggage_rights()` (L108)
- `calculate_assistance_vouchers()` (L133)
- `prioritize_resolution()` (L152)

---

### `services/groundedness.py`

> ========================================== AirOps AI — Groundedness Checker Verifies LLM responses against source chunks Anti-hallucination layer (Air Canada mitigation) ==========================================

**Funções:**

- `check_groundedness()` (L61) — Verify if the answer is grounded in the provided chunks.
- `get_fallback_message()` (L154) — Get the fallback message when groundedness check blocks a response.

---

### `services/i18n.py`

> ========================================== AirOps AI — Internationalization (i18n) Multi-language System Prompts & Messages ==========================================

**Funções:**

- `detect_language()` (L41) — Detect language of user input. Defaults to pt.
- `get_i18n_system_prompt()` (L49)
- `get_i18n_decision_message()` (L52)

---

### `services/openai_client.py`

> ========================================== AirOps AI — OpenAI Client Singleton Handles connection to OpenAI API ==========================================

**Funções:**

- `get_openai_client()` (L11)
- `is_openai_available()` (L22)

---

### `services/query_rewriter.py`

> ========================================== AirOps AI — Query Rewriter Conversational context for multi-turn RAG ==========================================

**Funções:**

- `rewrite_query()` (L9) — Rewrite the current question using conversation history.
- `extract_session_context()` (L69) — Extract structured context from conversation history.

---

### `services/rag.py`

> ========================================== AirOps AI — RAG Semantic Search Engine ==========================================

**Funções:**

- `fallback_search()` (L13) — Keyword-based fallback when OpenAI embeddings aren't available.
- `compile_rag()` (L30) — Initialize RAG engine and generate embeddings if needed.
- `search_knowledge()` (L72) — Search knowledge base using embeddings or fallback to keyword match.

---

### `services/rag_pipeline.py`

> ========================================== AirOps AI — RAG Pipeline Orchestrator End-to-end: Query → Intent → Retrieve → Generate → Verify → Respond ==========================================

**Funções:**

- `classify_intent()` (L27) — Classify the user's question intent and topic.
- `generate_answer()` (L91) — Generate a structured answer using the RAG policy agent.
- `add_disclaimer()` (L175) — Add legal disclaimer if the response is about rights/obligations.
- `ask()` (L205) — Main RAG pipeline entry point.

---

### `services/retriever.py`

> ========================================== AirOps AI — Hybrid Retriever Searches Qdrant with vector + metadata filters ==========================================

**Funções:**

- `build_filters()` (L59) — Build Qdrant filter conditions from metadata.
- `retrieve()` (L106) — Retrieve relevant chunks from Qdrant.
- `format_context_for_llm()` (L196) — Format retrieved chunks as context string for the LLM prompt.

---

### `services/session_manager.py`

> ========================================== AirOps AI — Session Manager Manages authenticated sessions and context ==========================================

**Funções:**

- `create_session()` (L10) — Create a new authenticated session.
- `validate_session_scope()` (L32) — Guardrail 1: Ensure session is authorized to access target_pnr.
- `get_session_context()` (L40) — Retrieve full context for an active session.
- `log_tool_call()` (L48) — Log an agent tool execution.

---

### `services/tone_engine.py`

> ========================================== AirOps AI — Tone Engine (Ethical Personalization) Adapts communication style based on SAFE signals ONLY ==========================================  GUARDRAIL PRINCIPAL: > Direitos e opções são definidos por dados operacionais e regras. > A linguagem pode ser adaptada por preferência, contexto e necessidade demonstrada.  NUNCA personalizar com base em: idade, local/região, gênero, renda percebida,

**Funções:**

- `select_conversation_mode()` (L35)
- `build_tone_guidance()` (L61)
- `detect_conversation_signals()` (L108)
- `classify_intent()` (L129)

---

### `tools/flight_tools.py`

> ========================================== AirOps AI — Flight Tools Function calling tools for flight operations ==========================================

---

### `tools/handoff_tools.py`

> ========================================== AirOps AI — Handoff Tools Function calling tools for human escalation ==========================================

---

### `tools/refund_tools.py`

> ========================================== AirOps AI — Refund Tools Function calling tools for refund operations ==========================================

---

### `tools/reservation_tools.py`

> ========================================== AirOps AI — Reservation Tools Function calling tools for reservation operations ==========================================

---

## 4. Endpoints da API

| Método | Path | Handler | Arquivo |
|---|---|---|---|
| `GET` | `/api/health` | `health` | `main.py` |
| `POST` | `/api/chat/message` | `chat_message` | `routes/chat.py` |
| `POST` | `/api/chat/test` | `chat_test` | `routes/chat.py` |
| `GET` | `/api/pnr/{locator}` | `get_pnr` | `routes/pnr.py` |
| `GET` | `/api/pnr/{locator}/rights` | `get_pnr_rights` | `routes/pnr.py` |
| `GET` | `/api/flights/` | `list_flights` | `routes/flights.py` |
| `GET` | `/api/flights/disruptions` | `get_disruptions` | `routes/flights.py` |
| `GET` | `/api/flights/{id}/events` | `get_flight_events` | `routes/flights.py` |
| `GET` | `/api/analytics/dashboard` | `dashboard` | `routes/analytics.py` |
| `GET` | `/api/analytics/costs` | `costs` | `routes/analytics.py` |
| `POST` | `/api/voice/session` | `create_voice_session` | `routes/voice.py` |


---

## 5. Schema do Banco (31 Tabelas)

| Grupo | Tabelas |
|---|---|
| Core Operacional | `pnr_reservations`, `passengers`, `customer_identity_map`, `loyalty_profiles`, `flight_segments`, `pnr_segments`, `flight_status_events` |
| Financeiro | `tickets`, `fare_rules`, `payments`, `refunds`, `vouchers_emds` |
| Bagagem | `baggage_items`, `baggage_events` |
| Operações Irregulares | `irregular_operations` |
| Suporte ao Cliente | `support_cases`, `support_interactions`, `human_handoff_queue` |
| Regulatório | `regulatory_decision_logs`, `material_assistance`, `reaccommodation_options` |
| Telemetria IA | `agent_sessions`, `agent_tool_calls`, `agent_latency`, `agent_resolution_outcomes`, `qa_scores`, `csat_predictions`, `fraud_alerts` |
| Personalização Ética | `communication_preferences`, `conversation_signals` |

---

## 6. Pipeline de Segurança (5 Camadas)

```
                     ┌──────────────┐
 Usuário → Mensagem → │ Layer 1: PII │ → Texto mascarado
                     │   Masking    │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │ Layer 2:     │ → Jailbreak detectado?
                     │ Jailbreak    │
                     │ Detection    │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │ Layer 3:     │ → System prompt injetado
                     │ Safety       │
                     │ Injection    │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │    LLM       │
                     │  (GPT-4o)    │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │ Layer 4:     │ → PII leak? Offensive? Legal?
                     │ Output       │
                     │ Guardrails   │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │ Layer 5:     │ → RBAC + Limites de ação
                     │ RBAC         │
                     └──────────────┘
```

---

## 7. Decision Engine (Política de Direitos do Passageiro)

O motor de decisão é **determinístico** e **inviolável pelo LLM**:

| Situação | Regra | Direitos |
|---|---|---|
| Atraso ≥ 1h | POL_DELAY_1H | Comunicação |
| Atraso ≥ 2h | POL_DELAY_2H | + Alimentação |
| Atraso ≥ 4h | POL_DELAY_4H | + Reacomodação/Reembolso/Hospedagem |
| Cancelamento | POL_CANCEL | Todos os direitos |
| Overbooking | POL_OVERBOOKING | Todos + Compensação financeira |
| Bagagem (dom.) | POL_BAGGAGE_7D | Rastreamento 7 dias → Indenização |
| Bagagem (intl.) | POL_BAGGAGE_21D | Rastreamento 21 dias → Indenização |

---

*Gerado por `docs/generate_docs.py`*
