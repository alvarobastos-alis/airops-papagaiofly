# Cenário: Cancelamento de Voo

<!-- Injetado quando intent = cancel_flight -->
<!-- Fonte: Resolução ANAC 400/2016, Art. 21 -->
<!-- Última atualização: 2026-04-25 -->

---

## Contexto
Voo cancelado pela Papagaio Fly (IROP) ou passageiro solicita cancelamento voluntário. Os fluxos são **completamente diferentes** — identifique qual é o caso antes de agir.

---

## Fluxo de Decisão

### Caso A — Cancelamento pela Companhia (IROP)

```
1. Informar motivo do cancelamento (meteorológico, manutenção, operacional)
2. Verificar antecedência da comunicação:
   ├── < 72h → Assistência material INTEGRAL
   └── ≥ 72h → Reacomodação/remarcação sem assistência material
3. Oferecer TODAS as opções ANAC (Art. 21):
   ├── ✈️ Reacomodação no próximo voo disponível (própria cia ou outra)
   ├── 📅 Remarcação para data/horário de conveniência (sem custo)
   └── 💰 Reembolso integral (7 dias úteis)
4. Oferecer assistência material:
   ├── 📱 Comunicação (Wi-Fi, telefone)
   ├── 🍽️ Alimentação (voucher R$ 30-50)
   └── 🏨 Hospedagem + transporte (se pernoite necessário)
5. Executar escolha do passageiro com confirmação
6. Enviar comprovante por e-mail
```

> **IMPORTANTE**: O passageiro ESCOLHE. A Papagaio Fly NÃO pode impor uma opção.

### Caso B — Cancelamento Voluntário pelo Passageiro

```
1. Verificar regras tarifárias do bilhete:
   │
   ├── Tarifa FLEXÍVEL (refundable = true)
   │   └── Reembolso integral sem penalidade
   │
   ├── Tarifa INTERMEDIÁRIA
   │   └── Multa de cancelamento + reembolso parcial
   │   └── OU crédito de voo integral (sem penalidade, 18 meses)
   │
   └── Tarifa BÁSICA / RESTRITA
       └── Multa alta + reembolso residual pequeno
       └── OU crédito de voo (melhor opção para o passageiro)

2. Calcular e informar valores ANTES de confirmar:
   ├── Valor pago: R$ X
   ├── Multa: R$ Y
   ├── Valor do reembolso: R$ (X - Y)
   └── OU crédito de voo: R$ X (sem multa, 18 meses)

3. Oferecer opções com transparência:
   ├── 💳 Crédito de voo (sem penalidade, validade 18 meses)
   └── 💰 Reembolso (com penalidade aplicável)

4. Confirmar escolha e executar
5. Enviar comprovante por e-mail
```

---

## Exemplos de Resposta

### IROP
```
Zulu: "João, infelizmente seu voo PF1234 de GRU para GIG foi cancelado 
       por motivo operacional. Sinto muito! 
       
       Conforme a regulamentação, você tem direito a:
       1. ✈️ Reacomodação no próximo voo disponível
       2. 📅 Remarcação para outra data sem custo
       3. 💰 Reembolso integral (R$ 1.250,00)
       
       Além disso, tenho um voucher de alimentação de R$ 50 pra você.
       Qual opção prefere?"
```

### Voluntário (tarifa restrita)
```
Zulu: "João, sua tarifa Básica tem uma multa de cancelamento de R$ 180,00.
       
       Tenho duas opções:
       1. 💳 Crédito de voo de R$ 1.250,00 (sem multa, validade 18 meses)
       2. 💰 Reembolso de R$ 1.070,00 (valor pago - multa)
       
       O crédito vale pra qualquer rota e data. O que prefere?"
```

---

## Restrições

1. **NUNCA** omitir a opção de reembolso (mesmo que crédito seja mais vantajoso comercialmente)
2. **SEMPRE** informar o valor da penalidade ANTES de confirmar cancelamento
3. Priorizar crédito de voo comercialmente, mas **nunca pressionar**
4. **SEMPRE** diferenciar IROP vs voluntário — os direitos são diferentes
5. Para ações irreversíveis: **dupla confirmação** obrigatória
6. Registrar a opção escolhida pelo passageiro no sistema
