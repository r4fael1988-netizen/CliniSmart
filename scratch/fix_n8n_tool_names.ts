import fetch from "node-fetch";

async function fixNames() {
  const n8nUrl = "https://lostbaskingshark-n8n.cloudfy.live";
  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
  const workflowId = "bRQoyjQbfwsE9yRZ";

  console.log("Baixando workflow para correção de nomes de ferramentas...");
  const getRes = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
    headers: { "X-N8N-API-KEY": apiKey }
  });
  const workflow = await getRes.json();

  workflow.nodes = workflow.nodes.map(node => {
     if (node.type === "@n8n/n8n-nodes-langchain.toolCode") {
        // DEFININDO O NOME INTERNO DA FERRAMENTA (TOOL NAME)
        // Deve conter apenas letras, números e underscores
        const toolId = node.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        
        node.parameters.name = toolId; // ESTE ERA O CAMPO FALTANTE!
        
        console.log(`- Definido ID interno '${toolId}' para a ferramenta '${node.name}'`);
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
    console.log("CONFLITO DE NOMES RESOLVIDO! 🎯");
  } else {
    console.log("Erro ao corrigir nomes: " + await putRes.text());
  }
}

fixNames();
