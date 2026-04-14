
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
const baseUrl = "https://lostbaskingshark-n8n.cloudfy.live/api/v1";
const workflowId = "bRQoyjQbfwsE9yRZ";

async function inspectWorkflow() {
  try {
    const response = await fetch(`${baseUrl}/workflows/${workflowId}`, {
      headers: { "X-N8N-API-KEY": apiKey }
    });
    const data = await response.json();
    console.log("KEYS:", Object.keys(data));
    const nodes = data.nodes || (data.data && data.data.nodes);
    if (!nodes) {
        console.log("FULL_RESPONSE:", JSON.stringify(data, null, 2));
        return;
    }
    const node = nodes.find(n => n.name === "Agente Gerente Sofia");
    console.log("NODE_PARAMS_START");
    console.log(JSON.stringify(node, null, 2));
    console.log("NODE_PARAMS_END");
  } catch (error) {
    console.error("Error:", error);
  }
}
inspectWorkflow();
