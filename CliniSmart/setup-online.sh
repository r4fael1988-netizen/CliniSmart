#!/bin/bash

# ============================================================
# 🚀 SCRIPT DE SETUP - Deixar Sofia Online
# ============================================================

echo "🚀 CONFIGURANDO SOFIA PARA PRODUÇÃO"
echo "=================================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================
# PASSO 1: VALIDAR CONFIGURAÇÕES
# ============================================================

echo -e "${CYAN}PASSO 1: Validando configurações...${NC}"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js não está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"

# Verificar n8n API
if [ -z "$N8N_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  N8N_API_KEY não foi definida${NC}"
    echo -e "${YELLOW}   Execute assim para usar a chave:${NC}"
    echo -e "${CYAN}   N8N_API_KEY=sua_chave_aqui ./setup-online.sh${NC}"
    echo ""
fi

# Verificar PostgreSQL
if command -v psql &> /dev/null; then
    if psql -U usuario -d clinismart -c "SELECT 1;" 2>/dev/null | grep -q 1; then
        echo -e "${GREEN}✓ PostgreSQL: Conectado${NC}"

        # Descobrir ID da clínica
        CLINIC_ID=$(psql -U usuario -d clinismart -c "SELECT id FROM clinics WHERE instance_name='SOFIA_CRM' LIMIT 1;" 2>/dev/null | grep -oE '[0-9]+' | head -1)
        if [ -z "$CLINIC_ID" ]; then
            CLINIC_ID=1
            echo -e "${YELLOW}⚠️  Usando clinic ID padrão: 1${NC}"
        else
            echo -e "${GREEN}✓ Clinic ID descoberto: ${CLINIC_ID}${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  PostgreSQL: Não conseguiu conectar${NC}"
        CLINIC_ID=1
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL: Não instalado localmente${NC}"
    CLINIC_ID=1
fi

echo ""

# ============================================================
# PASSO 2: VALIDAR API
# ============================================================

echo -e "${CYAN}PASSO 2: Validando API (clini-smart.vercel.app)...${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://clini-smart.vercel.app/api/whatsapp/tools/get-clinic-data" \
  -H "Content-Type: application/json" \
  -d "{\"clinicId\":\"${CLINIC_ID}\",\"patientPhone\":\"5511987654321\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ API respondendo (Status: $HTTP_CODE)${NC}"
elif [ "$HTTP_CODE" = "400" ]; then
    echo -e "${RED}✗ API retornou 400 (clinicId pode ser inválido)${NC}"
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "${RED}✗ API retornou 404 (endpoint não encontrado)${NC}"
else
    echo -e "${YELLOW}⚠️  API retornou: $HTTP_CODE${NC}"
fi

echo ""

# ============================================================
# PASSO 3: LISTAR WORKFLOW IDs
# ============================================================

if [ -n "$N8N_API_KEY" ]; then
    echo -e "${CYAN}PASSO 3: Listando workflows no n8n...${NC}"
    echo ""

    WORKFLOWS=$(curl -s -X GET "http://localhost:5678/rest/workflows" \
      -H "X-N8N-API-KEY: $N8N_API_KEY" | grep -o '"name":"[^"]*"' | head -5)

    if [ -n "$WORKFLOWS" ]; then
        echo -e "${GREEN}✓ Workflows encontrados:${NC}"
        echo "$WORKFLOWS" | sed 's/"name":"/  - /g' | sed 's/"//g'
    else
        echo -e "${YELLOW}⚠️  Nenhum workflow encontrado${NC}"
        echo -e "${YELLOW}   Verifique se N8N_API_KEY está correta${NC}"
    fi

    echo ""
fi

# ============================================================
# PASSO 4: INFORMAÇÕES PARA PRÓXIMAS AÇÕES
# ============================================================

echo -e "${CYAN}PASSO 4: Resumo e Próximos Passos${NC}"
echo ""

echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}CONFIGURAÇÕES DESCOBERTAS:${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "API URL: ${GREEN}https://clini-smart.vercel.app${NC}"
echo -e "Clinic ID: ${GREEN}${CLINIC_ID}${NC}"
echo -e "HTTP Status: ${GREEN}${HTTP_CODE}${NC}"
echo ""

echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}PRÓXIMAS AÇÕES:${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ API está funcionando!${NC}"
    echo ""
    echo "1. Execute o script de atualização do workflow:"
    echo -e "   ${CYAN}N8N_API_KEY=sua_chave node auto-fix-workflow.js${NC}"
    echo ""
    echo "2. Ou acesse manualmente o n8n:"
    echo -e "   ${CYAN}http://localhost:5678${NC}"
    echo ""
    echo "3. Mude o clinic_id para: ${CLINIC_ID}"
    echo ""
    echo "4. Teste enviando mensagem via WhatsApp"
else
    echo "A API pode estar offline ou com problema"
    echo ""
    echo "Verifique:"
    echo "  1. Se clini-smart.vercel.app está online"
    echo "  2. Se os endpoints existem"
    echo "  3. Acesse: https://clini-smart.vercel.app/api/health"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Setup concluído!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
