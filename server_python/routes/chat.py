# ==========================================
# AirOps AI — Chat Route (Refactored)
# Integrates Decision Engine + Auth + RAG + Tone Engine
# ==========================================

from datetime import datetime
import json
import time
from fastapi import APIRouter
from pydantic import BaseModel

from config.settings import settings
from security.pipeline import create_security_context, validate_response
from services.auth_engine import secure_pnr_lookup
from services.decision_engine import (
    evaluate_flight_disruption, evaluate_refund_eligibility,
    evaluate_baggage_rights, calculate_assistance_vouchers,
)
from services.tone_engine import (
    detect_conversation_signals, select_conversation_mode,
    build_tone_guidance, classify_intent,
)
from services.rag import search_knowledge
from services.session_manager import create_session, validate_session_scope, get_session_context, log_tool_call
from services.openai_client import get_openai_client, is_openai_available
from db.sqlite_manager import get_db

router = APIRouter(prefix="/api/chat", tags=["Chat"])


class ChatMessage(BaseModel):
    message: str
    conversationId: str | None = None
    pnr: str | None = None
    channel: str = "chat"


class TestPrompt(BaseModel):
    prompt: str


@router.post("/message")
async def chat_message(body: ChatMessage):
    message = body.message
    pnr = body.pnr
    conversation_id = body.conversationId
    channel = body.channel

    security = create_security_context(message, agent_type="sac-agent-voice-v1" if channel == "voice" else "sac-agent-v1")

    if security["jailbreakDetected"]:
        print(f"⚠️ Jailbreak attempt detected: {security['jailbreakPatterns']}")

    # ---- Ethical Personalization: Tone Engine ----
    conversation_signals = detect_conversation_signals(message)
    intent = classify_intent(message)
    mode = select_conversation_mode(intent, None, conversation_signals, security["jailbreakDetected"])
    tone_context = build_tone_guidance(mode, conversation_signals, {})

    # Persist conversation signals
    try:
        db = get_db()
        db.execute(
            "INSERT INTO conversation_signals (session_id, detected_confusion, detected_frustration, detected_anxiety, requested_human, asked_to_repeat, urgency_level, conversation_mode, message_count) VALUES (?,?,?,?,?,?,?,?,1)",
            (conversation_id or f"SES-{int(datetime.utcnow().timestamp()*1000)}",
             1 if conversation_signals.get("detected_confusion") else 0,
             1 if conversation_signals.get("detected_frustration") else 0,
             1 if conversation_signals.get("detected_anxiety") else 0,
             1 if conversation_signals.get("requested_human") else 0,
             1 if conversation_signals.get("asked_to_repeat") else 0,
             conversation_signals.get("urgency_level", "low"),
             mode),
        )
        db.commit()
    except Exception:
        pass  # non-critical

    # ---- Generate Response ----
    if not is_openai_available():
        llm_response = _smart_mock_response(message, pnr)
    else:
        # Production: call OpenAI with Function Calling
        llm_response = await _generate_openai_response(message, pnr, conversation_id, tone_context)

    result = validate_response(llm_response)

    return {
        "response": result["finalOutput"],
        "conversationId": conversation_id,
        "toneMode": mode,
        "security": {
            "piiMasked": len(security["piiEntities"]) > 0,
            "jailbreakDetected": security["jailbreakDetected"],
            "guardrailsPassed": result["outputValidation"].get("passed", True),
            "violations": [{"rule": v["rule"], "severity": v["severity"]} for v in result["outputValidation"].get("violations", [])],
        },
    }


@router.post("/test")
async def chat_test(body: TestPrompt):
    security = create_security_context(body.prompt)
    mock = "Oi! Sou a Zulu, da Papagaio Fly! Posso ajudar com questões relacionadas a voos e reservas."
    result = validate_response(mock)
    return {
        "response": result["finalOutput"],
        "securityFlags": {"jailbreakDetected": security["jailbreakDetected"], "patterns": security["jailbreakPatterns"]},
    }


# ---- OpenAI Integration with Function Calling ----

async def _generate_openai_response(message: str, pnr: str | None, session_id: str | None, tone_context: dict) -> str:
    client = get_openai_client()
    
    # System prompt setup
    system_prompt = f"""Você é a Zulu, assistente virtual da Papagaio Fly, uma companhia aérea brasileira.
{tone_context.get('systemPromptAddendum', '')}

Seja simpática, acolhedora e eficiente. Sempre se apresente como Zulu da Papagaio Fly.
Você deve seguir a política da Papagaio Fly.
Use as tools disponíveis para consultar dados antes de responder.
O PNR do cliente em contexto atual é: {pnr if pnr else 'Não informado'}."""

    tools = [
        {
            "type": "function",
            "function": {
                "name": "lookup_pnr",
                "description": "Busca detalhes de uma reserva usando o código PNR",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "pnr": {"type": "string", "description": "Código PNR de 6 caracteres"}
                    },
                    "required": ["pnr"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "search_knowledge",
                "description": "Busca políticas e normas da Papagaio Fly",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Tema da busca, ex: reembolso, atraso"}
                    },
                    "required": ["query"]
                }
            }
        }
    ]

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": message}
    ]

    start_time = time.time()
    
    response = await client.chat.completions.create(
        model=settings.OPENAI_CHAT_MODEL,
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )
    
    response_message = response.choices[0].message
    
    # Handle function calls
    if response_message.tool_calls:
        messages.append(response_message)
        
        for tool_call in response_message.tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            tool_start = time.time()
            function_response = "Error"
            
            try:
                if function_name == "lookup_pnr":
                    if session_id and pnr and not validate_session_scope(session_id, function_args.get("pnr")):
                        function_response = json.dumps({"error": "Acesso negado. O PNR solicitado não pertence à sessão atual."})
                    else:
                        res = secure_pnr_lookup(function_args.get("pnr"))
                        function_response = json.dumps(res)
                elif function_name == "search_knowledge":
                    res = await search_knowledge(function_args.get("query"))
                    function_response = res
            except Exception as e:
                function_response = json.dumps({"error": str(e)})
                
            tool_lat = int((time.time() - tool_start) * 1000)
            if session_id:
                log_tool_call(session_id, function_name, json.dumps(function_args), "success", True, tool_lat)
            
            messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": function_response
            })
            
        # Second call to get final response
        second_response = await client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=messages
        )
        return second_response.choices[0].message.content

    return response_message.content


# ---- Smart Mock Response (Fallback) ----

def _smart_mock_response(message: str, pnr: str | None = None) -> str:
    lower = message.lower()

    if pnr:
        result = secure_pnr_lookup(pnr.upper())
        if result["found"]:
            p = result["pnr"]
            seg = (p.get("segments") or [None])[0]
            pax = (p.get("passengers") or [None])[0]
            ticket = (p.get("tickets") or [None])[0]

            if any(w in lower for w in ("status", "voo", "vôo")):
                if seg:
                    if seg["segment_status"] == "cancelled":
                        dis = evaluate_flight_disruption(0, True, False)
                        return f"{pax.get('first_name','Passageiro')}, seu voo {seg['flight_number']} de {seg['origin']} para {seg['destination']} foi **cancelado**. {dis['customerMessage']}"
                    if seg["segment_status"] == "delayed":
                        dis = evaluate_flight_disruption(seg["delay_minutes"], False, False)
                        return f"{pax.get('first_name','Passageiro')}, seu voo {seg['flight_number']} de {seg['origin']} para {seg['destination']} está com atraso de **{seg['delay_minutes']} minutos**. {dis['customerMessage']}"
                    dep_time = seg.get("scheduled_departure", "")
                    try:
                        dep_dt = datetime.fromisoformat(dep_time)
                        time_str = dep_dt.strftime("%H:%M")
                    except Exception:
                        time_str = "a confirmar"
                    return f"{pax.get('first_name','Passageiro')}, seu voo {seg['flight_number']} de {seg['origin']} para {seg['destination']} está **confirmado e no horário**. Partida prevista: {time_str}, Portão {seg.get('gate','a confirmar')}."

            if any(w in lower for w in ("cancelar", "cancela", "reembolso", "reembolsar")):
                if ticket:
                    is_irop = seg and (seg["segment_status"] == "cancelled" or (seg.get("delay_minutes") or 0) >= 240)
                    ref = evaluate_refund_eligibility(
                        {"refundable": bool(ticket.get("refundable")), "change_fee": ticket.get("change_fee", 0), "cancel_fee": ticket.get("cancel_fee", 0), "voucher_allowed": bool(ticket.get("voucher_allowed")), "fare_family": ticket.get("fare_family", "basic")},
                        "involuntary" if is_irop else "voluntary",
                        ticket.get("total_amount", 0),
                    )
                    if ref["allowed"]:
                        penalty_msg = f" Multa: R$ {ref['penaltyAmount']:.2f}." if ref["penaltyAmount"] else ""
                        return f"{pax.get('first_name','Passageiro')}, {ref['reason']} Valor do reembolso: **R$ {ref['refundAmount']:.2f}**.{penalty_msg} Deseja prosseguir?"
                    alt_msg = " Posso oferecer um crédito de voo ou remarcação." if ref["alternativeActions"] else ""
                    return f"{pax.get('first_name','Passageiro')}, {ref['reason']}{alt_msg}"

            if any(w in lower for w in ("bagagem", "mala", "mochila")):
                bags = [b for b in p.get("baggage", []) if b.get("baggage_status") in ("missing", "delayed")]
                if bags:
                    bag = bags[0]
                    rights = evaluate_baggage_rights(True, bag.get("days_missing", 0))
                    return f"{pax.get('first_name','Passageiro')}, localizei o registro da sua bagagem (PIR: {bag.get('pir_number','em aberto')}). {rights['customerMessage']}"
                return f"{pax.get('first_name','Passageiro')}, não encontrei nenhuma ocorrência de bagagem para sua reserva. Sua bagagem está em situação normal."

            return f"Olá, {pax.get('first_name','Passageiro')}! Identifiquei sua reserva **{p['locator']}** (voo {seg['flight_number'] if seg else '—'}, {seg['origin'] if seg else ''} → {seg['destination'] if seg else ''}). Como posso ajudar?"

    if "status" in lower or "voo" in lower:
        return "Por favor, me informe o código da sua reserva (PNR) para que eu consulte o status do seu voo."
    if "cancelar" in lower or "reembolso" in lower:
        return "Para verificar as opções de cancelamento ou reembolso, preciso do seu PNR. Pode me informar?"
    if "bagagem" in lower or "mala" in lower:
        return "Vou verificar o status da sua bagagem. Qual é o seu PNR?"
    if "atras" in lower:
        return "Entendo que seu voo está atrasado. Me passe o PNR para que eu verifique seus direitos."
    return "Oi! Aqui é a Zulu, da Papagaio Fly! Posso ajudar com status de voo, atrasos, cancelamentos, reacomodação, bagagem e reembolso. Me informe seu PNR pra gente começar!"
