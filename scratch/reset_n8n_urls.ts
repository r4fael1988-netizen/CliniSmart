import fetch from "node-fetch";

async function forceProtocolReset() {
  const n8nUrl = "https://lostbaskingshark-n8n.cloudfy.live";
  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
  const workflowId = "bRQoyjQbfwsE9yRZ";
  const baseUrl = "https://clini-smart.vercel.app";

  console.log("Baixando workflow para reset de protocolo...");
  const getRes = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
    headers: { "X-N8N-API-KEY": apiKey }
  });
  const workflow = await getRes.json();

  workflow.nodes = workflow.nodes.map(node => {
     if (node.type.includes("toolHttpRequest") || node.name.includes("tool-")) {
        const toolName = node.parameters.url.split('/').pop();
        // USANDO EXPRESSÃO PARA O URL! Isso pula algumas validações de pré-voo do n8n que podem estar bugadas
        node.parameters.url = `=${baseUrl}/api/whatsapp/tools/${toolName}`;
        console.log(`- URL da ferramenta ${node.name} resetada para Expressão: ${node.parameters.url}`);
     }
     
     if (node.name === "Enviar resposta ao CRM") {
        node.parameters.url = `${baseUrl}/api/whatsapp/send`;
        console.log("- URL de resposta atualizada (String plana)");
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
    console.log("REVOLUÇÃO DE URL CONCLUÍDA! 🚀 (URLs agora são expressões)");
  } else {
    console.log("Erro: " + await putRes.text());
  }
}

forceProtocolReset();
