import fetch from "node-fetch";

async function fixSenderNodeMapping() {
  const n8nUrl = "https://lostbaskingshark-n8n.cloudfy.live";
  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
  const workflowId = "bRQoyjQbfwsE9yRZ";

  console.log("Atualizando mapeamento de pacientes no n8n...");
  const getRes = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
    headers: { "X-N8N-API-KEY": apiKey }
  });
  const workflow = await getRes.json();

  workflow.nodes = workflow.nodes.map(node => {
     if (node.name === "Enviar resposta ao CRM") {
        console.log("- Adicionando 'patientPhone' como fallback no JSON body...");
        const triggerRef = "$node[\"CRM Webhook Trigger\"].json";
        
        node.parameters.jsonBody = JSON.stringify({
           patientId: `={{ ${triggerRef}.patientId || ${triggerRef}.corpo?.patientId || ${triggerRef}.corpo?.dados?.patientId }}`,
           patientPhone: `={{ ${triggerRef}.patientPhone || ${triggerRef}.corpo?.patientPhone || ${triggerRef}.corpo?.dados?.patientPhone || (${triggerRef}.corpo?.dados?.chave?.remoteJid || '').split('@')[0] }}`,
           textMessage: "={{ $json.output }}",
           sentBy: "ia"
        });
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
    console.log("MAPEAMENTO N8N ATUALIZADO! 🚀");
  } else {
    console.log("Erro ao atualizar n8n: " + await putRes.text());
  }
}

fixSenderNodeMapping();
