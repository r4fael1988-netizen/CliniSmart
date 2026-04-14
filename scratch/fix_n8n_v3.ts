import fetch from "node-fetch";
import fs from "fs";

async function fixWorkflow() {
  const n8nUrl = "https://lostbaskingshark-n8n.cloudfy.live";
  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
  const workflowId = "bRQoyjQbfwsE9yRZ";

  const workflow = JSON.parse(fs.readFileSync("scratch/workflow_full.json", "utf8"));

  const clinicIdExp = "={{ $node[\"CRM Webhook Trigger\"].json.corpo.clinicId || $node[\"CRM Webhook Trigger\"].json.corpo.dados?.clinicId || $node[\"CRM Webhook Trigger\"].json.corpo.instância }}";
  const patientPhoneExp = "={{ $node[\"CRM Webhook Trigger\"].json.corpo.patientPhone || $node[\"CRM Webhook Trigger\"].json.corpo.dados?.patientPhone || ($node[\"CRM Webhook Trigger\"].json.corpo.dados?.chave?.remoteJid || '').replace('@s.whatsapp.net', '') }}";
  const authHeader = "Bearer clini-smart-auth-2026";

  workflow.nodes = workflow.nodes.map(node => {
    if (node.name === "get_patient_history") {
       node.parameters.specifyBody = "json";
       node.parameters.jsonBody = JSON.stringify({
         clinicId: clinicIdExp,
         patientPhone: patientPhoneExp
       });
       delete node.parameters.parametersBody; 
    }
    if (node.name === "get_clinic_data") {
        node.parameters.jsonBody = JSON.stringify({ clinicId: clinicIdExp });
    }
    if (node.parameters && node.parameters.parametersHeaders) {
      node.parameters.parametersHeaders.values = [{
        name: "Authorization",
        valueProvider: "fieldValue",
        value: authHeader
      }];
    }
    return node;
  });

  const updatePayload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings
  };

  try {
    const res = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
      method: "PUT",
      headers: {
        "X-N8N-API-KEY": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatePayload)
    });

    if (!res.ok) {
        throw new Error(`Erro: ${res.status} - ${await res.text()}`);
    }

    console.log("Workflow ATUALIZADO com sucesso (v3)!");
  } catch (err) {
    console.error("Falha v3:", err.message);
  }
}

fixWorkflow();
