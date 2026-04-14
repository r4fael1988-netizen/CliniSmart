# 🎯 PLANO DE AÇÃO EXECUTIVO - Corrigir Sofia v3

**Objetivo**: Corrigir erro "URL inválida" no workflow Sofia e deixar tudo funcionando

**Tempo estimado**: 30 minutos (se API estiver acessível)

---

## ⚠️ PRÉ-REQUISITOS

Antes de começar, certifique-se que:

- [ ] API do CliniSmart está **rodando** (Docker ou Node)
- [ ] n8n está **acessível** (http://seu-n8n:5678)
- [ ] PostgreSQL está **rodando** (banco de dados das clínicas)
- [ ] Node.js v14+ está instalado

**Se algo não está rodando**:
```bash
# Iniciar Docker (se usar containers)
docker-compose up -d

# Ou iniciar manualmente
docker run -p 3000:3000 clinismart-api
pm2 start n8n
```

---

## 📋 PLANO EM 5 FASES

### ⏱️ FASE 1: DESCOBRIR A RAIZ (5 minutos)

#### 1.1 Descubra qual é a porta da API
```bash
# Opção A: Se está em Docker
docker ps | grep -i "clinismart\|api\|backend"
# Procure pela porta que está mapeada (ex: 3000, 5000, 8000)

# Opção B: Se está rodando localmente
lsof -i -P -n | grep LISTEN
# Ou
netstat -tlnp | grep LISTEN
# Procure por "node" ou "next"

# Opção C: Pergunte ao desenvolvedor
# "Em qual porta a API do CliniSmart está rodando?"
```

#### 1.2 Teste a conexão básica
```bash
# Substitua 3000 pela porta correta
curl -s http://localhost:3000/api/health && echo "API OK" || echo "API FORA"
```

#### 1.3 Identifique os IDs reais das clínicas
```bash
# Acesse o banco de dados
psql -U seu-usuario -d clinismart -c "SELECT id, name, instance_name FROM clinics LIMIT 5;"

# Ou se usar Docker
docker exec clinismart-db psql -U usuario -d clinismart -c "SELECT id, name FROM clinics;"

# Anote os resultados:
# SOFIA_CRM deve corresponder a qual ID? (ex: 1, 2, 100?)
```

---

### ⏱️ FASE 2: EXECUTAR TESTE AUTOMATIZADO (5 minutos)

#### 2.1 Rode o script de teste

```bash
# Copie o script para o diretório do projeto
cd /seu/projeto/CliniSmart

# Execute com a porta correta e clinic ID
node test-api-endpoints.js http://localhost:3000 1 5511987654321
# ou com o ID numérico real descoberto acima
```

#### 2.2 Analise o resultado

**Se vê Status 200/201**:
```
✅ SUCESSO - Os endpoints funcionam!
→ Vá para FASE 3
```

**Se vé Status 400**:
```
❌ ERRO - API rejeitou clinicId
Mensagem: "Invalid clinic ID: SOFIA_CRM"
→ Vá para FASE 3 (Solução A)
```

**Se vê Status 404**:
```
❌ ERRO - Endpoint não existe
Mensagem: "Not Found"
→ Vá para FASE 3 (Solução B) - procure endpoints corretos
```

**Se vê Status 500**:
```
❌ ERRO - Erro interno
→ Veja os logs: docker logs clinismart-api
→ Vá para FASE 3 (Solução C)
```

---

### ⏱️ FASE 3: IMPLEMENTAR CORREÇÃO NO n8n (10 minutos)

#### 3.1 Acesse o Workflow Sofia

1. Abra: http://seu-n8n:5678
2. Procure: **Sofia - Gestora de CRM v3 (PRODUÇÃO)**
3. Clique para abrir

#### 3.2 Identifique o Problema (conforme teste anterior)

**Se Status 400** (clinicId inválido):

1. Clique no nó: **CRM Webhook Trigger**
2. Procure a expressão de **clinicId**
3. Atualmente está assim:
   ```javascript
   {{ $node["CRM Webhook Trigger"].json.corpo.instância }}
   // Retorna: "SOFIA_CRM"
   ```
4. Mude para o ID real (ex: "1"):
   ```javascript
   {{ "1" }}
   ```

**Se Status 404** (endpoint não existe):

1. Procure os endpoints corretos no código:
   ```bash
   grep -r "get-clinic-data\|get-patient-history" src/app/api/
   ```

2. Atualize as URLs nos nós Tool HTTP Request
   - Exemplo: Mude `/api/whatsapp/tools/get-clinic-data`
   - Para o caminho correto encontrado acima

#### 3.3 Salve as Mudanças

- **Keyboard**: Ctrl+S (Windows/Linux) ou Cmd+S (Mac)
- **Ou**: Procure botão "Save" no n8n

---

### ⏱️ FASE 4: VALIDAR NO TESTE NOVAMENTE (5 minutos)

```bash
# Execute o script novamente
node test-api-endpoints.js http://localhost:3000 1 5511987654321

# Resultado esperado:
# Status: 200
# ✓ Passou: 5
```

**Se retornou Status 200**: ✅ Sucesso! Vá para FASE 5

**Se ainda tem erro**: 
- Revise a mudança no n8n
- Verifique se salvou
- Execute o teste novamente

---

### ⏱️ FASE 5: VALIDAR EM TEMPO REAL (5 minutos)

#### 5.1 Envie uma Mensagem de Teste

1. Abra WhatsApp no seu celular
2. Envie uma mensagem para o número configurado (ex: +55 11 98765-4321)
3. **Aguarde resposta** (pode levar alguns segundos)

#### 5.2 Verifique a Execução no n8n

1. No n8n, vá para **Executions** (Execuções)
2. Procure a execução mais recente
3. Verifique cada nó:
   - ✅ Verde: Sucesso
   - ❌ Vermelho: Erro

#### 5.3 Confirme Sucesso

**Se vê tudo verde** (✅✅✅...):
```
🎉 PARABÉNS! O workflow está funcionando!
```

**Se ainda vê vermelho** (❌):
- Clique no nó vermelho
- Leia a mensagem de erro
- Retorne a **FASE 2** com a nova informação

---

## 🔧 QUICK FIX - Se Precisar de Ajuda

### Problema: "Invalid clinic ID: SOFIA_CRM"
**Solução rápida**:
```javascript
// NO nó "CRM Webhook Trigger":
// Mude isto:
{{ $node["CRM Webhook Trigger"].json.corpo.instância }}

// Para isto:
{{ "1" }}
// (substitua 1 pelo ID real da sua clínica)
```

### Problema: "Not Found" (404)
**Solução rápida**:
```bash
# Procure os endpoints:
find src -name "*.ts" | xargs grep -l "whatsapp.*tools"

# Encontre o caminho correto e atualize no n8n
```

### Problema: "Internal Server Error" (500)
**Solução rápida**:
```bash
# Veja os logs:
docker logs clinismart-api -f

# Procure por linhas com "ERROR" ou "Exception"
# Corrija o problema indicado nos logs
```

---

## 📊 CHECKLIST FINAL

```
FASE 1 - DESCOBERTA
[ ] Encontrei a porta da API (ex: 3000)
[ ] Testei a conexão: curl http://localhost:PORTA/api/health
[ ] Descobri o ID real da clínica (ex: 1, 2, 100?)

FASE 2 - TESTE
[ ] Executei: node test-api-endpoints.js http://localhost:PORTA ID_CLINICA PHONE
[ ] Anotei o Status Code (200, 400, 404, 500?)
[ ] Identifiquei qual solução se aplica (A, B, ou C)

FASE 3 - CORREÇÃO
[ ] Acessei o n8n (http://seu-n8n:5678)
[ ] Abri o workflow Sofia
[ ] Modifiquei a expressão de clinicId ou endpoints
[ ] Salvei as mudanças (Ctrl+S)

FASE 4 - VALIDAÇÃO
[ ] Executei o teste novamente
[ ] Status mudou para 200?

FASE 5 - TESTE REAL
[ ] Enviei uma mensagem via WhatsApp
[ ] Verifiquei em "Executions" no n8n
[ ] Tudo verde (✅)?
```

---

## ⏱️ TEMPO ESTIMADO POR FASE

| Fase | Tempo | Total |
|------|-------|-------|
| 1 | 5 min | 5 min |
| 2 | 5 min | 10 min |
| 3 | 10 min | 20 min |
| 4 | 5 min | 25 min |
| 5 | 5 min | 30 min |

**TOTAL: 30 minutos para resolver completamente**

---

## 🆘 SE FICAR PRESO

**Não consegue executar os testes?**
- Verifique se Node.js está instalado: `node --version`
- Verifique se a API está rodando: `curl http://localhost:3000`

**Não consegue acessar o n8n?**
- Verifique a URL: `curl http://seu-n8n:5678`
- Verifique o firewall

**Não consegue enviar mensagem WhatsApp?**
- Verifique se a Evolution API está configurada
- Teste o webhook manualmente: `curl -X POST http://seu-n8n:5678/webhook/crm-manager-agent-v1 ...`

**Mensagens de erro não fazem sentido?**
- Copie o erro exato
- Cole em um arquivo de texto
- Compartilhe com seu time

---

## 📞 RESUMO EXECUTIVO

| O QUE FAZER | COMANDO |
|------------|---------|
| Descobrir porta da API | `docker ps` ou `netstat -tlnp` |
| Testar API | `node test-api-endpoints.js http://localhost:3000 1 5551198765431` |
| Acessar n8n | Abra: `http://seu-n8n:5678` |
| Corrigir clinicId | Mude para: `{{ "1" }}` (ID real) |
| Salvar | Ctrl+S ou Cmd+S |
| Validar | Envie WhatsApp + veja Executions |

---

**Status**: Pronto para execução  
**Próximo passo**: Execute **FASE 1** acima

Assim que tiver a **porta da API** e o **ID real da clínica**, você consegue terminar tudo em 30 minutos!
