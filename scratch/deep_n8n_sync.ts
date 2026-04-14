import dotenv from "dotenv";

dotenv.config();

const N8N_API_KEY = process.env.N8N_API_KEY;
const WORKFLOW_ID = "bRQoyjQbfwsE9yRZ";
const BASE_URL = "https://lostbaskingshark-n8n.cloudfy.live/api/v1/workflows";
const CRM_BASE_URL = "https://clini-smart.vercel.app";
const AUTH_TOKEN = "clini-smart-auth-2026";

async function deepSync() {
  console.log("Iniciando DEEP SYNC - Padronização e Correção de Parâmetros...");

  const OPENAI_CRED_ID = "WREj7d8Xvscq2n9d";

  const workflow = {
    name: "Sofia - Gestora de CRM v3 (PRODUÇÃO)",
    nodes: [
      {
        parameters: { httpMethod: "POST", path: "crm-manager-agent-v1", options: {} },
        id: "webhook-trigger", name: "CRM Webhook Trigger", type: "n8n-nodes-base.webhook", typeVersion: 1, position: [380, 400]
      },
      {
        parameters: {
          options: {
            systemMessage: "={{ $json[\"masterPrompt\"] }}"
          }
        },
        id: "agent-sofia", name: "Agente Gerente Sofia", type: "@n8n/n8n-nodes-langchain.agent", typeVersion: 1.6, position: [700, 400]
      },
      {
        parameters: { modelName: "gpt-4o", options: { temperature: 0 } },
        id: "openai-model", name: "Modelo OpenAI", type: "@n8n/n8n-nodes-langchain.lmChatOpenAi", typeVersion: 1.1, position: [600, 600],
        credentials: { openAiApi: { id: OPENAI_CRED_ID } }
      },
      {
        parameters: { sessionId: "={{ $node[\"CRM Webhook Trigger\"].json.patientPhone }}", contextWindowLength: 10 },
        id: "memory-node", name: "Memória simples", type: "@n8n/n8n-nodes-langchain.memoryBufferWindow", typeVersion: 1.1, position: [750, 600]
      },
      // TOOLS WITH DEEP FIXES
      {
        parameters: {
          name: "get_clinic_data",
          description: "Use para obter informações sobre médicos, especialidades e serviços da clínica.",
          method: "POST", url: `${CRM_BASE_URL}/api/whatsapp/tools/get-clinic-data`,
          sendHeaders: true,
          headerParameters: { parameters: [ { name: "Authorization", value: `Bearer ${AUTH_TOKEN}` } ] },
          sendBody: true,
          bodyParameters: { parameters: [ { name: "clinicId", value: "={{ $node[\"CRM Webhook Trigger\"].json.clinicId }}" } ] }
        },
        id: "tool-data", name: "get_clinic_data", type: "@n8n/n8n-nodes-langchain.toolHttpRequest", typeVersion: 1.1, position: [950, 100]
      },
      {
        parameters: {
          name: "get_patient_history",
          description: "Use para consultar o histórico de agendamentos passados e futuros de um paciente específico.",
          method: "POST", url: `${CRM_BASE_URL}/api/whatsapp/tools/get-patient-history`,
          sendHeaders: true,
          headerParameters: { parameters: [ { name: "Authorization", value: `Bearer ${AUTH_TOKEN}` } ] },
          sendBody: true,
          bodyParameters: { parameters: [ 
            { name: "clinicId", value: "={{ $node[\"CRM Webhook Trigger\"].json.clinicId }}" },
            { name: "patientPhone", value: "={{ $node[\"CRM Webhook Trigger\"].json.patientPhone }}" }
          ] }
        },
        id: "tool-hist", name: "get_patient_history", type: "@n8n/n8n-nodes-langchain.toolHttpRequest", typeVersion: 1.1, position: [950, 200]
      },
      {
        parameters: {
          name: "check_availability",
          description: "Use para verificar horários disponíveis em uma data específica.",
          method: "POST", url: `${CRM_BASE_URL}/api/whatsapp/tools/check-availability`,
          sendHeaders: true,
          headerParameters: { parameters: [ { name: "Authorization", value: `Bearer ${AUTH_TOKEN}` } ] },
          sendBody: true,
          bodyParameters: { parameters: [ 
            { name: "clinicId", value: "={{ $node[\"CRM Webhook Trigger\"].json.clinicId }}" },
            { name: "date", value: "={{ $json.date }}" }
          ] }
        },
        id: "tool-avail", name: "check_availability", type: "@n8n/n8n-nodes-langchain.toolHttpRequest", typeVersion: 1.1, position: [950, 300]
      },
      {
        parameters: {
            name: "schedule_appointment",
            description: "Use para realizar o agendamento final de uma consulta após o paciente confirmar o horário.",
          method: "POST", url: `${CRM_BASE_URL}/api/whatsapp/tools/schedule`,
          sendHeaders: true,
          headerParameters: { parameters: [ { name: "Authorization", value: `Bearer ${AUTH_TOKEN}` } ] },
          sendBody: true,
          bodyParameters: { parameters: [ 
            { name: "clinicId", value: "={{ $node[\"CRM Webhook Trigger\"].json.clinicId }}" },
            { name: "patientPhone", value: "={{ $node[\"CRM Webhook Trigger\"].json.patientPhone }}" },
            { name: "date", value: "={{ $json.date }}" },
            { name: "serviceId", value: "={{ $json.serviceId }}" }
          ] }
        },
        id: "tool-sched", name: "schedule_appointment", type: "@n8n/n8n-nodes-langchain.toolHttpRequest", typeVersion: 1.1, position: [950, 400]
      },
      {
        parameters: {
          name: "cancel_appointment",
          description: "Use para cancelar um agendamento existente caso o paciente solicite.",
          method: "POST", url: `${CRM_BASE_URL}/api/whatsapp/tools/cancel-appointment`,
          sendHeaders: true,
          headerParameters: { parameters: [ { name: "Authorization", value: `Bearer ${AUTH_TOKEN}` } ] },
          sendBody: true,
          bodyParameters: { parameters: [ 
            { name: "clinicId", value: "={{ $node[\"CRM Webhook Trigger\"].json.clinicId }}" },
            { name: "patientPhone", value: "={{ $node[\"CRM Webhook Trigger\"].json.patientPhone }}" },
            { name: "appointmentId", value: "={{ $json.appointmentId }}" }
          ] }
        },
        id: "tool-cancel", name: "cancel_appointment", type: "@n8n/n8n-nodes-langchain.toolHttpRequest", typeVersion: 1.1, position: [950, 500]
      },
      {
        parameters: {
          method: "POST", url: `${CRM_BASE_URL}/api/whatsapp/send`,
          sendHeaders: true,
          headerParameters: { parameters: [ { name: "Authorization", value: `Bearer ${AUTH_TOKEN}` } ] },
          sendBody: true,
          bodyParameters: { parameters: [
            { name: "number", value: "={{ $node[\"CRM Webhook Trigger\"].json.patientPhone }}" },
            { name: "text", value: "={{ $json.output }}" },
            { name: "instance", value: "={{ $node[\"CRM Webhook Trigger\"].json.instance }}" }
          ] }
        },
        id: "send-node", name: "Enviar resposta ao CRM", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [1200, 400]
      }
    ],
    connections: {
      "CRM Webhook Trigger": { main: [ [ { node: "Agente Gerente Sofia", type: "main", index: 0 } ] ] },
      "Modelo OpenAI": { ai_languageModel: [ [ { node: "Agente Gerente Sofia", type: "ai_languageModel", index: 0 } ] ] },
      "Memória simples": { ai_memory: [ [ { node: "Agente Gerente Sofia", type: "ai_memory", index: 0 } ] ] },
      "get_clinic_data": { ai_tool: [ [ { node: "Agente Gerente Sofia", type: "ai_tool", index: 0 } ] ] },
      "get_patient_history": { ai_tool: [ [ { node: "Agente Gerente Sofia", type: "ai_tool", index: 0 } ] ] },
      "check_availability": { ai_tool: [ [ { node: "Agente Gerente Sofia", type: "ai_tool", index: 0 } ] ] },
      "schedule_appointment": { ai_tool: [ [ { node: "Agente Gerente Sofia", type: "ai_tool", index: 0 } ] ] },
      "cancel_appointment": { ai_tool: [ [ { node: "Agente Gerente Sofia", type: "ai_tool", index: 0 } ] ] },
      "Agente Gerente Sofia": { main: [ [ { node: "Enviar resposta ao CRM", type: "main", index: 0 } ] ] }
    },
    settings: { saveExecutionProgress: true, saveManualExecutions: true }
  };

  try {
    const updateResponse = await fetch(`${BASE_URL}/${WORKFLOW_ID}`, {
      method: "PUT",
      headers: { "X-N8N-API-KEY": N8N_API_KEY || "", "Content-Type": "application/json" },
      body: JSON.stringify(workflow)
    });
    if (updateResponse.ok) { console.log("n8n DEEP SYNC Concluído com Sucesso!"); }
    else { console.error("Erro no n8n:", await updateResponse.json()); }
  } catch (err: any) { console.error("Erro fatal:", err.message); }
}

deepSync();
