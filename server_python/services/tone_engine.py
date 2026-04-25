# ==========================================
# AirOps AI — Tone Engine (Ethical Personalization)
# Adapts communication style based on SAFE signals ONLY
# ==========================================
#
# GUARDRAIL PRINCIPAL:
# > Direitos e opções são definidos por dados operacionais e regras.
# > A linguagem pode ser adaptada por preferência, contexto e necessidade demonstrada.
#
# NUNCA personalizar com base em: idade, local/região, gênero, renda percebida,
# sotaque, escolaridade presumida ou qualquer atributo sensível.
# ==========================================

import re
from typing import Literal

ConversationMode = Literal["informativo", "empatico", "resolucao", "seguranca"]

ANTI_BIAS_GUARDRAIL = """
## GUARDRAIL ANTI-VIÉS (OBRIGATÓRIO)

Adapte a comunicação APENAS com base em:
1. Preferência declarada pelo cliente (idioma, estilo de comunicação)
2. Contexto da jornada (voo atrasado, cancelado, bagagem extraviada)
3. Urgência operacional (passageiro no aeroporto, conexão próxima)
4. Sinais conversacionais observados (confusão, frustração, ansiedade demonstrada na conversa)
5. Necessidades de acessibilidade explicitamente informadas pelo cliente

NUNCA reduza, limite, oculte ou altere direitos, opções, compensações ou prioridade regulatória com base em idade, localização, gênero, renda presumida, sotaque, escolaridade presumida ou qualquer atributo sensível.

Todos os passageiros recebem as mesmas opções para a mesma situação operacional. A linguagem pode mudar — os direitos não.
""".strip()


def select_conversation_mode(
    intent: str,
    disruption_type: str | None,
    signals: dict,
    security_concern: bool = False,
) -> ConversationMode:
    if security_concern:
        return "seguranca"

    disruptive_intents = ["cancel-flight", "lost-connection", "denied-boarding", "resolve-baggage"]
    disruptive_statuses = ["cancelled", "delayed", "denied_boarding", "overbooking"]

    if (
        intent in disruptive_intents
        or (disruption_type and disruption_type in disruptive_statuses)
        or signals.get("detected_frustration")
        or signals.get("detected_anxiety")
    ):
        return "empatico"

    if intent in ("request-refund", "change-flight", "request-assistance"):
        return "resolucao"

    return "informativo"


def build_tone_guidance(mode: ConversationMode, signals: dict, preferences: dict) -> dict:
    guidance_map = {
        "informativo": {
            "toneGuidance": "Objetivo e direto. Informe status, horário atualizado e próximo passo.",
            "systemPromptAddendum": "[MODO INFORMATIVO] Seja objetivo, informe status, horário atualizado e próximo passo. Evite jargões técnicos.",
        },
        "empatico": {
            "toneGuidance": "Reconheça o impacto no passageiro, explique a situação e apresente opções claras.",
            "systemPromptAddendum": "[MODO EMPÁTICO] Reconheça o impacto da situação no passageiro. Explique com clareza e apresente TODAS as opções disponíveis. Nunca minimize o problema.",
        },
        "resolucao": {
            "toneGuidance": "Confirme elegibilidade, apresente opções e peça autorização antes de executar qualquer ação.",
            "systemPromptAddendum": "[MODO RESOLUÇÃO] Confirme elegibilidade, apresente opções claras com valores e prazos, e SEMPRE peça autorização explícita antes de executar qualquer ação.",
        },
        "seguranca": {
            "toneGuidance": "Não revele dados. Solicite validação adicional ou encaminhe para humano.",
            "systemPromptAddendum": "[MODO SEGURANÇA] NÃO revele dados sensíveis. Solicite validação adicional de identidade. Se a inconsistência persistir, encaminhe para atendente humano.",
        },
    }

    result = guidance_map[mode].copy()
    addendum = result["systemPromptAddendum"]

    if signals.get("detected_confusion") or signals.get("asked_to_repeat"):
        addendum += "\n[SINAL: CONFUSÃO DETECTADA] Use linguagem mais pausada e objetiva. Evite jargões. Use frases curtas. Confirme entendimento antes de avançar."

    if signals.get("detected_frustration"):
        addendum += "\n[SINAL: FRUSTRAÇÃO DETECTADA] Reconheça o sentimento do passageiro. Demonstre que você está agindo para resolver. Seja proativo nas soluções."

    if signals.get("detected_anxiety"):
        addendum += "\n[SINAL: ANSIEDADE DETECTADA] Transmita segurança. Seja claro sobre prazos e próximos passos. Evite ambiguidade."

    urgency = signals.get("urgency_level", "low")
    if urgency in ("critical", "high"):
        addendum += f"\n[SINAL: URGÊNCIA {urgency.upper()}] Priorize ação imediata. Vá direto ao ponto. Minimize etapas intermediárias."

    if preferences.get("communication_style") == "detailed":
        addendum += "\n[PREFERÊNCIA: DETALHADO] O cliente preferiu explicações detalhadas. Inclua mais contexto e justificativas."

    if preferences.get("accessibility_needs_declared"):
        addendum += f"\n[ACESSIBILIDADE DECLARADA: {preferences['accessibility_needs_declared']}] Adapte a comunicação conforme a necessidade informada pelo cliente."

    result["systemPromptAddendum"] = addendum
    result["mode"] = mode
    return result


def detect_conversation_signals(message_text: str, existing_signals: dict | None = None) -> dict:
    signals = dict(existing_signals or {})
    lower = message_text.lower()

    if re.search(r"não entend|nao entend|como assim|pode repetir|pode explicar|o que (é|significa)|repita|repete|não compreend", lower):
        signals["detected_confusion"] = True
        signals["asked_to_repeat"] = True

    if re.search(r"absurdo|inaceit[áa]vel|vergonha|descaso|p[ée]ssim|horrível|hor[ií]vel|reclama|denuncia|procon|anac|ouvidoria|processar|advogado|nunca mais", lower):
        signals["detected_frustration"] = True

    if re.search(r"urgente|preciso agora|meu voo.*(daqui|logo|minuto)|não (vou|vai) conseguir|perder.*(voo|conex)|vou perder|falta pouco|embarca", lower):
        signals["detected_anxiety"] = True
        signals["urgency_level"] = "high"

    if re.search(r"falar com (uma? )?(?:pessoa|humano|atendente|supervisor|gerente)|atendimento humano", lower):
        signals["requested_human"] = True

    return signals


def classify_intent(text: str) -> str:
    lower = text.lower()
    if re.search(r"status|como.?est[áa]|hor[áa]rio|port[ãa]o|gate|terminal", lower):
        return "flight-status"
    if re.search(r"remarc|alter|mudar|trocar.*(data|voo|hor)", lower):
        return "change-flight"
    if re.search(r"cancel", lower):
        return "cancel-flight"
    if re.search(r"reembols|refund|devol|estorn", lower):
        return "request-refund"
    if re.search(r"bag|mala|mochila|extravi|perdi.*(bag|mala)|dano", lower):
        return "resolve-baggage"
    if re.search(r"conex|perdi.*(voo|conex)|transfer", lower):
        return "lost-connection"
    if re.search(r"overbooking|n[ãa]o.*embarca|impedid|preterid", lower):
        return "denied-boarding"
    if re.search(r"assist[eê]ncia|ajuda|hotel|aliment|voucher", lower):
        return "request-assistance"
    return "general-inquiry"
