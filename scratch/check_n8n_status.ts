import dotenv from "dotenv";

dotenv.config();

const N8N_API_KEY = process.env.N8N_API_KEY;
const WORKFLOW_ID = "bRQoyjQbfwsE9yRZ"; // ID do log anterior
const N8N_API_URL = `https://lostbaskingshark-n8n.cloudfy.live/api/v1/workflows/${WORKFLOW_ID}`;

async function checkWorkflow() {
  try {
    const response = await fetch(N8N_API_URL, {
      method: "GET",
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY || "",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json() as any;
    console.log("Status do Workflow no n8n:", JSON.stringify({
        id: data.id,
        name: data.name,
        active: data.active,
        nodes: data.nodes.map((n: any) => ({ name: n.name, type: n.type, path: n.parameters?.path }))
    }, null, 2));

  } catch (error: any) {
    console.error("Erro ao verificar workflow:", error.message);
  }
}

checkWorkflow();
