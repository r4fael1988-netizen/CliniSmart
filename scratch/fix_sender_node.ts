import fetch from "node-fetch";

async function fixSenderNode() {
  const n8nUrl = "https://lostbaskingshark-n8n.cloudfy.live";
  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
  const workflowId = "bRQoyjQbfwsE9yRZ";

  console.log("Corrigindo o nó 'Enviar resposta ao CRM'...");
  const getRes = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
    headers: { "X-N8N-API-KEY": apiKey }
  });
  const workflow = await getRes.json();

  workflow.nodes = workflow.nodes.map(node => {
     if (node.name === "Enviar resposta ao CRM") {
        console.log("- Atualizando cabeçalhos e body do nó de envio...");
        node.parameters.headerParameters = {
          parameters: [
            {
              name: "Authorization",
              value: "Bearer clini-smart-auth-2026"
            }
          ]
        };
        // Garantir que o JSON do corpo está correto
        node.parameters.jsonBody = JSON.stringify({
           patientId: "={{ $node[\"CRM Webhook Trigger\"].json.patientId || $node[\"CRM Webhook Trigger\"].json.corpo?.patientId || $node[\"CRM Webhook Trigger\"].json.corpo?.dados?.patientId }}",
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
    console.log("NÓ DE ENVIO CORRIGIDO COM SUCESSO! ✅");
  } else {
    console.log("Erro ao corrigir nó de envio: " + await putRes.text());
  }
}

fixSenderNode();
