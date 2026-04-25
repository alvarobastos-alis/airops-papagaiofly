# ==========================================
# AirOps AI — Internationalization (i18n)
# Multi-language System Prompts & Messages
# ==========================================

from langdetect import detect

# Mapeamento simples de idiomas suportados
SUPPORTED_LANGUAGES = {"pt": "Português Brasileiro", "en": "English", "es": "Español"}

SYSTEM_PROMPTS = {
    "pt": """Você é o AirOps AI, um agente de atendimento especializado em aviação civil.
Sua comunicação deve ser em Português Brasileiro.""",
    "en": """You are AirOps AI, a specialized customer service agent for civil aviation.
Your communication must be in English.""",
    "es": """Eres AirOps AI, un agente de servicio al cliente especializado en aviación civil.
Tu comunicación debe ser en Español."""
}

DECISION_MESSAGES = {
    "pt": {
        "delay_1h": "Seu voo está com atraso de {minutes} minutos. Você tem direito a meios de comunicação.",
        "delay_2h": "Seu voo está com atraso de {minutes} minutos. Você tem direito a alimentação — podemos gerar um voucher iFood ou procure o balcão da Papagaio Fly para restaurantes credenciados.",
        "delay_4h": "Seu voo está com atraso superior a 4 horas. Você tem direito a remarcação, reembolso e hospedagem.",
        "cancelled": "Seu voo foi cancelado. Você tem opções de remarcação sem custo ou reembolso integral."
    },
    "en": {
        "delay_1h": "Your flight is delayed by {minutes} minutes. You are entitled to communication facilities.",
        "delay_2h": "Your flight is delayed by {minutes} minutes. You are entitled to a meal voucher.",
        "delay_4h": "Your flight is delayed over 4 hours. You are entitled to rebooking, refund, and hotel accommodation.",
        "cancelled": "Your flight has been cancelled. You have options for free rebooking or full refund."
    },
    "es": {
        "delay_1h": "Su vuelo tiene un retraso de {minutes} minutos. Tiene derecho a facilidades de comunicación.",
        "delay_2h": "Su vuelo tiene un retraso de {minutes} minutos. Tiene derecho a un bono de comida.",
        "delay_4h": "Su vuelo tiene un retraso superior a 4 horas. Tiene derecho a cambio de reserva, reembolso y alojamiento.",
        "cancelled": "Su vuelo ha sido cancelado. Tiene opciones para cambio de reserva gratuito o reembolso completo."
    }
}

def detect_language(text: str) -> str:
    """Detect language of user input. Defaults to pt."""
    try:
        lang = detect(text)
        return lang if lang in SUPPORTED_LANGUAGES else "pt"
    except:
        return "pt"

def get_i18n_system_prompt(lang: str) -> str:
    return SYSTEM_PROMPTS.get(lang, SYSTEM_PROMPTS["pt"])

def get_i18n_decision_message(key: str, lang: str, **kwargs) -> str:
    msg_dict = DECISION_MESSAGES.get(lang, DECISION_MESSAGES["pt"])
    msg = msg_dict.get(key, DECISION_MESSAGES["pt"].get(key, ""))
    return msg.format(**kwargs)
