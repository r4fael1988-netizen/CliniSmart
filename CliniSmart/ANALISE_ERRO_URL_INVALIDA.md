# Análise Detalhada: Erro "URL inválida" no Workflow Sofia v3

## Problema Identificado
O workflow Sofia retorna erro `URL inválida` quando tenta chamar as ferramentas (tools) de integração com a API do CliniSmart CRM.

## Raiz do Problema (Hipóteses Testadas)

### ❌ Hipótese 1: clinicId era NULL
**Status**: Parcialmente resolvida
- **Problema original**: A Evolution API não envia `clinicId` no payload da webhook
- **Payload da Evolution API**:
  ```json
  {
    "corpo": {
      "instância": "SOFIA_CRM",
      "dados": {
        "chave": { "remoteJid": "5511987654321@s.whatsapp.net" },
        "mensagem": { "conversa": "Gostaria de agendar..." }
      }
    }
  }
  ```
- **Solução aplicada**: Usar `corpo.instância` como fallback para clinicId
  ```javascript
  {{ $node["CRM Webhook Trigger"].json.corpo.clinicId || 
     $node["CRM Webhook Trigger"].json.corpo.dados?.clinicId || 
     $node["CRM Webhook Trigger"].json.corpo.instância }}
  ```
- **Problema potencial**: A API do CliniSmart pode esperar um **ID de clínica do banco de dados**, não o nome da instância ("SOFIA_CRM")

### ⚠️ Hipótese 2: Endpoints da API estão incorretos
A URL sendo construída pode estar malformada. Os endpoints atuais no workflow são:

```
POST /api/whatsapp/tools/get-clinic-data
POST /api/whatsapp/tools/get-patient-history
POST /api/whatsapp/tools/check-availability
POST /api/whatsapp/tools/schedule
POST /api/whatsapp/tools/cancel-appointment
```

**Questões a verificar**:
1. Os endpoints existem com esses caminhos exatos?
2. A porta da API está correta? (ex: http://localhost:3000 vs http://api:3000)
3. Faltam query parameters na URL? (ex: `?clinicId=...`)
4. O header `Content-Type: application/json` está sendo enviado?

### ⚠️ Hipótese 3: Formato do JSON enviado para as ferramentas
As tools podem estar enviando JSON em um formato que a API não espera.

**Exemplo atual para `get_clinic_data`**:
```json
{
  "clinicId": "SOFIA_CRM",
  "patientPhone": "5511987654321"
}
```

**Pode ser que a API espere**:
```json
{
  "clinicId": 1,
  "contactPhone": "5511987654321"
}
```

## Checklist de Verificação

### 1. Verificar o Backend (CliniSmart API)
```bash
# Acesse o repositório GitHub e procure por:
# A) Rota das ferramentas (tools)
grep -r "/api/whatsapp/tools" src/
grep -r "get-clinic-data\|get-patient-history" src/

# B) Validação de clinicId
grep -r "clinicId" src/app/api/whatsapp/

# C) Middleware de validação
find src -name "*middleware*" -o -name "*validation*"
```

### 2. Testar Endpoints Manualmente
```bash
# Teste a conexão com a API
curl -X POST http://localhost:3000/api/whatsapp/tools/get-clinic-data \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"SOFIA_CRM","patientPhone":"5511987654321"}'

# Se falhar, tente com um clinicId numérico
curl -X POST http://localhost:3000/api/whatsapp/tools/get-clinic-data \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"1","patientPhone":"5511987654321"}'
```

### 3. Verificar Logs da API
```bash
# No servidor do CliniSmart:
tail -f logs/api.log
# Procure por mensagens de erro sobre parametros inválidos
```

### 4. Verificar Logs do n8n
No dashboard do n8n, vá para:
1. **Sofia workflow** → **Executions** → Última execução com erro
2. Expanda o nó `get_clinic_data` (ou outro que falhou)
3. Procure pela resposta HTTP exata (status code + mensagem de erro)

## Possíveis Soluções

### Solução A: clinicId precisa ser um ID numérico
**Se o erro é porque SOFIA_CRM não é um ID válido:**

Adicione um nó **HTTP Request** ANTES dos tool nodes para mapear:
```
SOFIA_CRM → clinicId (numérico do banco)
```

Ou modifique a expressão de clinicId:
```javascript
// Se SOFIA_CRM sempre mapeia para clinicId=1
{{ $node["CRM Webhook Trigger"].json.corpo.instância === "SOFIA_CRM" ? "1" : "2" }}
```

### Solução B: Alterar formato dos endpoints
Se os endpoints não existem com esses caminhos, procure em `routes.ts` ou `app/api/` quais são os caminhos corretos.

**Padrões comuns**:
- `/api/clinics/{clinicId}/patients` (com clinicId na URL)
- `/api/tools/get-clinic-data?clinicId=1` (com query parameter)
- `/api/crm/tools/clinic/data` (estrutura diferente)

### Solução C: Validar formato do JSON
Compare o que o n8n está enviando com o que a API espera:

**No n8n workflow**:
1. Selecione um tool node
2. Vá em **Body** → **Edit in JSON**
3. Verifique se o JSON está bem formatado
4. Copie e cole em um teste CURL para confirmar

## Próximos Passos Recomendados

1. **Acessar a documentação da API** no repositório CliniSmart:
   - Procure por `API.md`, `README.md`, ou `docs/api/`
   - Identifique os endpoints exatos e o formato esperado

2. **Executar teste manual** com curl para validar os endpoints

3. **Adicionar logging** no workflow:
   - Adicione um nó **Debug** antes e depois de cada tool
   - Execute o workflow novamente para ver exatamente qual é a URL sendo construída

4. **Consultar logs do n8n**:
   - Procure por "URL inválida" ou "Invalid URL"
   - Identifique qual ferramenta está falhando (get_clinic_data, schedule, etc.)

## Dados Importantes para Referência

**Estrutura do webhook da Evolution API**:
```json
{
  "corpo": {
    "instância": "SOFIA_CRM",
    "clinicName": "Clínica XYZ",
    "dados": {
      "chave": {
        "remoteJid": "5511987654321@s.whatsapp.net"
      },
      "mensagem": {
        "conversa": "texto da mensagem do paciente"
      }
    }
  }
}
```

**Expressões usadas no workflow**:
- **clinicId**: `{{ $node["CRM Webhook Trigger"].json.corpo.instância }}`
- **patientPhone**: `{{ $node["CRM Webhook Trigger"].json.corpo.dados?.chave?.remoteJid?.replace('@s.whatsapp.net', '') }}`
- **Patient Message**: `{{ $node["CRM Webhook Trigger"].json.corpo.dados?.mensagem?.conversa || "" }}`

---

## Resumo das Ações Realizadas

✅ Corrigido: Tool names no prompt (obter_dados_clinicos → get_clinic_data)
✅ Corrigido: Placeholder [NOME DA CLÍNICA] → expressão dinâmica
✅ Corrigido: cancelamento de agendamento sem clinicId
✅ Corrigido: Tools sem descriptions (AI não sabia quando usá-los)
✅ Corrigido: Tools sem placeholders para parâmetros dinâmicos
✅ Corrigido: clinicId fallback agora usa corpo.instância
✅ Corrigido: Prompt agora inclui mensagem atual do paciente

❓ **Ainda precisa ser verificado**: Se a API do CliniSmart aceita `corpo.instância` como identificador válido de clínica, ou se precisa de um ID numérico do banco de dados.
