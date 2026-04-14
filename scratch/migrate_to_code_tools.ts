import fetch from "node-fetch";

async function executeMigration() {
  const n8nUrl = "https://lostbaskingshark-n8n.cloudfy.live";
  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
  const workflowId = "bRQoyjQbfwsE9yRZ";
  const baseUrl = "https://clini-smart.vercel.app";

  console.log("Baixando workflow para migração para Code Tools...");
  const getRes = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
    headers: { "X-N8N-API-KEY": apiKey }
  });
  const workflow = await getRes.json();

  workflow.nodes = workflow.nodes.map(node => {
     // Identificar os nós de ferramenta HTTP (que estão bugados)
     if (node.type === "@n8n/n8n-nodes-langchain.toolHttpRequest" || (node.name.startsWith("tool-") || ["get_clinic_data", "get_patient_history", "check_availability", "schedule_appointment", "cancel_appointment"].includes(node.name))) {
        
        console.log(`Migrando nó: ${node.name}...`);
        
        // Determinar o endpoint baseado na URL antiga ou no nome
        let endpoint = node.parameters.url.replace(/^=/, '').replace(/^https:\/\/clini-smart.vercel.app/, '');
        if (!endpoint.startsWith('/api')) {
           // Fallback baseado no nome do nó se a URL estiver vazia
           const map = {
              "get_clinic_data": "/api/whatsapp/tools/get-clinic-data",
              "get_patient_history": "/api/whatsapp/tools/get-patient-history",
              "check_availability": "/api/whatsapp/tools/check-availability",
              "schedule_appointment": "/api/whatsapp/tools/schedule",
              "cancel_appointment": "/api/whatsapp/tools/cancel-appointment"
           };
           endpoint = map[node.name] || "/api/whatsapp/tools/" + node.name;
        }

        // Criar o NOVO tipo de nó: Code Tool
        const newNode = {
           id: node.id,
           name: node.name,
           type: "@n8n/n8n-nodes-langchain.toolCode",
           typeVersion: 1,
           position: node.position,
           parameters: {
              description: node.parameters.toolDescription || node.description,
              jsCode: `
// Sofia Code Tool - Conexão Direta CRM
const url = "${baseUrl}${endpoint}";
const triggerNode = $("CRM Webhook Trigger").item.json;

// Mapeamento robusto de entrada
const body = {
  clinicId: triggerNode.clinicId || triggerNode.corpo?.clinicId || triggerNode.corpo?.dados?.clinicId,
  patientPhone: triggerNode.patientPhone || triggerNode.corpo?.patientPhone || triggerNode.corpo?.dados?.patientPhone || (triggerNode.corpo?.dados?.chave?.remoteJid || '').replace('@s.whatsapp.net', '')
};

// Adicionar parâmetros específicos da ferramenta (se existirem)
// Nota: O LangChain passa os parâmetros como variáveis globais no ToolCode
if (typeof specialty !== 'undefined') body.specialty = specialty;
if (typeof date !== 'undefined') body.date = date;
if (typeof time !== 'undefined') body.time = time;
if (typeof doctorId !== 'undefined') body.doctorId = doctorId;
if (typeof appointmentId !== 'undefined') body.appointmentId = appointmentId;

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer clini-smart-auth-2026'
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  return data;
} catch (error) {
  return { error: error.message, status: "failed" };
}
              `.trim()
           }
        };
        return newNode;
     }
     return node;
  });

  const putRes = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
    method: "PUT",
    headers: {
      "X-N8N-API-KEY": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings
    })
  });

  if (putRes.ok) {
    console.log("MIGRAÇÃO PARA CODE TOOLS CONCLUÍDA! 🚀 (Zero bugs de URL agora)");
  } else {
    console.log("Erro na migração: " + await putRes.text());
  }
}

executeMigration();
