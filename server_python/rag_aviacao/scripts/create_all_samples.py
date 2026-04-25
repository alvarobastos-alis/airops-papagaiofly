# ==========================================
# AirOps AI — Full Sample Document Generator
# Creates all 18 regulatory documents for testing
# ==========================================

import json
from pathlib import Path

RAG_DIR = Path(__file__).parent.parent

SAMPLE_DOCUMENTS = {
    "anac_port_12307_animais": {
        "filename": "01_normas_publicas/anac/portaria_12307_animais.txt",
        "content": """PORTARIA ANAC Nº 12.307, DE 30 DE JUNHO DE 2023

Dispõe sobre o transporte de animais em aeronaves civis.

Art. 1º Esta Portaria regulamenta o transporte de animais domésticos em aeronaves utilizadas em serviços aéreos públicos.

CAPÍTULO I — TRANSPORTE NA CABINE

Art. 2º O transporte de animal doméstico de pequeno porte na cabine de passageiros é permitido, desde que:
I - o animal esteja acondicionado em caixa de transporte adequada;
II - o peso total (animal + caixa) não exceda 10 kg;
III - a caixa permaneça sob o assento à frente do passageiro durante todo o voo;
IV - o passageiro apresente atestado de saúde veterinário com validade de até 10 dias.

Art. 3º São considerados animais domésticos de pequeno porte para fins desta Portaria: cães, gatos, aves canoras e ornamentais, furões, coelhos e hamsters.

Art. 4º O número máximo de animais por voo será determinado pela empresa aérea, não podendo exceder 1 (um) animal por passageiro.

CAPÍTULO II — CÃO-GUIA E CÃO DE ASSISTÊNCIA

Art. 5º O transporte de cão-guia na cabine é gratuito e obrigatório, nos termos da Lei nº 11.126/2005.
§ 1º O cão-guia viaja ao lado do passageiro, sem necessidade de caixa de transporte.
§ 2º O passageiro deve apresentar carteira de identificação do cão-guia emitida por centro de treinamento credenciado.

Art. 6º O cão de assistência emocional NÃO se enquadra na categoria de cão-guia e está sujeito às regras gerais de transporte de animais na cabine.

CAPÍTULO III — TRANSPORTE NO PORÃO (CARGA VIVA)

Art. 7º O transporte de animais como carga viva no porão climatizado está sujeito a:
I - caixa de transporte certificada pela IATA;
II - atestado veterinário com validade de até 10 dias;
III - reserva prévia junto à empresa aérea;
IV - pagamento de tarifa específica.

Art. 8º Animais braquicefálicos (focinho curto) têm restrições adicionais:
I - proibido o transporte no porão em temperaturas acima de 30°C;
II - recomenda-se preferência pelo transporte em cabine quando possível.

CAPÍTULO IV — VOOS INTERNACIONAIS

Art. 9º Para voos internacionais, além dos requisitos desta Portaria, o passageiro deve:
I - obter Certificado Veterinário Internacional (CVI) emitido pelo MAPA;
II - verificar os requisitos do país de destino;
III - cumprir quarentena quando exigido pelo país de destino.
"""
    },

    "cba": {
        "filename": "01_normas_publicas/leis/cba.txt",
        "content": """CÓDIGO BRASILEIRO DE AERONÁUTICA
Lei nº 7.565, de 19 de dezembro de 1986

TÍTULO VIII — DO CONTRATO DE TRANSPORTE AÉREO

CAPÍTULO I — DISPOSIÇÕES GERAIS

Art. 222. Pelo contrato de transporte aéreo, obriga-se o empresário a transportar passageiro, bagagem, carga, encomenda ou mala postal, por meio de aeronave e mediante pagamento.

Art. 223. O contrato de transporte aéreo de passageiro compreende, acessoriamente, o de transporte de sua bagagem.

Art. 224. O transportador não poderá recusar o transporte de passageiro, salvo por motivo de saúde que ponha em risco os demais passageiros.

CAPÍTULO II — DO TRANSPORTE DE PASSAGEIROS

Art. 225. O transportador será responsável pelo atraso na execução do transporte contratado, sujeitando-se ao pagamento de indenização.

Art. 226. Em caso de cancelamento do voo por iniciativa do transportador, o passageiro terá direito a:
I - reembolso integral do valor pago;
II - reacomodação em outro voo;
III - execução do serviço por outra modalidade de transporte.

CAPÍTULO III — DA RESPONSABILIDADE

Art. 246. A responsabilidade do transportador, por danos ocorridos durante a execução do contrato de transporte, será regulada pelos limites estabelecidos neste Código.

Art. 257. A responsabilidade do transportador por dano a bagagem despachada está limitada ao valor declarado pelo passageiro ou, na falta de declaração, ao limite fixado pela autoridade aeronáutica.
"""
    },

    "cdc": {
        "filename": "01_normas_publicas/leis/cdc.txt",
        "content": """CÓDIGO DE DEFESA DO CONSUMIDOR
Lei nº 8.078, de 11 de setembro de 1990

CAPÍTULO III — DOS DIREITOS BÁSICOS DO CONSUMIDOR

Art. 6º São direitos básicos do consumidor:
I - a proteção da vida, saúde e segurança contra os riscos provocados por práticas no fornecimento de produtos e serviços;
II - a educação e divulgação sobre o consumo adequado dos produtos e serviços;
III - a informação adequada e clara sobre os diferentes produtos e serviços, com especificação correta de quantidade, características, composição, qualidade, tributos incidentes e preço, bem como sobre os riscos que apresentem;
IV - a proteção contra a publicidade enganosa e abusiva;
VI - a efetiva prevenção e reparação de danos patrimoniais e morais, individuais, coletivos e difusos;
VIII - a facilitação da defesa de seus direitos.

CAPÍTULO IV — DA QUALIDADE DE PRODUTOS E SERVIÇOS

Art. 14. O fornecedor de serviços responde, independentemente da existência de culpa, pela reparação dos danos causados aos consumidores por defeitos relativos à prestação dos serviços.
§ 1º O serviço é defeituoso quando não fornece a segurança que o consumidor dele pode esperar.

Art. 20. O fornecedor de serviços responde pelos vícios de qualidade que os tornem impróprios ao consumo ou lhes diminuam o valor.

CAPÍTULO V — DA PROTEÇÃO CONTRATUAL

Art. 49. O consumidor pode desistir do contrato, no prazo de 7 dias a contar de sua assinatura ou do ato de recebimento do produto ou serviço, sempre que a contratação de fornecimento de produtos e serviços ocorrer fora do estabelecimento comercial, especialmente por telefone ou a domicílio.
Parágrafo único. Se o consumidor exercitar o direito de arrependimento previsto neste artigo, os valores eventualmente pagos, a qualquer título, durante o prazo de reflexão, serão devolvidos, de imediato, monetariamente atualizados.

Art. 51. São nulas de pleno direito as cláusulas contratuais que:
IV - estabeleçam obrigações consideradas iníquas, abusivas;
XV - estejam em desacordo com o sistema de proteção ao consumidor.
"""
    },

    "lgpd": {
        "filename": "01_normas_publicas/leis/lgpd.txt",
        "content": """LEI GERAL DE PROTEÇÃO DE DADOS PESSOAIS
Lei nº 13.709, de 14 de agosto de 2018

CAPÍTULO I — DISPOSIÇÕES PRELIMINARES

Art. 1º Esta Lei dispõe sobre o tratamento de dados pessoais, inclusive nos meios digitais, com o objetivo de proteger os direitos fundamentais de liberdade e de privacidade.

Art. 2º A disciplina da proteção de dados pessoais tem como fundamentos:
I - o respeito à privacidade;
II - a autodeterminação informativa;
III - a liberdade de expressão, de informação, de comunicação e de opinião;
VII - os direitos humanos, o livre desenvolvimento da personalidade, a dignidade e o exercício da cidadania.

CAPÍTULO II — DO TRATAMENTO DE DADOS PESSOAIS

Art. 7º O tratamento de dados pessoais somente poderá ser realizado nas seguintes hipóteses:
I - mediante o fornecimento de consentimento pelo titular;
V - quando necessário para a execução de contrato ou de procedimentos preliminares relacionados a contrato do qual seja parte o titular;
IX - quando necessário para atender aos interesses legítimos do controlador ou de terceiro.

Art. 11. O tratamento de dados pessoais sensíveis somente poderá ocorrer nas seguintes hipóteses:
I - quando o titular ou seu responsável legal consentir, de forma específica e destacada;
II - sem fornecimento de consentimento do titular, nas hipóteses em que for indispensável para cumprimento de obrigação legal.

CAPÍTULO III — DIREITOS DO TITULAR

Art. 18. O titular dos dados pessoais tem direito a obter do controlador, em relação aos dados do titular por ele tratados, a qualquer momento e mediante requisição:
I - confirmação da existência de tratamento;
II - acesso aos dados;
III - correção de dados incompletos, inexatos ou desatualizados;
VI - eliminação dos dados pessoais tratados com o consentimento do titular.
"""
    },

    "decreto_sac_11034": {
        "filename": "01_normas_publicas/decretos/decreto_sac_11034.txt",
        "content": """DECRETO Nº 11.034, DE 5 DE ABRIL DE 2022

Regulamenta o Serviço de Atendimento ao Consumidor — SAC.

Art. 1º Este Decreto regulamenta o SAC dos fornecedores de serviços regulados pelo Governo Federal.

CAPÍTULO I — DO ACESSO AO SAC

Art. 4º O SAC será disponibilizado de forma ininterrupta, durante 24 (vinte e quatro) horas por dia, nos 7 (sete) dias da semana.

Art. 5º O SAC deverá oferecer ao consumidor, no mínimo, os seguintes canais de atendimento:
I - telefone;
II - canal digital de atendimento.

Art. 6º O atendimento humano deverá estar disponível por, no mínimo, 8 (oito) horas por dia.

CAPÍTULO II — DOS PRAZOS

Art. 10. A demanda do consumidor será resolvida no prazo máximo de 7 (sete) dias corridos, contado do registro do atendimento.

Art. 11. O cancelamento de serviço solicitado pelo consumidor deverá ser efetivado imediatamente após a solicitação.

Art. 12. As reclamações deverão ser resolvidas no prazo máximo de 7 (sete) dias corridos.

CAPÍTULO III — DO REGISTRO E ACOMPANHAMENTO

Art. 14. O consumidor receberá registro numérico de protocolo no início do atendimento.

Art. 15. O consumidor poderá acompanhar o andamento de suas demandas pelos canais de atendimento disponíveis.

Art. 16. O histórico de atendimento deverá ser mantido por, no mínimo, 2 (dois) anos.
"""
    },

    "decreto_ecommerce_7962": {
        "filename": "01_normas_publicas/decretos/decreto_ecommerce_7962.txt",
        "content": """DECRETO Nº 7.962, DE 15 DE MARÇO DE 2013

Regulamenta a contratação no comércio eletrônico.

Art. 1º Este Decreto regulamenta a Lei nº 8.078/1990 (CDC) para dispor sobre a contratação no comércio eletrônico.

CAPÍTULO I — INFORMAÇÕES CLARAS

Art. 2º Os sítios eletrônicos ou demais meios eletrônicos utilizados para ofertas de compra coletiva ou modalidades análogas de contratação deverão conter, em destaque:
I - nome empresarial e número do CNPJ;
II - endereço físico e eletrônico;
III - características essenciais do produto ou serviço;
IV - discriminação, no preço, de quaisquer despesas adicionais;
V - condições integrais da oferta;
VI - prazo de validade da oferta.

CAPÍTULO II — DIREITO DE ARREPENDIMENTO

Art. 5º O fornecedor deve informar, de forma clara e ostensiva, os meios adequados e eficazes para o exercício do direito de arrependimento pelo consumidor.
§ 1º O consumidor poderá exercer seu direito de arrependimento pela mesma ferramenta utilizada para a contratação.
§ 2º O exercício do direito de arrependimento implica a rescisão dos contratos acessórios, sem qualquer ônus para o consumidor.
§ 3º O exercício do direito de arrependimento será comunicado imediatamente pelo fornecedor à instituição financeira ou administradora do cartão de crédito.
§ 4º O fornecedor deve enviar ao consumidor confirmação imediata do recebimento da manifestação de arrependimento.
"""
    },

    "rbac_91": {
        "filename": "01_normas_publicas/rbacs/rbac_91.txt",
        "content": """REGULAMENTO BRASILEIRO DE AVIAÇÃO CIVIL — RBAC Nº 91

REGRAS GERAIS DE OPERAÇÃO PARA AERONAVES CIVIS

SEÇÃO 91.1 — APLICABILIDADE

Este regulamento prescreve as regras que governam a operação de aeronaves civis no Brasil.

SEÇÃO 91.7 — AERONAVEGABILIDADE

Nenhuma pessoa pode operar uma aeronave civil a menos que a aeronave esteja em condições aeronavegáveis.

SEÇÃO 91.103 — PLANEJAMENTO DE VOO

Cada piloto em comando deve, antes de iniciar um voo, familiarizar-se com todas as informações disponíveis relacionadas ao voo, incluindo:
(a) condições meteorológicas;
(b) pistas e procedimentos de partida e chegada;
(c) alternativas disponíveis.

SEÇÃO 91.205 — EQUIPAMENTOS EXIGIDOS

Nenhuma pessoa pode operar uma aeronave civil a menos que possua os instrumentos e equipamentos exigidos por este regulamento.
"""
    },

    "rbac_119": {
        "filename": "01_normas_publicas/rbacs/rbac_119.txt",
        "content": """REGULAMENTO BRASILEIRO DE AVIAÇÃO CIVIL — RBAC Nº 119

CERTIFICAÇÃO DE OPERADORES AÉREOS

SEÇÃO 119.1 — APLICABILIDADE

Este regulamento estabelece os requisitos para obtenção de Certificado de Operador Aéreo (COA).

SEÇÃO 119.5 — TIPOS DE CERTIFICADOS

(a) Certificado de Homologação de Empresa de Transporte Aéreo (CHETA);
(b) Certificado de Operador Aéreo (COA).

SEÇÃO 119.39 — QUALIFICAÇÕES DO PESSOAL DE GERÊNCIA

Cada detentor de certificado deve ter pessoal de gerência qualificado, incluindo:
(a) um diretor de operações;
(b) um chefe de pilotos;
(c) um diretor de manutenção.
"""
    },

    "rbac_121": {
        "filename": "01_normas_publicas/rbacs/rbac_121.txt",
        "content": """REGULAMENTO BRASILEIRO DE AVIAÇÃO CIVIL — RBAC Nº 121

REQUISITOS OPERACIONAIS: OPERAÇÕES DOMÉSTICAS, DE BANDEIRA E SUPLEMENTARES

SEÇÃO 121.1 — APLICABILIDADE

Este regulamento prescreve os requisitos operacionais para operações de transporte aéreo público com aeronaves de grande porte.

SEÇÃO 121.135 — MANUAL DE OPERAÇÕES

Cada detentor de certificado deve preparar e manter atualizado um manual de operações.

SEÇÃO 121.391 — COMPOSIÇÃO DA TRIPULAÇÃO

A tripulação mínima de cabine para aeronaves com capacidade acima de 19 passageiros será de 1 comissário para cada 50 assentos.

SEÇÃO 121.571 — INFORMAÇÕES AOS PASSAGEIROS

O comandante deve assegurar que os passageiros sejam informados sobre:
(a) procedimentos de emergência e uso dos cintos de segurança;
(b) localização das saídas de emergência;
(c) uso de dispositivos de flutuação, quando aplicável.
"""
    },

    "rbac_129": {
        "filename": "01_normas_publicas/rbacs/rbac_129.txt",
        "content": """REGULAMENTO BRASILEIRO DE AVIAÇÃO CIVIL — RBAC Nº 129

OPERAÇÕES DE EMPRESAS ESTRANGEIRAS

SEÇÃO 129.1 — APLICABILIDADE

Este regulamento prescreve os requisitos para operações de empresas estrangeiras de transporte aéreo no Brasil.

SEÇÃO 129.7 — AUTORIZAÇÃO DE OPERAÇÃO

Nenhuma empresa estrangeira pode operar voos para, de, ou dentro do Brasil sem autorização específica da ANAC.

SEÇÃO 129.11 — CODESHARE

(a) Acordos de codeshare entre empresas brasileiras e estrangeiras devem ser aprovados pela ANAC.
(b) O passageiro deve ser informado sobre qual empresa operará efetivamente o voo.
(c) A responsabilidade perante o passageiro é da empresa que vendeu o bilhete.
"""
    },

    "rbac_135": {
        "filename": "01_normas_publicas/rbacs/rbac_135.txt",
        "content": """REGULAMENTO BRASILEIRO DE AVIAÇÃO CIVIL — RBAC Nº 135

OPERAÇÕES COMPLEMENTARES E SOB DEMANDA

SEÇÃO 135.1 — APLICABILIDADE

Este regulamento prescreve os requisitos operacionais para serviços aéreos complementares e sob demanda (táxi aéreo e fretamento).

SEÇÃO 135.243 — LIMITAÇÕES OPERACIONAIS

(a) O táxi aéreo opera sob demanda, sem horários regulares pré-definidos;
(b) Fretamento requer contrato específico entre as partes;
(c) Os direitos do passageiro previstos na Resolução 400/2016 se aplicam, no que couber.

SEÇÃO 135.267 — INFORMAÇÕES AO PASSAGEIRO

O operador deve informar ao passageiro, antes do voo:
(a) tipo de aeronave;
(b) limitações de peso e bagagem;
(c) condições meteorológicas previstas;
(d) procedimentos de segurança.
"""
    },

    "emenda_rbac_107": {
        "filename": "01_normas_publicas/rbacs/emenda_rbac_107.txt",
        "content": """REGULAMENTO BRASILEIRO DE AVIAÇÃO CIVIL — RBAC Nº 107

SEGURANÇA DA AVIAÇÃO CIVIL CONTRA ATOS DE INTERFERÊNCIA ILÍCITA (AVSEC)

SEÇÃO 107.1 — OBJETIVO

Estabelecer requisitos de segurança da aviação civil contra atos de interferência ilícita.

SEÇÃO 107.11 — INSPEÇÃO DE SEGURANÇA

(a) Todo passageiro deve submeter-se à inspeção de segurança antes de acessar a área restrita de segurança;
(b) Bagagens de mão e despachadas devem ser inspecionadas;
(c) Itens proibidos detectados durante a inspeção devem ser retidos.

SEÇÃO 107.13 — ITENS PROIBIDOS NA CABINE

São proibidos na cabine de passageiros:
(a) armas de fogo de qualquer tipo;
(b) objetos cortantes ou perfurantes com lâmina superior a 6 cm;
(c) ferramentas com comprimento superior a 7 cm;
(d) substâncias químicas perigosas.

SEÇÃO 107.21 — CONTROLE DE ACESSO

O acesso às áreas restritas de segurança dos aeroportos é controlado por credencial aeroportuária.
"""
    },

    "emenda_rbac_108": {
        "filename": "01_normas_publicas/rbacs/emenda_rbac_108.txt",
        "content": """REGULAMENTO BRASILEIRO DE AVIAÇÃO CIVIL — RBAC Nº 108

SEGURANÇA EM AERÓDROMOS

SEÇÃO 108.1 — OBJETIVO

Estabelecer requisitos de segurança para os operadores de aeródromos.

SEÇÃO 108.5 — PROGRAMA DE SEGURANÇA

Cada operador de aeródromo deve implementar e manter um Programa de Segurança Aeroportuária (PSA).

SEÇÃO 108.9 — ÁREAS DE SEGURANÇA

O aeródromo deve possuir as seguintes áreas demarcadas:
(a) Área pública — acesso livre;
(b) Área restrita de segurança — acesso controlado;
(c) Área de manobras — acesso exclusivo a pessoal autorizado.

SEÇÃO 108.15 — EQUIPAMENTOS DE SEGURANÇA

O operador deve disponibilizar, no mínimo:
(a) equipamentos de raios-X para inspeção de bagagem;
(b) pórticos detectores de metal;
(c) detectores de traços de explosivos, quando requerido.
"""
    },

    "emenda_rbac_110": {
        "filename": "01_normas_publicas/rbacs/emenda_rbac_110.txt",
        "content": """REGULAMENTO BRASILEIRO DE AVIAÇÃO CIVIL — RBAC Nº 110

REQUISITOS DE SEGURANÇA PARA OPERADORES AÉREOS

SEÇÃO 110.1 — OBJETIVO

Estabelecer os requisitos de segurança que devem ser cumpridos pelos operadores aéreos.

SEÇÃO 110.5 — PROGRAMA DE SEGURANÇA DO OPERADOR

Cada operador aéreo deve implementar e manter um Programa de Segurança da Empresa Aérea (PSEA).

SEÇÃO 110.7 — CONTROLE DE PASSAGEIROS

(a) O operador deve verificar a identidade de cada passageiro antes do embarque;
(b) A lista de passageiros deve ser mantida disponível por 24 horas após o pouso;
(c) Passageiros com restrição devem ser identificados conforme determinação das autoridades.

SEÇÃO 110.11 — PROTEÇÃO DA CABINE DE COMANDO

(a) A porta da cabine de comando deve permanecer trancada durante o voo;
(b) O acesso à cabine de comando é restrito aos tripulantes e pessoal autorizado.
"""
    },
}


def create_all_sample_documents():
    """Create all 14 remaining sample documents."""
    print(f"\n{'='*60}")
    print(f"AirOps RAG — Creating Remaining Sample Documents")
    print(f"{'='*60}\n")

    created = 0
    for doc_id, doc_info in SAMPLE_DOCUMENTS.items():
        filepath = RAG_DIR / doc_info["filename"]
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(doc_info["content"])
        chars = len(doc_info["content"])
        print(f"  Created: {doc_info['filename']} ({chars} chars)")
        created += 1

    print(f"\n  Total: {created} documents created")

    # Update manifest paths
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

    print(f"  Updated manifest.json: {updates} entries\n")


if __name__ == "__main__":
    create_all_sample_documents()
