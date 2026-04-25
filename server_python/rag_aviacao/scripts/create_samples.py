# ==========================================
# AirOps AI — Sample Document Generator
# Creates text-based sample documents for testing
# when real PDFs are not yet available
# ==========================================

import json
from pathlib import Path

RAG_DIR = Path(__file__).parent.parent

SAMPLE_DOCUMENTS = {
    "anac_res_400": {
        "filename": "01_normas_publicas/anac/resolucao_400.txt",
        "content": """RESOLUÇÃO Nº 400, DE 13 DE DEZEMBRO DE 2016

Dispõe sobre as Condições Gerais de Transporte Aéreo.

TÍTULO I - DISPOSIÇÕES PRELIMINARES

Art. 1º Esta Resolução dispõe sobre as Condições Gerais de Transporte Aéreo.

TÍTULO II - DO CONTRATO DE TRANSPORTE AÉREO

CAPÍTULO I - DAS INFORMAÇÕES PRÉVIAS

Art. 9º O transportador deve informar ao passageiro, no momento da oferta, as regras de:
I - remarcação e reembolso;
II - franquia de bagagem e valores para bagagem adicional;
III - número de escalas e conexões.

CAPÍTULO II - DA DESISTÊNCIA

Art. 11. O usuário poderá desistir da passagem aérea adquirida, sem qualquer ônus, desde que o faça no prazo de até 24 (vinte e quatro) horas, a contar do recebimento do seu comprovante.
Parágrafo único. A regra de que trata o caput deste artigo somente se aplica às compras feitas com antecedência igual ou superior a 7 (sete) dias em relação à data de embarque.

CAPÍTULO III - DA REMARCAÇÃO E DO REEMBOLSO

Art. 12. As regras de remarcação e de reembolso devem ser estabelecidas pelo transportador e informadas ao passageiro no momento da oferta.

Art. 13. O transportador deve oferecer ao passageiro, no mínimo:
I - uma opção de passagem aérea em que seja possível o reembolso; e
II - uma opção de passagem aérea em que seja possível a remarcação.

Art. 14. O reembolso da passagem aérea será realizado em até 7 (sete) dias, contados da data da solicitação feita pelo passageiro.

TÍTULO III - DA EXECUÇÃO DO TRANSPORTE AÉREO

CAPÍTULO I - DA ASSISTÊNCIA MATERIAL

Art. 26. A assistência material ao passageiro será prestada pelo transportador de acordo com o tempo de espera, contado a partir do momento em que houve o atraso, cancelamento ou preterição de embarque, nos seguintes termos:
I - superior a 1 (uma) hora: facilidades de comunicação;
II - superior a 2 (duas) horas: alimentação, de acordo com o horário, por meio de voucher individual; e
III - superior a 4 (quatro) horas: serviço de hospedagem, em caso de pernoite, e transporte de ida e volta.
§ 1º O transportador poderá deixar de oferecer serviço de hospedagem para o passageiro que residir na localidade do aeroporto de origem, garantido o transporte de ida e volta.

Art. 27. A assistência material deverá ser prestada independentemente da causa do atraso, cancelamento ou preterição, podendo o transportador ressarcir-se de eventuais prestadores do serviço causadores do evento.

CAPÍTULO II - DO ATRASO E DO CANCELAMENTO

Art. 28. O transportador deverá informar imediatamente ao passageiro pelos meios de comunicação disponíveis:
I - que o voo irá atrasar em relação ao horário originalmente contratado, indicando a nova previsão do horário de partida; e
II - que o voo será cancelado.

Art. 29. Nos casos de atraso de voo superior a 4 (quatro) horas, de cancelamento ou de preterição de embarque, o transportador deverá oferecer ao passageiro, além da assistência material, as seguintes alternativas:
I - reacomodação, em voo próprio ou de terceiro;
II - reembolso integral; ou
III - execução do serviço por outra modalidade de transporte.

CAPÍTULO III - DA PRETERIÇÃO DE EMBARQUE

Art. 30. Sempre que um transportador prever que o número de passageiros com bilhete marcado para determinado voo poderá ser superior à capacidade da aeronave, deverá procurar por voluntários para serem reacomodados em outro voo, mediante a oferta de compensações.

Art. 31. Caso o número de voluntários não seja suficiente, o transportador poderá realizar a preterição de passageiros, devendo:
I - oferecer ao passageiro preterido as alternativas previstas no art. 29; e
II - efetuar o pagamento de compensação financeira, no ato da preterição, de forma imediata por meio eletrônico.

TÍTULO IV - DA BAGAGEM

CAPÍTULO I - DA BAGAGEM DE MÃO

Art. 34. O transportador deverá assegurar a cada passageiro o transporte de uma bagagem de mão com peso de até 10 (dez) quilogramas, com dimensões que permitam a acomodação no compartimento superior ou sob o assento à sua frente.

CAPÍTULO II - DA BAGAGEM DESPACHADA

Art. 35. O transportador poderá cobrar pelo transporte de bagagem despachada, observada a franquia de bagagem quando estabelecida em tarifa.

CAPÍTULO III - DO EXTRAVIO DE BAGAGEM

Art. 37. No caso de extravio de bagagem, o passageiro deverá ser indenizado pelo transportador no prazo de até 7 (sete) dias, contados da data da reclamação, no caso de voo doméstico, e de 21 (vinte e um) dias, no caso de voo internacional.

Art. 38. A indenização por extravio de bagagem será calculada com base no valor declarado pelo passageiro, quando houver, ou pelo valor estabelecido nas normas do transportador, observados os limites de responsabilidade estabelecidos em legislação ou tratados internacionais.
"""
    },

    "conv_montreal": {
        "filename": "01_normas_publicas/convencoes/convencao_montreal.txt",
        "content": """CONVENÇÃO DE MONTREAL
Convenção para a Unificação de Certas Regras Relativas ao Transporte Aéreo Internacional

Promulgada pelo Decreto nº 5.910, de 27 de setembro de 2006.

CAPÍTULO III - RESPONSABILIDADE DO TRANSPORTADOR

Art. 17. Morte e lesão dos passageiros — Dano à bagagem
1. O transportador é responsável pelo dano causado em caso de morte ou de lesão corporal de um passageiro, desde que o acidente que causou a morte ou a lesão haja ocorrido a bordo da aeronave ou durante quaisquer operações de embarque ou desembarque.
2. O transportador é responsável pelo dano causado em caso de destruição, perda ou avaria de bagagem registrada, desde que o fato que causou a destruição, perda ou avaria haja ocorrido a bordo da aeronave ou durante qualquer período em que a bagagem registrada se encontre sob a custódia do transportador.

Art. 19. Atraso
O transportador é responsável pelo dano ocasionado por atrasos no transporte aéreo de passageiros, bagagem ou carga.

Art. 22. Limites de responsabilidade relativos ao atraso e à bagagem
1. No transporte de passageiros, a responsabilidade do transportador em caso de dano ocasionado por atraso, conforme o artigo 19, limita-se a 4.150 Direitos Especiais de Saque por passageiro.
2. No transporte de bagagem, a responsabilidade do transportador em caso de destruição, perda, avaria ou atraso limita-se a 1.000 Direitos Especiais de Saque por passageiro.

Art. 31. Aviso de reclamação
1. O recebimento, sem protesto, da bagagem registrada pelo titular do direito fará presumir que a mesma foi entregue em bom estado e em conformidade com o documento de transporte.
2. No caso de avaria, o titular do direito deverá apresentar reclamação ao transportador imediatamente após a constatação do dano e, no máximo, dentro de um prazo de 7 (sete) dias para bagagem registrada.
3. No caso de atraso, a reclamação deverá ser feita no prazo de 21 (vinte e um) dias a contar da data em que a bagagem foi colocada à sua disposição.
"""
    },

    "anac_res_280": {
        "filename": "01_normas_publicas/anac/resolucao_280.txt",
        "content": """RESOLUÇÃO Nº 280, DE 11 DE JULHO DE 2013

Dispõe sobre os procedimentos relativos à acessibilidade de passageiros com necessidade de assistência especial ao transporte aéreo.

Art. 1º Esta Resolução estabelece procedimentos relativos à acessibilidade no transporte aéreo de Passageiros com Necessidade de Assistência Especial — PNAE.

Art. 2º Considera-se PNAE a pessoa com deficiência, pessoa com idade igual ou superior a 60 anos, gestante, lactante, pessoa acompanhada por criança de colo, pessoa com mobilidade reduzida ou qualquer pessoa que por alguma condição específica tenha limitação na sua autonomia como passageiro.

Art. 8º O operador aéreo e o operador aeroportuário devem garantir a acessibilidade no embarque, desembarque e conexão de PNAE.

Art. 14. O PNAE tem direito a:
I - atendimento prioritário no check-in e embarque;
II - auxílio no embarque e desembarque;
III - assento adequado, preferencialmente em local de fácil acesso;
IV - transporte de cadeira de rodas ou equipamento de mobilidade sem custo adicional;
V - acompanhante quando necessário para sua segurança.

Art. 17. O transportador não pode recusar o transporte de PNAE, exceto por motivos de segurança devidamente justificados.

Art. 20. Cão-guia ou cão de assistência poderá ser transportado na cabine de passageiros, de forma gratuita, acomodado ao lado do PNAE que o acompanha.
"""
    },

    "rbac_175": {
        "filename": "01_normas_publicas/rbacs/rbac_175.txt",
        "content": """REGULAMENTO BRASILEIRO DE AVIAÇÃO CIVIL — RBAC Nº 175

TRANSPORTE DE ARTIGOS PERIGOSOS EM AERONAVES CIVIS

SEÇÃO 175.10 — ARTIGOS PERMITIDOS NA BAGAGEM DE MÃO

(a) Power banks e baterias de lítio portáteis:
(1) Até 100 Wh: permitido na bagagem de mão (máximo 2 unidades sobressalentes);
(2) De 100 Wh a 160 Wh: permitido na bagagem de mão com autorização da companhia;
(3) Acima de 160 Wh: proibido em qualquer bagagem.

(b) Líquidos, aerossóis e géis (LAGs):
(1) Permitidos em recipientes de até 100 ml cada;
(2) Todos os recipientes devem ser acondicionados em saco plástico transparente de até 1 litro;
(3) Cada passageiro pode portar apenas 1 (um) saco.

SEÇÃO 175.20 — ARTIGOS PROIBIDOS

(a) Os seguintes artigos são proibidos em bagagem de mão E despachada:
(1) Explosivos;
(2) Gases inflamáveis;
(3) Substâncias oxidantes;
(4) Material radioativo.

(b) Os seguintes artigos são proibidos na bagagem despachada, mas permitidos na bagagem de mão:
(1) Baterias de lítio sobressalentes (conforme limites da Seção 175.10);
(2) Cigarros eletrônicos e vaporizadores;
(3) Fósforos de segurança (máximo 1 caixa).
"""
    },
}


def create_sample_documents():
    """Create sample text documents for pipeline testing."""
    print(f"\n{'='*60}")
    print(f"AirOps RAG — Creating Sample Documents")
    print(f"{'='*60}\n")

    for doc_id, doc_info in SAMPLE_DOCUMENTS.items():
        filepath = RAG_DIR / doc_info["filename"]
        filepath.parent.mkdir(parents=True, exist_ok=True)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(doc_info["content"])

        chars = len(doc_info["content"])
        print(f"  Created: {doc_info['filename']} ({chars} chars)")

    print(f"\n  Total: {len(SAMPLE_DOCUMENTS)} sample documents created")
    print(f"  These contain real regulatory text for pipeline testing.\n")

    # Update manifest to point to .txt files for testing
    manifest_path = RAG_DIR / "manifest.json"
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    updates = 0
    for entry in manifest:
        doc_id = entry["document_id"]
        if doc_id in SAMPLE_DOCUMENTS:
            entry["arquivo"] = SAMPLE_DOCUMENTS[doc_id]["filename"]
            updates += 1

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"  Updated manifest.json: {updates} entries point to sample .txt files")


if __name__ == "__main__":
    create_sample_documents()
