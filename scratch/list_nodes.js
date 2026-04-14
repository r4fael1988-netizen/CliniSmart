
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
const baseUrl = "https://lostbaskingshark-n8n.cloudfy.live/api/v1";
const workflowId = "bRQoyjQbfwsE9yRZ";

async function listAllNodes() {
  try {
    const response = await fetch(`${baseUrl}/workflows/${workflowId}`, {
      headers: { "X-N8N-API-KEY": apiKey }
    });
    const data = await response.json();
    const nodes = data.nodes.map(n => ({
        name: n.name,
        type: n.type,
        id: n.id,
        url: n.parameters.url
    }));
    console.log("NODES_LIST_START");
    console.log(JSON.stringify(nodes, null, 2));
    console.log("NODES_LIST_END");
  } catch (error) {
    console.error("Error:", error);
  }
}
listAllNodes();
