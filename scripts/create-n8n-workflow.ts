import fetch from "node-fetch"; // Next.js native fetch polyfill in recent node versions? We can use native global fetch.

const N8N_URL = "https://lostbaskingshark-n8n.cloudfy.live";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
const CRM_WEBHOOK_BASE = "https://SEU_DOMINIO_PUBLICO_CRM"; // Substituir com a URL real ou ngrok

async function createWorkflow() {
  console.log("🛠️ Tentando assumir o controle do n8n remotamente...");

  const workflowPayload = {
    name: "CliniSmart AI Agent - MultiTenant (Gerado Automático)",
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: "whatsapp-entrada",
          options: {}
        },
        id: "1",
        name: "Evolution API Recebe Mensagem",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [250, 300]
      },
      {
        parameters: {
          url: `=${CRM_WEBHOOK_BASE}/api/whatsapp/config/{{$json.body.instance}}`,
          sendQuery: true,
          queryParameters: {
            parameters: []
          },
          options: {}
        },
        id: "2",
        name: "Pegar Persona do CRM",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [450, 300]
      },
      {
        parameters: {
          model: "gpt-4-turbo-preview",
          options: {
            systemMessage: "={{ $json.agentConfig.systemPrompt }}"
          }
        },
        id: "3",
        name: "OpenAI Chat Model",
        type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
        typeVersion: 1,
        position: [650, 450]
      },
      {
        parameters: {
          options: {}
        },
        id: "4",
        name: "Agente AI",
        type: "@n8n/n8n-nodes-langchain.agent",
        typeVersion: 1.1,
        position: [650, 300]
      }
    ],
    connections: {
      "Evolution API Recebe Mensagem": {
        main: [
          [
            { node: "Pegar Persona do CRM", type: "main", index: 0 }
          ]
        ]
      },
      "Pegar Persona do CRM": {
        main: [
          [
            { node: "Agente AI", type: "main", index: 0 }
          ]
        ]
      },
      "OpenAI Chat Model": {
        ai_languageModel: [
          [
            { node: "Agente AI", type: "ai_languageModel", index: 0 }
          ]
        ]
      }
    },
    settings: {
      executionOrder: "v1"
    }
  };

  try {
    const res = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": API_KEY
      },
      body: JSON.stringify(workflowPayload)
    });

    if (res.ok) {
      const data = await res.json();
      console.log("✅ Workflow injetado com sucesso! ID:", data.id);
      console.log("👉 Acesse seu n8n. O Workflow 'CliniSmart AI Agent' foi criado!");
    } else {
      const err = await res.text();
      console.error("❌ Falha na injeção remota:", err);
    }
  } catch (error) {
    console.error("Erro na comunicação de rede:", error);
  }
}

createWorkflow();
