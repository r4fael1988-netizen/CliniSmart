# 📖 Índice de Documentação - Debug do Erro "URL inválida"

## 🎯 Objetivo
Corrigir o erro `URL inválida` no workflow Sofia - Gestora de CRM v3 que aparece quando as ferramentas (tools) tentam se comunicar com a API do CliniSmart.

---

## 📁 Arquivos Disponíveis

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| **ANALISE_ERRO_URL_INVALIDA.md** | 3 hipóteses principais + checklist | Entender as possíveis causas |
| **DEBUG_WORKFLOW_SOFIA.md** | Guia passo-a-passo para debugar no n8n | Quando já tem erro e precisa analisá-lo |
| **INSTRUCOES_EXECUCAO_TESTES.md** | Como rodar testes no seu servidor | Para testar endpoints localmente |
| **test-api-endpoints.js** | Script Node.js para testar API | Executar automaticamente após copiar |
| **test-api-endpoints.sh** | Script Bash para testar API | Alternativa ao Node (se preferir) |

---

## 🚀 Início Rápido (3 Passos)

### 1️⃣ Execute o teste de API
```bash
cd /seu-servidor/CliniSmart
node test-api-endpoints.js http://localhost:3000 SOFIA_CRM 5511987654321
```

### 2️⃣ Analise o resultado
- ✅ **Status 200**: Endpoint funciona, erro está em outro lugar
- ❌ **Status 400**: API rejeitou o `clinicId` → Veja Solução A
- ❌ **Status 404**: Endpoint não existe → Veja Solução B  
- ❌ **Status 500**: Erro na API → Veja logs

### 3️⃣ Corrija conforme o resultado
Veja **ANALISE_ERRO_URL_INVALIDA.md** → Seção "Possíveis Soluções"

---

## 🔍 Fluxograma de Debug

```
ERRO "URL inválida" no n8n
        ↓
Rode: node test-api-endpoints.js
        ↓
      ┌─ Qual foi o status?
      │
  ┌─ 400 ─┐
  │       └→ API rejeitou clinicId
  │          Veja: Solução A (clinicId deve ser ID numérico)
  │          Arquivo: ANALISE_ERRO_URL_INVALIDA.md
  │
  ├─ 404
  │       └→ Endpoint não existe nesse caminho
  │          Veja: Solução B (encontre endpoints corretos)
  │          Arquivo: ANALISE_ERRO_URL_INVALIDA.md
  │
  ├─ 500
  │       └→ Erro no backend
  │          Veja logs: docker logs / pm2 logs
  │          Arquivo: ANALISE_ERRO_URL_INVALIDA.md
  │
  └─ Timeout (não conecta)
          └→ API não está rodando
             Veja: INSTRUCOES_EXECUCAO_TESTES.md → Passo 2
```

---

## 🎓 Roteiro Completo de Resolução

### Fase 1: Preparação
- [ ] Leia o sumário (este arquivo)
- [ ] Copie os arquivos para seu servidor
- [ ] Abra **ANALISE_ERRO_URL_INVALIDA.md** para entender as causas

### Fase 2: Testes
- [ ] Execute `node test-api-endpoints.js` 
- [ ] Anote qual endpoint está falhando
- [ ] Anote o status code (400, 404, 500, etc.)
- [ ] Veja a mensagem de erro exata

### Fase 3: Análise
- [ ] Abra **ANALISE_ERRO_URL_INVALIDA.md**
- [ ] Identifique qual solução se aplica (A, B ou C)
- [ ] Se precisar inspecionar no n8n: use **DEBUG_WORKFLOW_SOFIA.md**

### Fase 4: Correção
- [ ] Implemente a solução identificada
- [ ] Atualize o workflow Sofia no n8n
- [ ] Salve as mudanças
- [ ] Execute o teste novamente

### Fase 5: Verificação
- [ ] Envie uma mensagem de teste via WhatsApp
- [ ] Vá para **Executions** no n8n
- [ ] Verifique se todas as ferramentas executaram com sucesso
- [ ] Confirme que a resposta foi enviada ao CRM

---

## ⚡ Problemas Comuns e Soluções Rápidas

### "URL inválida" + Status 400
**Causa**: clinicId está com valor errado  
**Solução**: Mapeie `SOFIA_CRM` para ID numérico (ex: 1)
```javascript
{{ $node["CRM Webhook Trigger"].json.corpo.instância === "SOFIA_CRM" ? "1" : "2" }}
```
**Arquivo**: ANALISE_ERRO_URL_INVALIDA.md → Solução A

---

### "URL inválida" + Status 404
**Causa**: Caminho do endpoint está errado  
**Solução**: Encontrar os endpoints corretos em `src/app/api/`
**Arquivo**: ANALISE_ERRO_URL_INVALIDA.md → Solução B

---

### "URL inválida" + Status 500
**Causa**: Erro interno na API  
**Solução**: Verificar logs
```bash
docker logs clinismart-api
# ou
pm2 logs
```
**Arquivo**: ANALISE_ERRO_URL_INVALIDA.md → Solução C

---

### Não consegue conectar (timeout)
**Causa**: API não está rodando ou URL base está errada  
**Solução**: Verificar:
1. API está rodando? (`docker ps`, `pm2 list`)
2. URL base está correta? (localhost vs domínio vs IP)
3. Porta está correta? (3000, 5000, etc.)

**Arquivo**: INSTRUCOES_EXECUCAO_TESTES.md → Passo 2

---

## 🔧 Scripts Disponíveis

### Option 1: Node.js (Recomendado)
```bash
node test-api-endpoints.js http://localhost:3000 SOFIA_CRM 5511987654321
```

### Option 2: Bash/Curl
```bash
chmod +x test-api-endpoints.sh
./test-api-endpoints.sh http://localhost:3000 SOFIA_CRM 5511987654321
```

### Option 3: Manual com Curl
```bash
curl -X POST http://localhost:3000/api/whatsapp/tools/get-clinic-data \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"SOFIA_CRM","patientPhone":"5511987654321"}'
```

---

## 📊 Checklist Pré-Execução

Antes de rodar qualquer teste, certifique-se que:

- [ ] A API do CliniSmart está rodando
  ```bash
  # Verificar
  docker ps | grep clinismart
  # ou
  ps aux | grep node
  ```

- [ ] O n8n está rodando
  ```bash
  # Verificar
  docker ps | grep n8n
  # ou
  curl http://localhost:5678
  ```

- [ ] Tem acesso ao banco de dados PostgreSQL
  ```bash
  psql -U usuario -d clinismart -c "SELECT version();"
  ```

- [ ] Node.js está instalado (v14+)
  ```bash
  node --version
  ```

---

## 💬 Informações Importantes

### Estrutura do Webhook da Evolution API
```json
{
  "corpo": {
    "instância": "SOFIA_CRM",           // ← Sempre enviado
    "clinicName": "Clínica XYZ",        // ← Pode estar vazio
    "dados": {
      "chave": {
        "remoteJid": "5511987654321@s.whatsapp.net"  // ← Sempre enviado
      },
      "mensagem": {
        "conversa": "Texto da mensagem do paciente"   // ← Sempre enviado
      }
    }
  }
}
```

### Expressões Usadas Atualmente no Workflow
```javascript
// clinicId
{{ $node["CRM Webhook Trigger"].json.corpo.instância }}

// patientPhone
{{ $node["CRM Webhook Trigger"].json.corpo.dados?.chave?.remoteJid?.replace('@s.whatsapp.net', '') }}

// Patient Message
{{ $node["CRM Webhook Trigger"].json.corpo.dados?.mensagem?.conversa || "" }}
```

---

## 🆘 Se Não Conseguir Resolver

Quando contactar para suporte, tenha pronto:

1. **Saída do teste**:
   ```bash
   node test-api-endpoints.js ... > teste-resultado.txt 2>&1
   ```

2. **Screenshot do erro no n8n**:
   - Acesse Executions
   - Clique na execução com erro
   - Print do painel com o erro

3. **Logs da API**:
   ```bash
   docker logs clinismart-api > api-logs.txt 2>&1
   # ou
   pm2 logs > api-logs.txt 2>&1
   ```

4. **Informações do ambiente**:
   ```bash
   echo "Node: $(node --version)"
   echo "Docker: $(docker --version)"
   echo "DB: $(psql -U user -d clinismart -c 'SELECT version();')"
   ```

Com essas informações, conseguimos identificar o problema rapidamente.

---

## 📞 Resumo

| Fase | Ação | Arquivo |
|------|------|---------|
| Entender | Leia as 3 hipóteses | ANALISE_ERRO_URL_INVALIDA.md |
| Testar | Execute o script | test-api-endpoints.js |
| Debugar | Use o guia no n8n | DEBUG_WORKFLOW_SOFIA.md |
| Corrigir | Implemente solução | ANALISE_ERRO_URL_INVALIDA.md |
| Verificar | Teste novamente | Envie mensagem WhatsApp |

---

**Última atualização**: 2026-04-12  
**Status**: 5 arquivos criados, pronto para execução  
**Próximo passo**: Copie os arquivos para seu servidor e execute `node test-api-endpoints.js`
