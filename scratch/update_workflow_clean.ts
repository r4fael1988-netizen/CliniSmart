import fetch from 'node-fetch';
import fs from 'fs';

async function run() {
    const n8nUrl = 'https://lostbaskingshark-n8n.cloudfy.live';
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I';
    const workflowPath = 'scratch/sofia_workflow.json';

    const fullWorkflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
    
    // Prepare update payload (STRICT SUBSET)
    const updatePayload = {
        name: fullWorkflow.name,
        nodes: fullWorkflow.nodes,
        connections: fullWorkflow.connections,
        settings: fullWorkflow.settings,
        staticData: fullWorkflow.staticData
    };

    const nodes = updatePayload.nodes;
    const nodeIndex = nodes.findIndex(n => n.name === 'Enviar resposta ao CRM');
    
    if (nodeIndex === -1) {
        console.error('Node not found!');
        process.exit(1);
    }

    const oldNode = nodes[nodeIndex];
    console.log('Replacing node:', oldNode.name);

    const jsCode = `// Sofia Code Tool - Conexão Direta CRM
const url = "https://clini-smart.vercel.app/api/whatsapp/send";
const triggerNode = $("CRM Webhook Trigger").item.json;
const agentOutput = $json.output;

const body = {
  patientId: triggerNode.patientId || triggerNode.corpo?.patientId || triggerNode.corpo?.dados?.patientId,
  patientPhone: triggerNode.patientPhone || triggerNode.corpo?.patientPhone || triggerNode.corpo?.dados?.patientPhone || (triggerNode.corpo?.dados?.chave?.remoteJid || "").split("@")[0],
  textMessage: agentOutput,
  sentBy: "ia"
};

try {
  const response = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": "Bearer clini-smart-auth-2026"
    },
    body: JSON.stringify(body)
  });
  return await response.json();
} catch (error) {
  return { error: error.message, status: "failed" };
}`;

    nodes[nodeIndex] = {
        name: oldNode.name,
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: oldNode.position,
        parameters: {
            jsCode: jsCode
        }
    };

    console.log('Sending clean update to n8n...');
    const updateRes = await fetch(`${n8nUrl}/api/v1/workflows/bRQoyjQbfwsE9yRZ`, {
        method: 'PUT',
        headers: {
            'X-N8N-API-KEY': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
    });

    console.log('Update Status:', updateRes.status);
    const resultText = await updateRes.text();
    console.log('Result:', resultText);
}

run().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
