# Guia Prático: Debug do Workflow Sofia v3

## Objetivo
Identificar exatamente qual é a mensagem de erro "URL inválida" e em qual ferramenta (tool) está ocorrendo.

---

## Passo 1: Acessar o Workflow no n8n

1. Acesse o **n8n Dashboard** (http://seu-n8n:5678)
2. Clique no workflow **Sofia - Gestora de CRM v3 (PRODUÇÃO)**
3. Vá para a aba **Executions** (Execuções)
4. Procure a execução mais recente que tem status de **erro** (vermelho)

---

## Passo 2: Inspecionar a Execução com Erro

1. Clique na execução com erro
2. Você verá um diagrama do workflow com os nós coloridos:
   - ✅ **Verde**: Executado com sucesso
   - ❌ **Vermelho**: Executado com erro
   - ⚪ **Branco**: Não foi executado

3. **Identifique qual nó está vermelho** - esse é o que está causando o erro

---

## Passo 3: Expandir os Detalhes do Erro

1. Clique no **nó vermelho** (por exemplo, `get_clinic_data`)
2. No painel à direita, você verá:
   - **Input**: Dados que foram enviados PARA o nó
   - **Output**: Resposta recebida DO nó (ou mensagem de erro)

3. Expanda a seção **Output** para ver o erro completo

---

## Passo 4: Analisar a Mensagem de Erro

### Se o erro é "URL inválida":

**Procure por uma das seguintes mensagens:**

```
Error: Invalid URL: undefined
Error: Invalid URL: null
Error: Invalid URL: {{}}
Error: Invalid URL: SOPHIA_CRM (ou outro valor estranho)
```

**Se vê "undefined" ou "null":**
- Significa que uma variável não foi preenchida corretamente
- Vá para **Passo 5A** (Verificar Expressões)

**Se vé um valor estranho:**
- Significa que a URL está sendo construída com dados inválidos
- Vá para **Passo 5B** (Verificar URL Base)

---

## Passo 5A: Verificar Expressões do Webhook

### Cenário: Erro diz "undefined" ou "null"

1. No workflow, clique no nó **CRM Webhook Trigger**
2. Procure pelas expressões que extraem valores:

   - **clinicId**: 
     ```javascript
     {{ $node["CRM Webhook Trigger"].json.corpo.instância }}
     ```
   - **patientPhone**:
     ```javascript
     {{ $node["CRM Webhook Trigger"].json.corpo.dados?.chave?.remoteJid?.replace('@s.whatsapp.net', '') }}
     ```

3. Clique em **Test the workflow** (ou envie uma mensagem de teste via WhatsApp)

4. Quando a execução terminar, volte para **Executions** e clique na nova execução

5. Clique no nó **CRM Webhook Trigger** para ver o **Output**

6. Procure pelas chaves:
   ```json
   {
     "corpo": {
       "instância": "??",  // Deve ter um valor
       "dados": {
         "chave": {
           "remoteJid": "???"  // Deve ter um valor
         }
       }
     }
   }
   ```

**Se algum valor está diferente do esperado:**
- Ajuste a expressão de extração
- Exemplo: Se `remoteJid` é `55119876543211` (sem @s.whatsapp.net), ajuste o `.replace()`

---

## Passo 5B: Verificar URL Base dos Tools

1. No workflow, clique em um dos nós **Tool HTTP Request** (ex: `get_clinic_data`)
2. Vá para a aba **General**
3. Verifique o campo **URL**

**Deve estar assim:**
```
http://localhost:3000/api/whatsapp/tools/get-clinic-data
```

OU

```
http://api:3000/api/whatsapp/tools/get-clinic-data
```

OU 

```
https://seu-dominio.com/api/whatsapp/tools/get-clinic-data
```

**Pergunte-se:**
1. ✓ O hostname está correto? (localhost vs api vs domínio)
2. ✓ A porta está correta? (3000, 5000, 8000, etc.)
3. ✓ O caminho está correto? (/api/whatsapp/tools/...)

**Se algo estiver errado:**
- Corrija a URL
- Teste novamente enviando uma mensagem via WhatsApp

---

## Passo 6: Testar a URL Manualmente

Se ainda não conseguiu identificar o erro, teste a URL diretamente:

### Opção 1: Via Terminal (curl)

```bash
curl -X POST http://localhost:3000/api/whatsapp/tools/get-clinic-data \
  -H "Content-Type: application/json" \
  -d '{
    "clinicId": "SOFIA_CRM",
    "patientPhone": "5511987654321"
  }'
```

**Resultado esperado:**
- Se 200/201: `{"success": true, ...}`
- Se 400: `{"error": "Invalid clinic ID"}`
- Se 404: `{"error": "Not Found"}`

### Opção 2: Via n8n

1. Crie um novo workflow de teste
2. Adicione um nó **HTTP Request**
3. Configure:
   - **Method**: POST
   - **URL**: http://localhost:3000/api/whatsapp/tools/get-clinic-data
   - **Body** (JSON):
     ```json
     {
       "clinicId": "SOFIA_CRM",
       "patientPhone": "5511987654321"
     }
     ```
4. Clique em **Execute Node** (o botão de play ao lado do nó)
5. Veja o resultado

---

## Passo 7: Analisar a Resposta da API

Quando conseguir fazer a requisição chegar na API, procure por:

### Se receber um erro 400:
```json
{
  "error": "Invalid clinic ID: SOFIA_CRM"
}
```

**Solução**: A API não aceita `SOFIA_CRM` como ID válido
- Vá para o repositório GitHub
- Procure como os IDs de clínica são gerados/armazenados
- Ajuste a expressão para usar um ID numérico ou UUID real

### Se receber um erro 404:
```json
{
  "error": "Not Found"
}
```

**Solução**: O endpoint não existe nesse caminho
- Procure pelos endpoints corretos em `src/app/api/`
- Atualize as URLs no workflow

### Se receber um erro 500:
```json
{
  "error": "Internal Server Error"
}
```

**Solução**: Há um erro na API
- Verifique os logs da API: `docker logs clinismart-api` ou `pm2 logs`
- Procure por stack traces

---

## Checklist Final de Debug

- [ ] Acessou **Executions** no n8n
- [ ] Identificou qual **nó tem erro** (vermelho)
- [ ] Expandiu o **Output** do nó com erro
- [ ] Anotou a **mensagem exata** do erro
- [ ] Verificou se é "URL inválida" (malformed URL) ou "Invalid URL"
- [ ] Testou a URL manualmente com curl
- [ ] Verificou a resposta da API (status code + body)
- [ ] Identificou a causa raiz:
  - [ ] Expressão extraindo valor errado (undefined/null)
  - [ ] URL base ou caminho incorreto
  - [ ] API rejeitando o clinicId (formato errado)
  - [ ] Endpoint não existe
  - [ ] Erro interno da API

---

## Próximas Ações Após Identificar o Erro

### Se é problema de expressão:
1. Ajuste a expressão no nó **CRM Webhook Trigger**
2. Teste novamente

### Se é problema de URL:
1. Corrija a URL no nó **Tool HTTP Request**
2. Ou altere o hostname/porta conforme necessário

### Se é problema de API:
1. Acesse o repositório GitHub
2. Procure pela rota/endpoint
3. Estude o formato esperado
4. Ajuste o workflow ou o backend conforme necessário

---

## Dúvidas Frequentes

**P: Como envio uma mensagem de teste pelo WhatsApp?**
R: Envie uma mensagem para o número configurado na Evolution API. O webhook deve ser acionado automaticamente.

**P: Como vejo os logs da API?**
R: Depende de como ela está rodando:
- Docker: `docker logs <container_name>`
- PM2: `pm2 logs`
- Node/npm: `npm run dev` (veja o console)

**P: Como sou qual é o valor real de `corpo.instância`?**
R: Execute o workflow uma vez, vá para a execução, clique no nó CRM Webhook Trigger e veja o Output.

**P: A URL precisa ser HTTP ou HTTPS?**
R: Depende do ambiente:
- Local: HTTP (http://localhost:3000)
- Produção: HTTPS (https://seu-dominio.com)

---
