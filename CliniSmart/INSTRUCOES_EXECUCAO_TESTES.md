# 🚀 Instruções para Executar os Testes no Seu Ambiente

## ⚠️ Situação Atual

A API do CliniSmart **não está rodando** neste sandbox. Para identificar e corrigir o erro "URL inválida", você precisa:

1. **Fazer os testes no seu servidor** (onde a API CliniSmart está rodando)
2. **Acessar o n8n** onde o workflow Sofia está configurado
3. **Executar os scripts de teste** que foram criados

---

## Passo 1: Copie os Scripts para Seu Servidor

Os 3 arquivos de teste foram criados em:
```
/CliniSmart/
├── test-api-endpoints.js      ← Script Node.js
├── test-api-endpoints.sh      ← Script Bash
├── ANALISE_ERRO_URL_INVALIDA.md
└── DEBUG_WORKFLOW_SOFIA.md
```

**Copie para seu servidor** (via SCP, Git, ou download manual):

```bash
# Via SCP (se tiver acesso SSH)
scp -r /caminho/local/CliniSmart seu-usuario@seu-servidor:/home/seu-usuario/

# Ou manualmente: acesse a pasta e faça download dos arquivos
```

---

## Passo 2: Execute o Teste Node.js

No seu servidor, na pasta CliniSmart:

```bash
# Teste 1: Assumindo que a API está em localhost:3000
node test-api-endpoints.js http://localhost:3000 SOFIA_CRM 5511987654321

# Teste 2: Se está em outro domínio/porta
node test-api-endpoints.js https://seu-dominio.com SOFIA_CRM 5511987654321

# Teste 3: Com uma porta diferente
node test-api-endpoints.js http://localhost:5000 SOFIA_CRM 5511987654321
```

**Resultado esperado:**
- Se funcionar: Vai mostrar respostas de cada endpoint (200, 400, 404, etc.)
- Se falhar: Mostra "ECONNREFUSED" (API não está rodando)

---

## Passo 3: Análise dos Resultados

### ✅ Se receber Status 200 ou 201
```json
✓ /api/whatsapp/tools/get-clinic-data - Status 200
{
  "success": true,
  "clinicData": {...}
}
```
**Significa**: O endpoint funciona ✅
- O erro está em outro lugar (talvez URL, headers, ou auth)
- Continue testando os outros endpoints

### ❌ Se receber Status 400 ou 422
```json
✗ /api/whatsapp/tools/get-clinic-data - Status 400
{
  "error": "Invalid clinic ID: SOFIA_CRM"
}
```
**Significa**: A API rejeitou o `clinicId`
- 🔧 **Solução**: Mapear SOFIA_CRM para um ID real no banco de dados
- Veja **Passo 4** abaixo

### ❌ Se receber Status 404
```json
✗ /api/whatsapp/tools/get-clinic-data - Status 404
{
  "error": "Not Found"
}
```
**Significa**: O endpoint não existe nesse caminho
- 🔧 **Solução**: Encontrar os endpoints corretos
- Procure em `src/app/api/` ou `routes.ts`

### ❌ Se receber Status 500
```json
✗ /api/whatsapp/tools/get-clinic-data - Status 500
{
  "error": "Internal Server Error"
}
```
**Significa**: Erro no backend
- 🔧 **Solução**: Verificar logs da API
  ```bash
  # Se rodando com Docker
  docker logs clinismart-api
  
  # Se rodando com Node direto
  npm run dev  # vai mostrar no console
  
  # Se rodando com PM2
  pm2 logs
  ```

---

## Passo 4: Resolva o Problema de clinicId

Se o erro é **"Invalid clinic ID: SOFIA_CRM"**, siga este fluxo:

### 4A: Entenda como os IDs de clínica funcionam
```bash
# Acesse o banco de dados
psql -U usuario -d clinismart

# Veja as clínicas existentes
SELECT id, name, instance_name FROM clinics;

# Exemplo de resultado:
# id | name              | instance_name
# 1  | Clínica Central   | SOFIA_CRM
# 2  | Clínica Zona Sul  | OUTRO_CRM
```

### 4B: Atualize o Workflow Sofia no n8n

Se `SOFIA_CRM` mapeia para `id = 1`:

1. Acesse o workflow Sofia no n8n
2. Clique no nó **CRM Webhook Trigger**
3. Localize a expressão de `clinicId`:
   ```javascript
   // ANTES (atual):
   {{ $node["CRM Webhook Trigger"].json.corpo.instância }}
   
   // DEPOIS (corrigido):
   {{ $node["CRM Webhook Trigger"].json.corpo.instância === "SOFIA_CRM" ? "1" : "2" }}
   ```
4. Salve e teste novamente

### 4C: Alternativa - Use um mapeamento no n8n

Se tem múltiplas clínicas:

```javascript
{{ ({
  "SOFIA_CRM": "1",
  "OUTRO_CRM": "2",
  "TERCEIRA_CLINICA": "3"
})[$node["CRM Webhook Trigger"].json.corpo.instância] }}
```

---

## Passo 5: Teste Completo no Workflow

Depois de resolver os testes:

1. No n8n, acesse o workflow **Sofia v3**
2. Envie uma mensagem de teste via WhatsApp
3. Vá para **Executions** e veja se:
   - ✅ Webhook foi acionado
   - ✅ AI Agent processou a mensagem
   - ✅ Tools foram chamadas com sucesso
   - ✅ Resposta foi enviada ao CRM

Se ainda tiver erro, siga o **DEBUG_WORKFLOW_SOFIA.md** para análise detalhada.

---

## Checklist Rápido

```
[ ] Copiei os scripts para meu servidor
[ ] Executei: node test-api-endpoints.js http://...
[ ] Verifiquei qual endpoint está falhando
[ ] Analisei o erro (400, 404, 500, etc.)
[ ] Se 400 → Identifiquei o problema com clinicId
[ ] Se 404 → Encontrei os endpoints corretos
[ ] Se 500 → Verifiquei os logs da API
[ ] Fiz as correções necessárias no workflow
[ ] Testei novamente com uma mensagem de WhatsApp
```

---

## Contato com Suporte Técnico

Se depois de tudo isso ainda tiver erro:

1. **Capture a execução com erro** no n8n (print da aba Executions)
2. **Capture a resposta exata** da API (a mensagem de erro)
3. **Verifique os logs** da API backend
4. **Compartilhe**:
   - Screenshot do erro no n8n
   - Saída do teste (`node test-api-endpoints.js`)
   - Logs da API

Com essas informações, conseguimos identificar a causa raiz rapidamente.

---

## Resumo

| Ação | Comando |
|------|---------|
| Testar endpoints | `node test-api-endpoints.js http://localhost:3000 SOFIA_CRM 5511987654321` |
| Ver logs da API | `docker logs clinismart-api` ou `pm2 logs` |
| Verificar clinicIds | `psql -U user -d clinismart -c "SELECT id, name FROM clinics;"` |
| Acessar n8n | `http://seu-n8n:5678` |
| Testar workflow | Enviar mensagem WhatsApp para o número configurado |

---

💡 **Dica importante**: O erro "URL inválida" geralmente significa que uma variável não foi preenchida corretamente. Depois de rodar os testes, você terá dados suficientes para identificar exatamente qual variável está vazia ou qual endpoint está errado.
