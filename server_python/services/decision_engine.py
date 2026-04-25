# ==========================================
# AirOps AI — Decision Engine (Anti-Hallucination)
# Deterministic rules that LLM can NEVER override
# ==========================================


def evaluate_flight_disruption(delay_minutes: int, is_cancelled: bool, is_overbooking: bool) -> dict:
    rights = {
        "communication": False, "food": False, "accommodation": False,
        "transport": False, "reaccommodation": False, "reschedule": False,
        "refund": False, "compensation": False,
    }
    allowed_actions = ["inform_status"]
    blocked_actions = []
    assistance_level = "none"
    rule_applied = "none"
    customer_message = ""

    if is_overbooking:
        rights = {k: True for k in rights}
        assistance_level = "full"
        rule_applied = "ANAC_RES400_OVERBOOKING"
        allowed_actions.extend(["reaccommodate", "reschedule", "refund", "issue_compensation", "issue_voucher_meal", "issue_voucher_hotel", "issue_voucher_transport"])
        customer_message = "Você foi impedido(a) de embarcar (preterição). De acordo com a nossa política, você tem direito a reacomodação, remarcação ou reembolso integral, além de compensação financeira e assistência material completa."
    elif is_cancelled:
        rights.update(communication=True, food=True, accommodation=True, transport=True, reaccommodation=True, reschedule=True, refund=True)
        assistance_level = "full"
        rule_applied = "ANAC_RES400_CANCELLATION"
        allowed_actions.extend(["reaccommodate", "reschedule", "refund", "issue_voucher_meal", "issue_voucher_hotel", "issue_voucher_transport", "issue_flight_credit"])
        customer_message = "Seu voo foi cancelado. De acordo com a nossa política, você pode escolher: reacomodação no próximo voo disponível, remarcação para outra data/horário sem custo, ou reembolso integral. Assistência material completa está incluída."
    elif delay_minutes >= 240:
        rights.update(communication=True, food=True, accommodation=True, transport=True, reaccommodation=True, reschedule=True, refund=True)
        assistance_level = "full"
        rule_applied = "ANAC_RES400_DELAY_4H"
        allowed_actions.extend(["reaccommodate", "reschedule", "refund", "issue_voucher_meal", "issue_voucher_hotel", "issue_voucher_transport", "issue_flight_credit"])
        customer_message = f"Seu voo está com atraso de {delay_minutes} minutos (mais de 4 horas). Você tem direito a reacomodação, remarcação sem custo ou reembolso integral, além de hospedagem e transporte se necessário."
    elif delay_minutes >= 120:
        rights.update(communication=True, food=True)
        assistance_level = "food"
        rule_applied = "ANAC_RES400_DELAY_2H"
        allowed_actions.extend(["issue_voucher_meal", "inform_update"])
        customer_message = f"Seu voo está com atraso de {delay_minutes} minutos. Você tem direito a alimentação — podemos gerar um voucher digital no iFood ou você pode procurar o balcão da Papagaio Fly para ver os restaurantes credenciados."
    elif delay_minutes >= 60:
        rights["communication"] = True
        assistance_level = "communication"
        rule_applied = "ANAC_RES400_DELAY_1H"
        allowed_actions.append("inform_update")
        customer_message = f"Seu voo está com atraso de {delay_minutes} minutos. Você tem direito a meios de comunicação (internet/telefone)."
    elif delay_minutes > 0:
        rule_applied = "ANAC_RES400_DELAY_MINOR"
        allowed_actions.append("inform_update")
        customer_message = f"Seu voo está com um pequeno atraso de {delay_minutes} minutos. Estamos acompanhando e informamos qualquer atualização."

    decision = "flight_cancelled" if is_cancelled else "denied_boarding" if is_overbooking else "flight_delayed" if delay_minutes > 0 else "on_time"

    return {
        "decision": decision,
        "allowedActions": allowed_actions,
        "blockedActions": blocked_actions,
        "rights": rights,
        "assistanceLevel": assistance_level,
        "evidence": {"delayMinutes": delay_minutes, "isCancelled": is_cancelled, "isOverbooking": is_overbooking},
        "ruleApplied": rule_applied,
        "customerMessage": customer_message,
    }


def evaluate_refund_eligibility(fare_rules: dict, disruption_type: str, ticket_amount: float) -> dict:
    if disruption_type == "involuntary":
        return {
            "allowed": True,
            "reason": "Reembolso integral autorizado por IROP (cancelamento/atraso >4h/preterição). Nossa política prevalece sobre regras tarifárias.",
            "alternativeActions": ["reaccommodate", "reschedule", "issue_flight_credit"],
            "ruleApplied": "ANAC_IROP_REFUND",
            "refundAmount": ticket_amount,
            "penaltyAmount": 0,
        }

    if fare_rules.get("refundable"):
        penalty = fare_rules.get("cancel_fee", 0)
        return {
            "allowed": True,
            "reason": f"Tarifa {fare_rules.get('fare_family', 'unknown').upper()} é reembolsável. Multa de R$ {penalty:.2f}.",
            "alternativeActions": ["issue_flight_credit"],
            "ruleApplied": "FARE_RULE_REFUNDABLE",
            "refundAmount": ticket_amount - penalty,
            "penaltyAmount": penalty,
        }

    alternatives = []
    if fare_rules.get("voucher_allowed"):
        alternatives.append("issue_flight_credit")
    if fare_rules.get("change_fee", -1) >= 0:
        alternatives.append("reschedule")

    ff = fare_rules.get("fare_family", "unknown").upper()
    alt_msg = "Alternativas disponíveis: crédito de voo ou remarcação com taxa." if alternatives else "Nenhuma alternativa disponível."
    return {
        "allowed": False,
        "reason": f"Tarifa {ff} NÃO é reembolsável. {alt_msg}",
        "alternativeActions": alternatives,
        "ruleApplied": "FARE_RULE_NON_REFUNDABLE",
        "refundAmount": 0,
        "penaltyAmount": ticket_amount,
    }


def evaluate_baggage_rights(is_domestic: bool, days_missing: int) -> dict:
    max_days = 7 if is_domestic else 21
    is_lost = days_missing >= max_days

    return {
        "status": "lost" if is_lost else "missing",
        "maxDays": max_days,
        "daysMissing": days_missing,
        "daysRemaining": max(0, max_days - days_missing),
        "isLost": is_lost,
        "rights": {
            "tracking": True,
            "emergencyKit": days_missing >= 1,
            "compensation": is_lost,
            "delivery": not is_lost,
        },
        "ruleApplied": "ANAC_BAGGAGE_LOST" if is_lost else "ANAC_BAGGAGE_TRACKING",
        "customerMessage": (
            f"Sua bagagem ultrapassou o prazo legal de {max_days} dias e é considerada perdida. Você tem direito a indenização."
            if is_lost
            else f"Sua bagagem está em rastreamento ativo (dia {days_missing} de {max_days}). Estamos trabalhando para localizá-la."
        ),
    }


def calculate_assistance_vouchers(delay_minutes: int, is_domestic: bool) -> dict:
    vouchers = []
    if delay_minutes >= 120:
        vouchers.append({
            "type": "meal",
            "amount": 30 if is_domestic else 50,
            "description": "Voucher alimentação",
            "options": [
                {"channel": "ifood", "label": "Voucher iFood", "description": "Receba um código digital para usar no app iFood"},
                {"channel": "counter", "label": "Balcão Papagaio Fly", "description": "Dirija-se ao balcão para retirar voucher físico e ver restaurantes credenciados"},
            ],
        })
    if delay_minutes >= 240:
        vouchers.append({"type": "hotel", "amount": 200 if is_domestic else 350, "description": "Hospedagem (se pernoite)"})
        vouchers.append({"type": "transport", "amount": 60 if is_domestic else 100, "description": "Transporte aeroporto ↔ hotel"})

    return {"vouchers": vouchers, "totalCost": sum(v["amount"] for v in vouchers)}


def prioritize_resolution(context: dict) -> list[str]:
    if context.get("disruptionType") == "involuntary":
        priority = ["reaccommodate", "reschedule", "issue_flight_credit"]
        if context.get("loyaltyTier") in ("diamond", "platinum"):
            priority.append("refund")
        else:
            priority.extend(["issue_voucher", "refund"])
        return priority

    if context.get("fareFamily") == "light":
        return ["inform_no_refund"]
    return ["issue_flight_credit", "reschedule", "refund"]
