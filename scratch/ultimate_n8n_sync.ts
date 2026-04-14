import dotenv from "dotenv";

dotenv.config();

const N8N_API_KEY = process.env.N8N_API_KEY;
const WORKFLOW_ID = "bRQoyjQbfwsE9yRZ";
const BASE_URL = "https://lostbaskingshark-n8n.cloudfy.live/api/v1/workflows";
const CRM_BASE_URL = "https://clini-smart.vercel.app";
const NEW_SECRET = "clini-smart-auth-2026";

async function ultimateSync() {
  console.log("Iniciando Sincronização ULTIMATE - Todas as ferramentas + Segurança...");

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
      // TOOLS
      {
        parameters: {
          method: "POST", url: `${CRM_BASE_URL}/api/whatsapp/tools/get-clinic-data`,
          sendHeaders: true,
          headerParameters: { parameters: [ { name: "Authorization", value: `Bearer ${NEW_SECRET}` } ] },
          sendBody: true,
          bodyParameters: { parameters: [ { name: "clinicId", value: "={{ $node[\"CRM Webhook Trigger\"].json.clinicId }}" } ] }
        },
        id: "tool-data", name: "obter_dados_clínicos", type: "@n8n/n8n-nodes-langchain.toolHttpRequest", typeVersion: 1.1, position: [950, 100]
      },
      {
        parameters: {
          method: "POST", url: `${CRM_BASE_URL}/api/whatsapp/tools/get-patient-history`,
          sendHeaders: true,
          headerParameters: { parameters: [ { name: "Authorization", value: `Bearer ${NEW_SECRET}` } ] },
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
          method: "POST", url: `${CRM_BASE_URL}/api/whatsapp/tools/check-availability`,
          sendHeaders: true,
          headerParameters: { parameters: [ { name: "Authorization", value: `Bearer ${NEW_SECRET}` } ] },
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
          method: "POST", url: `${CRM_BASE_URL}/api/whatsapp/tools/schedule`,
          sendHeaders: true,
          headerParameters: { parameters: [ { name: "Authorization", value: `Bearer ${NEW_SECRET}` } ] },
          sendBody: true,
          bodyParameters: { parameters: [ 
            { name: "clinicId", value: "={{ $node[\"CRM Webhook Trigger\"].json.clinicId }}" },
            { name: "patientPhone", value: "={{ $node[\"CRM Webhook Trigger\"].json.patientPhone }}" },
            { name: "date", value: "={{ $json.date }}" },
            { name: "serviceId", value: "={{ $json.serviceId }}" }
          ] }
        },
        id: "tool-sched", name: "agendar_consulta", type: "@n8n/n8n-nodes-langchain.toolHttpRequest", typeVersion: 1.1, position: [950, 400]
      },
      {
        parameters: {
          method: "POST", url: `${CRM_BASE_URL}/api/whatsapp/tools/cancel-appointment`,
          sendHeaders: true,
          headerParameters: { parameters: [ { name: "Authorization", value: `Bearer ${NEW_SECRET}` } ] },
          sendBody: true,
          bodyParameters: { parameters: [ 
            { name: "clinicId", value: "={{ $node[\"CRM Webhook Trigger\"].json.clinicId }}" },
            { name: "appointmentId", value: "={{ $json.appointmentId }}" }
          ] }
        },
        id: "tool-cancel", name: "cancelar_consulta", type: "@n8n/n8n-nodes-langchain.toolHttpRequest", typeVersion: 1.1, position: [950, 500]
      },
      {
        parameters: {
          method: "POST", url: `${CRM_BASE_URL}/api/whatsapp/send`,
          sendHeaders: true,
          headerParameters: { parameters: [ { name: "Authorization", value: `Bearer ${NEW_SECRET}` } ] },
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
      "obter_dados_clínicos": { ai_tool: [ [ { node: "Agente Gerente Sofia", type: "ai_tool", index: 0 } ] ] },
      "get_patient_history": { ai_tool: [ [ { node: "Agente Gerente Sofia", type: "ai_tool", index: 0 } ] ] },
      "check_availability": { ai_tool: [ [ { node: "Agente Gerente Sofia", type: "ai_tool", index: 0 } ] ] },
      "agendar_consulta": { ai_tool: [ [ { node: "Agente Gerente Sofia", type: "ai_tool", index: 0 } ] ] },
      "cancelar_consulta": { ai_tool: [ [ { node: "Agente Gerente Sofia", type: "ai_tool", index: 0 } ] ] },
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
    if (updateResponse.ok) { console.log("n8n ATUALIZADO com SUCESSO ABSOLUTO!"); }
    else { console.error("Erro no n8n:", await updateResponse.json()); }
  } catch (err: any) { console.error("Erro fatal:", err.message); }
}

ultimateSync();
