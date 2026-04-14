# 🔧 Exemplo Prático: Correções no Workflow Sofia do n8n

## Situação Atual

Seu workflow Sofia está com os seguintes problemas identificados:

### ❌ Problema 1: clinicId pode estar inválido
```javascript
// EXPRESSÃO ATUAL NO NÓ "CRM Webhook Trigger":
{{ $node["CRM Webhook Trigger"].json.corpo.instância }}

// RESULTADO:
// clinicId = "SOFIA_CRM"

// PROBLEMA:
// A API pode não aceitar "SOFIA_CRM" como clinicId
// A API espera um ID numérico ou UUID do banco de dados
```

---

## ✅ Solução 1: Mapear SOPHIA_CRM para ID Numérico

### Opção 1A: Valor Fixo (mais simples)
Se `SOFIA_CRM` sempre corresponde ao ID `1`:

**Onde mudar**: Nó `CRM Webhook Trigger`

**ANTES**:
```javascript
{{ $node["CRM Webhook Trigger"].json.corpo.instância }}
```

**DEPOIS**:
```javascript
{{ "1" }}
```

---

### Opção 1B: Mapeamento Dinâmico (mais flexível)
Se tem múltiplas instâncias:

**Onde mudar**: Nó `CRM Webhook Trigger`

**ANTES**:
```javascript
{{ $node["CRM Webhook Trigger"].json.corpo.instância }}
```

**DEPOIS**:
```javascript
{{ ({
  "SOFIA_CRM": "1",
  "OUTRO_CRM": "2",
  "TERCEIRA_CLINICA": "3"
})[$node["CRM Webhook Trigger"].json.corpo.instância] }}
```

---

### Opção 1C: Usar um Nó para Fazer a Conversão
Se a lógica é muito complexa:

1. Adicione um nó **HTTP Request** ANTES do AI Agent
2. Configure assim:

```
Método: POST
URL: http://localhost:3000/api/crm/get-clinic-id
Body (JSON):
{
  "instanceName": "{{ $node["CRM Webhook Trigger"].json.corpo.instância }}"
}
```

3. A API retornará o ID: `{ "clinicId": "1" }`
4. Use em vez de extrair direto do webhook

---

## ✅ Solução 2: Verificar Endpoints Corretos

### Cenário: Endpoints de ferramentas estão errados

**Onde verificar**: Cada nó de tool HTTP Request

**Exemplo de nó `get_clinic_data`:**

```
Tipo: HTTP Request
Método: POST
URL: http://localhost:3000/api/whatsapp/tools/get-clinic-data
Headers:
  Content-Type: application/json
Body:
  {
    "clinicId": "1",        ← use o ID numérico
    "patientPhone": "5511987654321"
  }
```

**Se retornar 404**, procure pelo endpoint correto:

```bash
# No seu repositório CliniSmart:
find src -name "*.ts" | xargs grep "get-clinic-data"

# Resultado esperado:
# app/api/whatsapp/tools/get-clinic-data.ts
# app/api/tools/clinic/get-data.ts
# routes/api/v1/tools.ts
```

---

## 🔍 Passo-a-Passo: Fazer a Correção no n8n

### 1. Acesse o Workflow
```
Dashboard n8n → Sofia - Gestora de CRM v3 (PRODUÇÃO)
```

### 2. Clique no Nó "CRM Webhook Trigger"
```
Painel à esquerda → CRM Webhook Trigger
```

### 3. Localize a Expressão de clinicId

Procure por algo assim no painel **Parameters** ou **Output**:

```
clinicId: {{ $node["CRM Webhook Trigger"].json.corpo.instância }}
```

### 4. Modifique a Expressão

**Se usar Opção 1A (fixo)**:
```javascript
{{ "1" }}
```

**Se usar Opção 1B (mapeamento)**:
```javascript
{{ ({
  "SOFIA_CRM": "1"
})[$node["CRM Webhook Trigger"].json.corpo.instância] }}
```

### 5. Salve (Ctrl+S ou Cmd+S)

### 6. Teste

Envie uma mensagem de teste via WhatsApp:
- O workflow deve executar sem erro
- Vá para **Executions** e verifique se passou

---

## 📊 Tabela Comparativa: Antes vs Depois

| Aspecto | ❌ Antes | ✅ Depois |
|---------|---------|----------|
| clinicId enviado | "SOFIA_CRM" | "1" |
| Tipo do clinicId | String (nome) | String/Number (ID) |
| API aceita? | ❌ Pode falhar | ✅ Deve funcionar |
| Flexibilidade | ❌ Difícil mudar | ✅ Fácil adicionar mais |
| Status esperado | ❌ 400 Bad Request | ✅ 200 OK |

---

## 🧪 Teste Antes e Depois

### ANTES (com erro):
```bash
$ node test-api-endpoints.js http://localhost:3000 SOFIA_CRM 5511987654321

Testando: get_clinic_data
Status: 400
{
  "error": "Invalid clinic ID: SOFIA_CRM"
}
```

### DEPOIS (deve funcionar):
```bash
$ node test-api-endpoints.js http://localhost:3000 1 5511987654321

Testando: get_clinic_data
Status: 200
{
  "success": true,
  "clinicData": {
    "id": 1,
    "name": "Clínica Central",
    "phone": "1133334444"
  }
}
```

---

## 📍 Localizações das Mudanças no Workflow

```
Sofia Workflow
├── CRM Webhook Trigger
│   └── clinicId: {{ "1" }}  ← MUDE AQUI
│
├── get_clinic_data (Tool)
│   └── Body: { "clinicId": "{{resultado do webhook}}" }
│
├── get_patient_history (Tool)
│   └── Body: { "clinicId": "{{resultado do webhook}}" }
│
├── check_availability (Tool)
│   └── Body: { "clinicId": "{{resultado do webhook}}" }
│
├── schedule_appointment (Tool)
│   └── Body: { "clinicId": "{{resultado do webhook}}" }
│
└── cancel_appointment (Tool)
    └── Body: { "clinicId": "{{resultado do webhook}}" }
```

**Nota**: Se mudar a expressão no webhook, todas as tools irão receber o novo valor automaticamente (se usarem referência ao nó).

---

## ⚠️ Erros Comuns ao Fazer Mudanças

### ❌ Erro 1: Sintaxe JavaScript incorreta
```javascript
// ERRADO:
{{ ({
  SOFIA_CRM: 1  ← Falta aspa
})[$node["..."].json.corpo.instância] }}

// CORRETO:
{{ ({
  "SOFIA_CRM": "1"  ← Com aspas
})[$node["..."].json.corpo.instância] }}
```

### ❌ Erro 2: Referência ao nó incorreta
```javascript
// ERRADO:
{{ CRM Webhook Trigger.json.corpo.instância }}  ← Falta $node[""]

// CORRETO:
{{ $node["CRM Webhook Trigger"].json.corpo.instância }}
```

### ❌ Erro 3: Tentar editar a URL diretamente
```javascript
// ERRADO - isso não vai funcionar:
http://localhost:3000/api/whatsapp/tools/get-clinic-data?clinicId={{ "1" }}

// CORRETO - usar o Body:
{
  "clinicId": "1"
}
```

---

## ✅ Verificação Final

Depois de fazer as mudanças:

```
[ ] Modifiquei a expressão de clinicId
[ ] Salvei o workflow (Ctrl+S)
[ ] Executei o teste novamente
[ ] Status mudou de 400 para 200
[ ] Enviei uma mensagem de WhatsApp para testar
[ ] A resposta foi enviada ao CRM (sem erro)
```

---

## 🎯 Se Ainda Tiver Erro Após Mudanças

1. **Verifique se salvou**: Procure por "All changes saved" no n8n
2. **Reexecute o teste**: `node test-api-endpoints.js ...`
3. **Verifique os logs**: `docker logs clinismart-api`
4. **Procure por Solução B**: Talvez o endpoint seja diferente

Se o teste retornar **200 mas o workflow ainda falhar**, o problema pode ser:
- Headers faltando
- Autenticação
- Validação de dados

---

## 📞 Próximo Passo

Depois de corrigir o clinicId:

1. Rode o teste novamente
2. Se status 200: Parabéns! 🎉
3. Se ainda 400 ou 404: Vá para **ANALISE_ERRO_URL_INVALIDA.md**

---

**Última atualização**: 2026-04-12  
**Versão do Workflow**: Sofia v3  
**Status**: Pronto para implementação
