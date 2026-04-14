#!/usr/bin/env node

/**
 * Script para testar os endpoints da API do CliniSmart
 *
 * Uso: node test-api-endpoints.js [baseUrl] [clinicId] [patientPhone]
 * Exemplo: node test-api-endpoints.js http://localhost:3000 SOFIA_CRM 5511987654321
 */

const http = require('http');
const https = require('https');
const url = require('url');

const args = process.argv.slice(2);
const BASE_URL = args[0] || 'http://localhost:3000';
const CLINIC_ID = args[1] || 'SOFIA_CRM';
const PATIENT_PHONE = args[2] || '5511987654321';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

console.log('\n' + '='.repeat(50));
console.log('Teste de Endpoints da API CliniSmart');
console.log('='.repeat(50));
console.log(`\nBase URL: ${BASE_URL}`);
console.log(`Clinic ID: ${CLINIC_ID}`);
console.log(`Patient Phone: ${PATIENT_PHONE}\n`);

/**
 * Faz uma requisição HTTP/HTTPS e retorna a resposta
 */
async function makeRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${endpoint}`;
    const parsedUrl = new URL(fullUrl);

    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const req = protocol.request(fullUrl, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Testa um endpoint específico
 */
async function testEndpoint(method, endpoint, body, description) {
  console.log(`\n${colors.yellow}Testando: ${description}${colors.reset}`);
  console.log(`Método: ${method}`);
  console.log(`URL: ${BASE_URL}${endpoint}`);
  console.log(`Body: ${JSON.stringify(body, null, 2)}`);

  try {
    const response = await makeRequest(method, endpoint, body);

    const isSuccess = response.statusCode >= 200 && response.statusCode < 300;
    const statusColor = isSuccess ? colors.green : colors.red;

    console.log(`${statusColor}Status: ${response.statusCode}${colors.reset}`);

    try {
      const parsedBody = JSON.parse(response.body);
      console.log('Resposta:');
      console.log(JSON.stringify(parsedBody, null, 2));
    } catch (e) {
      console.log('Resposta:');
      console.log(response.body);
    }

    return {
      success: isSuccess,
      statusCode: response.statusCode,
      endpoint: endpoint,
    };
  } catch (error) {
    console.log(`${colors.red}Erro: ${error.message}${colors.reset}`);
    return {
      success: false,
      error: error.message,
      endpoint: endpoint,
    };
  }
}

/**
 * Executa todos os testes
 */
async function runAllTests() {
  const results = [];

  // Teste 1: get_clinic_data
  results.push(await testEndpoint(
    'POST',
    '/api/whatsapp/tools/get-clinic-data',
    {
      clinicId: CLINIC_ID,
      patientPhone: PATIENT_PHONE,
    },
    'get_clinic_data'
  ));

  // Teste 2: get_patient_history
  results.push(await testEndpoint(
    'POST',
    '/api/whatsapp/tools/get-patient-history',
    {
      clinicId: CLINIC_ID,
      patientPhone: PATIENT_PHONE,
    },
    'get_patient_history'
  ));

  // Teste 3: check_availability
  results.push(await testEndpoint(
    'POST',
    '/api/whatsapp/tools/check-availability',
    {
      clinicId: CLINIC_ID,
      specialty: 'Geral',
      date: '2026-04-15',
    },
    'check_availability'
  ));

  // Teste 4: schedule_appointment
  results.push(await testEndpoint(
    'POST',
    '/api/whatsapp/tools/schedule',
    {
      clinicId: CLINIC_ID,
      patientPhone: PATIENT_PHONE,
      specialty: 'Geral',
      date: '2026-04-15',
      time: '10:00',
      doctorId: '1',
    },
    'schedule_appointment'
  ));

  // Teste 5: cancel_appointment
  results.push(await testEndpoint(
    'POST',
    '/api/whatsapp/tools/cancel-appointment',
    {
      clinicId: CLINIC_ID,
      appointmentId: '1',
    },
    'cancel_appointment'
  ));

  // Resumo
  console.log('\n' + '='.repeat(50));
  console.log('Resumo dos Testes');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n${colors.green}✓ Passou: ${passed}${colors.reset}`);
  console.log(`${colors.red}✗ Falhou: ${failed}${colors.reset}`);

  console.log('\n📋 Detalhes:');
  results.forEach(result => {
    const symbol = result.success ? '✓' : '✗';
    const color = result.success ? colors.green : colors.red;
    console.log(`${color}${symbol}${colors.reset} ${result.endpoint} - Status ${result.statusCode || 'N/A'}`);
  });

  console.log('\n💡 Próximas ações:');
  console.log('1. Se 404: Procure pelos endpoints corretos em src/app/api/');
  console.log('2. Se 400: Verifique o formato do JSON esperado');
  console.log('3. Se 500: Verifique os logs da API para erros');
  console.log('4. Se falhar conectar: Verifique se a API está rodando em', BASE_URL);
  console.log('');
}

// Executar testes
runAllTests().catch(error => {
  console.error(`${colors.red}Erro fatal: ${error.message}${colors.reset}`);
  process.exit(1);
});
