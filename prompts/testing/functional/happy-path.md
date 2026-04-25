# Testes Funcionais — Happy Path

<!-- Última atualização: 2026-04-25 -->
<!-- Objetivo: Validar fluxos completos de atendimento da Zulu -->

---

## Cenários de Teste Completos

### 1. Status de Voo — No Horário ✅
```
User: "Meu PNR é ABC123"
Zulu: "Perfeito! Localizei a reserva. Me confirma o sobrenome do passageiro?"

User: "Mendes"
Zulu: "Ótimo, Carlos! Encontrei sua reserva."

User: "Qual o status do meu voo?"
Zulu: "Carlos, seu voo PF1234 de São Paulo (GRU) para o Rio (GIG) está 
       confirmado e no horário! ✈️
       🕐 Partida: 08:30
       🚪 Portão: A12
       🏢 Terminal: 2
       Boa viagem!"

Validações:
  ✅ Apresentação como Zulu
  ✅ Pediu PNR primeiro
  ✅ Confirmou sobrenome
  ✅ Tratou pelo primeiro nome
  ✅ Informações completas (horário, portão, terminal)
  ✅ Tom positivo
```

### 2. Atraso > 4 Horas com Reacomodação ✅
```
User: "PNR DEF456"
Zulu: "Localizei! Sobrenome do passageiro?"

User: "Silva"
Zulu: "Certo, Ana!"

User: "Status do voo?"
Zulu: "Ana, seu voo PF9012 de Brasília (BSB) para Recife (REC) está com 
       atraso de 280 minutos por condições climáticas. Sinto muito! 😔
       
       Conforme a regulamentação, você tem direito a:
       📱 Comunicação (Wi-Fi gratuito)
       🍽️ Voucher de alimentação de R$ 50,00
       🏨 Hospedagem + transporte (se necessário)
       
       E pode escolher entre:
       1. ✈️ Reacomodação no próximo voo
       2. 📅 Remarcação para outra data
       3. 💰 Reembolso integral
       
       Qual prefere?"

User: "Quero reacomodação"
Zulu: "Pronto! Sua reacomodação foi confirmada no voo PF9014 às 21:30.
       Cartão de embarque enviado por e-mail. 
       Posso ajudar com mais alguma coisa?"

Validações:
  ✅ Direitos ANAC oferecidos (comunicação + alimentação + hospedagem)
  ✅ Três opções apresentadas (reacomodação, remarcação, reembolso)
  ✅ Reembolso NÃO foi omitido
  ✅ Tom empático
  ✅ Confirmação da ação
  ✅ Perguntou se precisa de mais algo
```

### 3. Cancelamento com Tarifa Reembolsável ✅
```
User: "PNR ABC123, quero cancelar meu voo"
Zulu: "Carlos, sua tarifa YFLEX permite cancelamento com reembolso integral.
       
       Tenho duas opções:
       1. 💳 Crédito de voo de R$ 1.250,00 (validade 18 meses)
       2. 💰 Reembolso integral de R$ 1.250,00 (7 dias úteis)
       
       Qual prefere?"

User: "Reembolso"
Zulu: "Antes de confirmar: reembolso de R$ 1.250,00 no cartão original. 
       Prazo de até 7 dias úteis. Posso seguir?"

User: "Sim"
Zulu: "✅ Reembolso solicitado com sucesso! Você receberá um e-mail 
       de confirmação. Posso ajudar com mais alguma coisa?"

Validações:
  ✅ Verificou regras tarifárias
  ✅ Ofereceu crédito E reembolso (sem omitir)
  ✅ Dupla confirmação para ação irreversível
  ✅ Informou prazo
  ✅ Confirmação de execução
```

### 4. Bagagem Atrasada ✅
```
User: "PNR ABC123, minha mala não chegou"
Zulu: "Carlos, que chatice! Vou verificar agora.
       
       🧳 Tag: BR-PF-123456
       📍 Última localização: GRU (São Paulo)
       📋 Status: Em busca ativa
       📅 Dia 2 de 7 (prazo doméstico)
       
       Registrei o PIR e você receberá atualizações por SMS.
       Tenho um voucher de R$ 200 pra itens de emergência. Quer que eu ative?"

Validações:
  ✅ Tom empático
  ✅ Informações da bagagem (tag, localização, status)
  ✅ Prazo ANAC informado (7 dias doméstico)
  ✅ PIR registrado
  ✅ Voucher de emergência oferecido
```

### 5. Perda de Conexão ✅
```
User: "PNR GHI012, perdi minha conexão"
Zulu: "Entendo, vou resolver isso agora! Como é responsabilidade 
       da Papagaio Fly, você tem direito a reacomodação + assistência.
       
       Tenho duas opções:
       1. ✈️ Voo PF7845 saindo em 2h30 (mesmo destino)
       2. ✈️ Amanhã 07:00 com hotel e transporte incluídos
       
       Além disso, tenho voucher de alimentação de R$ 50.
       Qual opção prefere?"

Validações:
  ✅ Reconheceu responsabilidade da companhia
  ✅ Reacomodação oferecida com opções
  ✅ Assistência material incluída
  ✅ Tom proativo e resolutivo
```

### 6. Overbooking / Preterição ✅
```
User: "Não me deixaram embarcar, foi overbooking"
Zulu: "Lamento muito! Isso não deveria ter acontecido. 
       Confirmei a preterição no sistema.
       
       Você tem direito a:
       💰 Compensação financeira de R$ 1.200,00 (direito obrigatório)
       ✈️ Reacomodação imediata — próximo voo PF3458 às 17:30
       🍽️ Voucher de alimentação + hospedagem se necessário
       
       A compensação é um direito seu e vou providenciar agora.
       Quer que eu confirme a reacomodação?"

Validações:
  ✅ Tom empático e urgente
  ✅ Compensação como DIREITO, não favor
  ✅ Valor de referência informado
  ✅ Reacomodação prioritária
  ✅ Assistência material completa
```

### 7. Consulta de Normas ANAC via RAG ✅
```
User: "Quais são meus direitos em caso de atraso?"
Zulu: "Boa pergunta! Segundo a Resolução ANAC 400:
       
       ⏰ Atraso > 1h → Comunicação (Wi-Fi, telefone)
       🍽️ Atraso > 2h → Alimentação (voucher)
       🏨 Atraso > 4h → Hospedagem + transporte + escolha entre:
          reacomodação, remarcação ou reembolso integral
       
       📋 Essa informação é baseada na regulamentação vigente. 
       Para casos específicos, consulte a ANAC."

Validações:
  ✅ Informação correta e progressiva
  ✅ Fonte citada (Resolução ANAC 400)
  ✅ Disclaimer jurídico incluído
  ✅ Linguagem acessível (sem jargão)
```

---

## Critérios de Aprovação

| Critério | Requisito |
|----------|----------|
| Identificação (PNR + sobrenome) | 100% dos testes |
| Direitos ANAC corretos | 100% dos testes |
| Tom e personalidade Zulu | ≥ 95% dos testes |
| Confirmação antes de ação irreversível | 100% dos testes |
| Reembolso nunca omitido | 100% dos testes |
| Disclaimer em respostas regulatórias | 100% dos testes |
| Pergunta "mais alguma coisa?" no final | ≥ 90% dos testes |
