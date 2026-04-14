import fetch from "node-fetch";

async function checkExecutions() {
  const n8nUrl = "https://lostbaskingshark-n8n.cloudfy.live";
  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
  const workflowId = "bRQoyjQbfwsE9yRZ";

  console.log("Buscando últimas execuções com erro...");
  const res = await fetch(`${n8nUrl}/api/v1/executions?workflowId=${workflowId}&limit=5`, {
    headers: { "X-N8N-API-KEY": apiKey }
  });
  
  const data = await res.json();
  if (data.data && data.data.length > 0) {
    for (const exec of data.data) {
       console.log(`\n--- Execução ID: ${exec.id} (${exec.status}) ---`);
       // Buscar detalhes do erro
       const detailRes = await fetch(`${n8nUrl}/api/v1/executions/${exec.id}`, {
          headers: { "X-N8N-API-KEY": apiKey }
       });
       const detail = await detailRes.json();
       console.log(JSON.stringify(detail.data, null, 2).substring(0, 1000));
    }
  } else {
    console.log("Nenhuma execução encontrada recentemente.");
  }
}

checkExecutions();
