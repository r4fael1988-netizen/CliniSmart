import fetch from "node-fetch";
import fs from "fs";

async function fixWorkflow() {
  const n8nUrl = "https://lostbaskingshark-n8n.cloudfy.live";
  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
  const workflowId = "bRQoyjQbfwsE9yRZ";
  
  // O domínio oficial fornecido pelo usuário
  const productionUrl = "https://clini-smart.vercel.app";

  console.log("Baixando workflow para atualização final...");
  const getRes = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
    headers: { "X-N8N-API-KEY": apiKey }
  });
  const workflow = await getRes.json();

  console.log("Atualizando URLs para: " + productionUrl);

  workflow.nodes = workflow.nodes.map(node => {
     // Atualizar ferramentas (LangChain HTTP Tool)
     if (node.type.includes("toolHttpRequest") || node.name.includes("tool-")) {
        if (node.parameters && node.parameters.url) {
           node.parameters.url = node.parameters.url.replace("https://lostbaskingshark-crm.cloudfy.live", productionUrl);
           console.log(`- Atualizado URL de ${node.name}`);
        }
     }
     
     // Atualizar nó de envio de resposta (HTTP Request normal)
     if (node.name === "Enviar resposta ao CRM") {
        node.parameters.url = node.parameters.url.replace("https://lostbaskingshark-crm.cloudfy.live", productionUrl);
        console.log("- Atualizado URL de Enviar resposta ao CRM");
     }

     return node;
  });

  const updatePayload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings
  };

  const putRes = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
    method: "PUT",
    headers: {
      "X-N8N-API-KEY": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updatePayload)
  });

  if (putRes.ok) {
    console.log("WORKFLOW APONTADO PARA VERCEL COM SUCESSO! 🎉");
  } else {
    console.log("Erro na atualização: " + await putRes.text());
  }
}

fixWorkflow();
