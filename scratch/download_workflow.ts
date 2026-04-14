import fetch from "node-fetch";
import fs from "fs";

async function getWorkflow() {
  const n8nUrl = "https://lostbaskingshark-n8n.cloudfy.live";
  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
  const workflowId = "bRQoyjQbfwsE9yRZ";

  console.log(`Buscando workflow ${workflowId}...`);

  try {
    const res = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
      headers: {
        "X-N8N-API-KEY": apiKey
      }
    });

    if (!res.ok) {
      throw new Error(`Erro na API n8n: ${res.status} - ${await res.text()}`);
    }

    const workflow = await res.json();
    fs.writeFileSync("scratch/workflow_full.json", JSON.stringify(workflow, null, 2));
    console.log("Workflow salvo em scratch/workflow_full.json");
  } catch (err) {
    console.error("Falha ao baixar workflow:", err.message);
  }
}

getWorkflow();
