import fetch from 'node-fetch';

const N8N_URL = "https://lostbaskingshark-n8n.cloudfy.live";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
const CRM_URL = "https://clini-smart.vercel.app";
const WEBHOOK_SECRET = "clini-smart-auth-2026";
const WORKFLOW_ID = "BjwUCePiiDsooc4C";

async function updateWorkflow() {
  console.log("🚀 Aplicando correções de Placeholders e Output Parser no n8n...");

  const authHeader = `Bearer ${WEBHOOK_SECRET}`;

  const nodes = [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-entrada",
        "options": {}
      },
      "id": "1",
      "name": "Evolution API Recebe Mensagem",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": `=${CRM_URL}/api/whatsapp/config/{{$json.body.instance}}`,
        "sendQuery": true,
        "queryParameters": {
          "parameters": []
        },
        "options": {}
      },
      "id": "2",
      "name": "Pegar Persona do CRM",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "model": "gpt-4-turbo-preview",
        "options": {}
      },
      "id": "3",
      "name": "OpenAI Chat Model",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1,
      "position": [650, 500],
      "credentials": {
        "openAiApi": {
          "id": "VXfPUQYU0OWKOwSR",
          "name": "OpenAi account"
        }
      }
    },
    {
      "parameters": {
        "options": {}
      },
      "id": "4",
      "name": "Agente AI",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.1,
      "position": [800, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": `${CRM_URL}/api/whatsapp/tools/check-availability`,
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Authorization", "value": authHeader }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "{\"clinicId\": \"{{$node[\\\"Pegar Persona do CRM\\\"].json[\\\"clinicId\\\"]}}\", \"date\": \"{{$node[\\\"CRM: Disponibilidade\\\"].json[\\\"date\\\"]}}\", \"specialty\": \"{{$node[\\\"CRM: Disponibilidade\\\"].json[\\\"specialty\\\"]}}\"}",
        "placeholderDefinitions": {
          "values": [
            { "name": "date", "description": "Data para consulta (YYYY-MM-DD)", "type": "string", "required": true },
            { "name": "specialty", "description": "Especialidade médica", "type": "string", "required": false }
          ]
        },
        "toolDescription": "Consulta horários disponíveis para uma especialidade em uma data específica."
      },
      "id": "5",
      "name": "CRM: Disponibilidade",
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1.1,
      "position": [1100, 50]
    },
    {
      "parameters": {
        "method": "POST",
        "url": `${CRM_URL}/api/whatsapp/tools/schedule`,
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Authorization", "value": authHeader }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "{\"clinicId\": \"{{$node[\\\"Pegar Persona do CRM\\\"].json[\\\"clinicId\\\"]}}\", \"patientPhone\": \"{{$node[\\\"Evolution API Recebe Mensagem\\\"].json[\\\"body\\\"][\\\"data\\\"][\\\"key\\\"][\\\"remoteJid\\\"]}}\", \"date\": \"{{$node[\\\"CRM: Agendar\\\"].json[\\\"date\\\"]}}\", \"time\": \"{{$node[\\\"CRM: Agendar\\\"].json[\\\"time\\\"]}}\", \"doctorId\": \"{{$node[\\\"CRM: Agendar\\\"].json[\\\"doctorId\\\"]}}\", \"specialty\": \"{{$node[\\\"CRM: Agendar\\\"].json[\\\"specialty\\\"]}}\"}",
        "placeholderDefinitions": {
          "values": [
            { "name": "date", "description": "Data (YYYY-MM-DD)", "type": "string", "required": true },
            { "name": "time", "description": "Horário (HH:mm)", "type": "string", "required": true },
            { "name": "doctorId", "description": "ID do médico", "type": "string", "required": true },
            { "name": "specialty", "description": "Especialidade", "type": "string", "required": true }
          ]
        },
        "toolDescription": "Realiza o agendamento de uma consulta no CRM."
      },
      "id": "6",
      "name": "CRM: Agendar",
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1.1,
      "position": [1100, 150]
    },
    {
      "parameters": {
        "method": "POST",
        "url": `${CRM_URL}/api/whatsapp/tools/get-patient-history`,
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Authorization", "value": authHeader }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "{\"clinicId\": \"{{$node[\\\"Pegar Persona do CRM\\\"].json[\\\"clinicId\\\"]}}\", \"patientPhone\": \"{{$node[\\\"Evolution API Recebe Mensagem\\\"].json[\\\"body\\\"][\\\"data\\\"][\\\"key\\\"][\\\"remoteJid\\\"]}}\"}",
        "toolDescription": "Busca o histórico de consultas e interações do paciente logado pelo telefone."
      },
      "id": "7",
      "name": "CRM: Histórico",
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1.1,
      "position": [1100, 250]
    },
    {
      "parameters": {
        "method": "POST",
        "url": `${CRM_URL}/api/whatsapp/tools/get-clinic-data`,
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Authorization", "value": authHeader }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "{\"clinicId\": \"{{$node[\\\"Pegar Persona do CRM\\\"].json[\\\"clinicId\\\"]}}\"}",
        "toolDescription": "Retorna os médicos e serviços disponíveis na clínica para orientar o paciente."
      },
      "id": "8",
      "name": "CRM: Dados Clínica",
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1.1,
      "position": [1100, 350]
    },
    {
      "parameters": {
        "method": "POST",
        "url": `${CRM_URL}/api/whatsapp/tools/cancel-appointment`,
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Authorization", "value": authHeader }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "{\"appointmentId\": \"{{$node[\\\"CRM: Cancelar\\\"].json[\\\"appointmentId\\\"]}}\", \"patientPhone\": \"{{$node[\\\"Evolution API Recebe Mensagem\\\"].json[\\\"body\\\"][\\\"data\\\"][\\\"key\\\"][\\\"remoteJid\\\"]}}\"}",
        "placeholderDefinitions": {
          "values": [
            { "name": "appointmentId", "description": "ID do agendamento a ser cancelado", "type": "string", "required": true }
          ]
        },
        "toolDescription": "Cancela um agendamento existente no CRM."
      },
      "id": "9",
      "name": "CRM: Cancelar",
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1.1,
      "position": [1100, 450]
    },
    {
      "parameters": {
        "schemaType": "manual",
        "inputSchema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"reply\": {\n      \"type\": \"string\",\n      \"description\": \"A resposta final para o paciente\"\n    }\n  }\n}"
      },
      "id": "10",
      "name": "Structured Output Parser",
      "type": "@n8n/n8n-nodes-langchain.outputParserStructured",
      "typeVersion": 1.1,
      "position": [800, 500]
    }
  ];

  const connections = {
    "Evolution API Recebe Mensagem": {
      "main": [[{ "node": "Pegar Persona do CRM", "type": "main", index: 0 }]]
    },
    "Pegar Persona do CRM": {
      "main": [[{ "node": "Agente AI", "type": "main", index: 0 }]]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [[{ "node": "Agente AI", "type": "ai_languageModel", index: 0 }]]
    },
    "CRM: Disponibilidade": {
      "ai_tool": [[{ "node": "Agente AI", "type": "ai_tool", index: 0 }]]
    },
    "CRM: Agendar": {
      "ai_tool": [[{ "node": "Agente AI", "type": "ai_tool", index: 0 }]]
    },
    "CRM: Histórico": {
      "ai_tool": [[{ "node": "Agente AI", "type": "ai_tool", index: 0 }]]
    },
    "CRM: Dados Clínica": {
      "ai_tool": [[{ "node": "Agente AI", "type": "ai_tool", index: 0 }]]
    },
    "CRM: Cancelar": {
      "ai_tool": [[{ "node": "Agente AI", "type": "ai_tool", index: 0 }]]
    },
    "Structured Output Parser": {
      "ai_outputParser": [[{ "node": "Agente AI", "type": "ai_outputParser", index: 0 }]]
    }
  };

  try {
    const res = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": API_KEY
      },
      body: JSON.stringify({
        name: "CliniSmart AI Agent - MultiTenant (Gerado Automático)",
        nodes,
        connections,
        settings: {
          executionOrder: "v1"
        }
      })
    });

    if (res.ok) {
      console.log("✅ Workflow Sofia corrigido com sucesso!");
    } else {
      const err = await res.text();
      console.error("❌ Falha na correção do workflow:", err);
    }
  } catch (error) {
    console.error("Erro na comunicação:", error);
  }
}

updateWorkflow();
