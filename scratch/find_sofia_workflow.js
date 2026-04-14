
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
const baseUrl = "https://lostbaskingshark-n8n.cloudfy.live/api/v1";

async function findWorkflow() {
  try {
    const response = await fetch(`${baseUrl}/workflows`, {
      headers: { "X-N8N-API-KEY": apiKey }
    });
    const data = await response.json();
    const workflow = data.data.find(w => w.name.includes("Sofia") || w.name.includes("CRM"));
    if (workflow) {
      console.log("Found Workflow ID:", workflow.id);
      // Fetch the full details
      const detailRes = await fetch(`${baseUrl}/workflows/${workflow.id}`, {
        headers: { "X-N8N-API-KEY": apiKey }
      });
      const detailData = await detailRes.json();
      console.log(JSON.stringify(detailData, null, 2));
    } else {
      console.log("Workflow not found with 'Sofia' or 'CRM' in name.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

findWorkflow();
