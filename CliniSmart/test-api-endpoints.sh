#!/bin/bash
# Script para testar os endpoints da API do CliniSmart
# Uso: ./test-api-endpoints.sh <BASE_URL> <CLINIC_ID> <PATIENT_PHONE>
# Exemplo: ./test-api-endpoints.sh http://localhost:3000 SOFIA_CRM 5511987654321

BASE_URL=${1:-"http://localhost:3000"}
CLINIC_ID=${2:-"SOFIA_CRM"}
PATIENT_PHONE=${3:-"5511987654321"}

echo "================================================"
echo "Teste de Endpoints da API CliniSmart"
echo "================================================"
echo ""
echo "Base URL: $BASE_URL"
echo "Clinic ID: $CLINIC_ID"
echo "Patient Phone: $PATIENT_PHONE"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local METHOD=$1
    local ENDPOINT=$2
    local BODY=$3
    local DESCRIPTION=$4

    echo ""
    echo -e "${YELLOW}Testando: $DESCRIPTION${NC}"
    echo "Método: $METHOD"
    echo "URL: $BASE_URL$ENDPOINT"

    if [ -z "$BODY" ]; then
        echo "Body: (vazio)"
        RESPONSE=$(curl -s -w "\n%{http_code}" -X $METHOD "$BASE_URL$ENDPOINT" \
            -H "Content-Type: application/json")
    else
        echo "Body: $BODY"
        RESPONSE=$(curl -s -w "\n%{http_code}" -X $METHOD "$BASE_URL$ENDPOINT" \
            -H "Content-Type: application/json" \
            -d "$BODY")
    fi

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY_RESPONSE=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo -e "${GREEN}Status: $HTTP_CODE (OK)${NC}"
    else
        echo -e "${RED}Status: $HTTP_CODE (ERRO)${NC}"
    fi

    echo "Resposta:"
    echo "$BODY_RESPONSE" | jq '.' 2>/dev/null || echo "$BODY_RESPONSE"
    echo ""
}

# Teste 1: get_clinic_data
test_endpoint "POST" "/api/whatsapp/tools/get-clinic-data" \
    "{\"clinicId\":\"$CLINIC_ID\",\"patientPhone\":\"$PATIENT_PHONE\"}" \
    "get_clinic_data"

# Teste 2: get_patient_history
test_endpoint "POST" "/api/whatsapp/tools/get-patient-history" \
    "{\"clinicId\":\"$CLINIC_ID\",\"patientPhone\":\"$PATIENT_PHONE\"}" \
    "get_patient_history"

# Teste 3: check_availability
test_endpoint "POST" "/api/whatsapp/tools/check-availability" \
    "{\"clinicId\":\"$CLINIC_ID\",\"specialty\":\"Geral\",\"date\":\"2026-04-15\"}" \
    "check_availability"

# Teste 4: schedule_appointment
test_endpoint "POST" "/api/whatsapp/tools/schedule" \
    "{\"clinicId\":\"$CLINIC_ID\",\"patientPhone\":\"$PATIENT_PHONE\",\"specialty\":\"Geral\",\"date\":\"2026-04-15\",\"time\":\"10:00\",\"doctorId\":\"1\"}" \
    "schedule_appointment"

# Teste 5: cancel_appointment
test_endpoint "POST" "/api/whatsapp/tools/cancel-appointment" \
    "{\"clinicId\":\"$CLINIC_ID\",\"appointmentId\":\"1\"}" \
    "cancel_appointment"

echo ""
echo "================================================"
echo "Resumo dos Testes"
echo "================================================"
echo ""
echo "Se todos os testes retornarem status 200 ou 201, os endpoints estão OK."
echo "Se retornar 404, o endpoint não existe nesse caminho."
echo "Se retornar 400 ou 500, há um problema nos parâmetros ou na API."
echo ""
echo "Próximas ações:"
echo "1. Se 404: Procure pelos endpoints corretos em src/app/api/"
echo "2. Se 400: Verifique o formato do JSON esperado"
echo "3. Se 500: Verifique os logs da API para erros"
echo ""
