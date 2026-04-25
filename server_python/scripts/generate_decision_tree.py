import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# Load environment
base_dir = Path(__file__).resolve().parent.parent
load_dotenv(base_dir / '.env')

client = OpenAI()
if not client.api_key:
    print("Erro: OPENAI_API_KEY não encontrada no .env")
    sys.exit(1)

MODEL = os.getenv("OPENAI_AGENT_MODEL", "gpt-4o")
MAX_ITERATIONS = 4

# ─────────────────────────────────────────────
# Fictional Platform Integrations (context for the LLM)
# ─────────────────────────────────────────────
PLATFORM_CONTEXT = """
PLATAFORMAS INTERNAS DA PAPAGAIO FLY (fictícias, mas realistas):
Cada cenário DEVE indicar quais plataformas são acionadas no campo "platform_integrations".

1. **FlyRefund** — Sistema de reembolso. Processa devoluções via Pix (até 3 dias úteis) ou estorno em cartão de crédito (próxima fatura). O passageiro acessa pelo app na aba "Meus Estornos" e cadastra dados bancários.
2. **FlyVoucher** — Emissão de vouchers digitais. Gera QR codes para alimentação (R$50 por refeição), transporte (R$30) e comunicação (R$15 de crédito celular).
3. **FlyHotel** — Reserva de hospedagem emergencial. Integra com rede hoteleira conveniada para acomodação em caso de pernoite por atraso/cancelamento. Inclui traslado aeroporto-hotel.
4. **FlyRebook** — Motor de remarcação. Busca automaticamente voos alternativos da Papagaio Fly e companhias parceiras (codeshare).
5. **FlyBag** — Rastreamento de bagagem. Abre PIR (Property Irregularity Report), rastreia via sistema WorldTracer e coordena entrega no endereço do passageiro.
6. **FlyInsure** — Seguro viagem e indenizações. Processa claims para bagagem perdida/danificada, atrasos longos e situações médicas.
7. **FlyCare** — Assistência especial. Coordena cadeiras de rodas, oxigênio, menores desacompanhados, gestantes e PNE.
8. **FlyAlert** — Sistema de alertas e notificações. Envia SMS, push e e-mail sobre mudanças de status de voo, gate, embarque.
9. **FlyCompliance** — Registro regulatório. Documenta todas as ações para compliance ANAC e gera relatórios de auditoria.
10. **FlyFraud** — Detecção de fraude. Analisa padrões suspeitos de reembolso, identidades e tentativas de manipulação.
"""

# ─────────────────────────────────────────────
# Prompts
# ─────────────────────────────────────────────
BRAINSTORM_PROMPT = f"""Você é o Head de Customer Service da Papagaio Fly (companhia aérea fictícia operando no Brasil sob regras da ANAC).
Mapeie TODAS as possíveis categorias de contato de passageiros com o SAC.
Seja EXAUSTIVO. Inclua situações comuns E raras.

OBRIGATÓRIAS (não omita nenhuma):
- Cancelamentos e No-Show
- Atrasos e Conexões Perdidas
- Bagagem (extravio, dano, furto, excesso)
- Reembolsos (Pix, cartão, voucher)
- Alterações de Voo e Remarcação
- Check-in e Embarque
- Overbooking e Preterição
- Assistência Especial (PNE, menor desacompanhado, gestante, pet, animal de serviço)
- Programa de Fidelidade e Milhas
- Emergências (desastres naturais, incidentes de segurança, emergência médica a bordo)
- Reclamações e Ouvidoria
- Documentação e Imigração (vistos, passaportes)

Liste PELO MENOS 12 categorias.
Retorne EXATAMENTE um JSON:
{{
  "categories": ["Categoria 1", "Categoria 2", ...]
}}
"""

ARCHITECT_PROMPT = f"""Você é o Arquiteto de Processos SAC da Papagaio Fly.
Mapeie a árvore de decisão COMPLETA para a categoria: '{{category}}'.

{PLATFORM_CONTEXT}

DIRETRIZES:
1. Regras da ANAC (Res. 400) aplicam-se estritamente.
2. Cada cenário DEVE ter instruções em INGLÊS para passageiros estrangeiros viajando no Brasil.
3. Cada cenário DEVE listar as plataformas internas acionadas (FlyRefund, FlyVoucher, etc.).
4. Defina claramente quando a IA resolve vs. quando escala para humano.
5. Mapeie pelo menos 4-6 cenários por categoria (comum + edge cases).

Retorne EXATAMENTE no formato JSON:
{{
  "category": "{{category}}",
  "nodes": [
    {{
      "scenario": "Nome do Cenário",
      "ai_resolution_steps": ["Passo 1", "Passo 2"],
      "english_guidance": "Instruções em inglês para estrangeiros",
      "platform_integrations": ["FlyRefund", "FlyAlert"],
      "escalate_to_human": false,
      "escalation_reason": null
    }}
  ]
}}
"""

CRITIC_PROMPT = """Você é o Auditor de Qualidade e Compliance da Papagaio Fly.
Revise o seguinte fluxo para a categoria: '{category}'.

FLUXO A REVISAR:
{workflow}

Verifique:
1. Fere regras da ANAC (Res. 400)?
2. Faltou orientação em inglês para estrangeiros?
3. Faltou indicar plataformas internas (FlyRefund, FlyVoucher, FlyHotel, etc.)?
4. Faltou algum cenário óbvio ou edge case crítico?
5. A resolução da IA está engessada/chatbot? (Deveria ser empática e resolutiva.)

Se houver problemas, retorne feedback detalhado do que precisa ser alterado.
Se estiver perfeito, retorne a palavra exata: APROVADO.
"""


def generate_decision_tree():
    print(f"🚀 Iniciando Geração EXPANDIDA da Árvore de Decisão com {MODEL}...")
    
    # 1. Brainstorm Categories
    print("🧠 [Agente 1] Fazendo Brainstorming Exaustivo das Categorias...")
    res = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": BRAINSTORM_PROMPT}],
        response_format={"type": "json_object"}
    )
    categories = json.loads(res.choices[0].message.content)["categories"]
    print(f"✅ {len(categories)} Categorias geradas: {categories}\n")

    decision_tree = {"scenarios": [], "platform_registry": {
        "FlyRefund": {"name": "FlyRefund", "type": "Reembolso", "description": "Sistema de reembolso via Pix ou estorno cartão"},
        "FlyVoucher": {"name": "FlyVoucher", "type": "Voucher", "description": "Emissão de vouchers digitais (alimentação, transporte, comunicação)"},
        "FlyHotel": {"name": "FlyHotel", "type": "Hospedagem", "description": "Reserva de hospedagem emergencial com traslado"},
        "FlyRebook": {"name": "FlyRebook", "type": "Remarcação", "description": "Motor de remarcação automática de voos"},
        "FlyBag": {"name": "FlyBag", "type": "Bagagem", "description": "Rastreamento e entrega de bagagem (WorldTracer)"},
        "FlyInsure": {"name": "FlyInsure", "type": "Seguro", "description": "Seguro viagem, indenizações e claims"},
        "FlyCare": {"name": "FlyCare", "type": "Assistência", "description": "Assistência especial (PNE, menor, gestante, pet)"},
        "FlyAlert": {"name": "FlyAlert", "type": "Notificação", "description": "Alertas SMS, push e e-mail sobre status de voo"},
        "FlyCompliance": {"name": "FlyCompliance", "type": "Compliance", "description": "Registro regulatório e auditoria ANAC"},
        "FlyFraud": {"name": "FlyFraud", "type": "Fraude", "description": "Detecção de fraude e padrões suspeitos"},
    }}

    # 2. Iterate through categories with Architect + Critic loop
    for idx, cat in enumerate(categories):
        print(f"\n🏗️ [{idx+1}/{len(categories)}] Arquitetando Fluxo para: {cat}")
        
        current_workflow_json = ""
        is_approved = False
        
        prompt = ARCHITECT_PROMPT.replace("{category}", cat)
        messages = [{"role": "system", "content": prompt}]
        
        for iteration in range(MAX_ITERATIONS):
            res_arch = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                response_format={"type": "json_object"}
            )
            current_workflow_json = res_arch.choices[0].message.content
            
            # Critic Review
            critic_prompt = CRITIC_PROMPT.replace("{category}", cat).replace("{workflow}", current_workflow_json)
            print(f"   🔍 [Agente 3] Revisando iteração {iteration + 1}/{MAX_ITERATIONS}...")
            res_critic = client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": critic_prompt}]
            )
            feedback = res_critic.choices[0].message.content.strip()
            
            if "APROVADO" in feedback.upper():
                print("   ✅ Fluxo Aprovado pelo Crítico!")
                is_approved = True
                break
            else:
                print("   ❌ Crítico encontrou falhas. Refinando...")
                messages.append({"role": "assistant", "content": current_workflow_json})
                messages.append({"role": "user", "content": f"O Auditor rejeitou o fluxo com o seguinte feedback:\n{feedback}\nCorrija a árvore e retorne o JSON novamente atualizado."})
        
        if not is_approved:
            print("   ⚠️ Limite de iterações atingido. Salvando última versão.")
            
        try:
            parsed = json.loads(current_workflow_json)
            # Ensure platform_integrations field exists on all nodes
            for node in parsed.get("nodes", []):
                if "platform_integrations" not in node:
                    node["platform_integrations"] = []
            decision_tree["scenarios"].append(parsed)
        except json.JSONDecodeError:
            print(f"   ⛔ Erro ao parsear JSON para {cat}. Pulando.")

    # 3. Save Outputs
    data_dir = base_dir / 'data'
    data_dir.mkdir(exist_ok=True)
    
    json_path = data_dir / 'decision_tree.json'
    md_path = data_dir / 'decision_tree.md'
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(decision_tree, f, indent=2, ensure_ascii=False)
        
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write("# Árvore de Decisão do SAC - Papagaio Fly\n\n")
        f.write("> Gerado automaticamente via Agentic Workflow com Validação de Compliance.\n\n")
        
        for cat in decision_tree["scenarios"]:
            f.write(f"## {cat['category']}\n\n")
            for node in cat["nodes"]:
                f.write(f"### Cenário: {node['scenario']}\n")
                f.write("**Passos de Resolução (IA):**\n")
                for i, step in enumerate(node['ai_resolution_steps'], 1):
                    f.write(f"{i}. {step}\n")
                
                platforms = node.get('platform_integrations', [])
                if platforms:
                    f.write(f"\n**🔌 Plataformas Acionadas:** {', '.join(platforms)}\n")
                
                f.write(f"\n**🌍 English Guidance (Para Estrangeiros):**\n")
                f.write(f"> {node['english_guidance']}\n\n")
                
                if node.get('escalate_to_human'):
                    f.write(f"⚠️ **ESCALAR PARA HUMANO**\n")
                    f.write(f"Motivo: {node.get('escalation_reason', 'N/A')}\n\n")
                f.write("---\n\n")

    total_scenarios = sum(len(c["nodes"]) for c in decision_tree["scenarios"])
    print(f"\n🎉 Árvore de Decisão EXPANDIDA gerada com sucesso!")
    print(f"   📊 {len(decision_tree['scenarios'])} categorias, {total_scenarios} cenários mapeados")
    print(f"   📄 Arquivos: {json_path} / {md_path}")

if __name__ == "__main__":
    generate_decision_tree()
