
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
const baseUrl = "https://lostbaskingshark-n8n.cloudfy.live/api/v1";
const workflowId = "bRQoyjQbfwsE9yRZ";

async function updateWorkflow() {
  try {
    // 1. Get current workflow
    const getRes = await fetch(`${baseUrl}/workflows/${workflowId}`, {
      headers: { "X-N8N-API-KEY": apiKey }
    });
    const workflow = await getRes.json();
    
    // 2. Find and modify the node
    const nodeIndex = workflow.nodes.findIndex(n => n.name === "Agente Gerente Sofia");
    if (nodeIndex === -1) {
      console.error("Node 'Agente Gerente Sofia' not found.");
      return;
    }
    
    const node = workflow.nodes[nodeIndex];
    
    // Update systemMessage
    node.parameters.options = node.parameters.options || {};
    node.parameters.options.systemMessage = "={{ $json.body.masterPrompt }}";
    
    // Update prompt (text) mapping
    // Para LangChain AI Agent, o campo é 'text'
    node.parameters.text = "={{ $json.body.message }}";
    // Forçar a não usar o Chat Trigger vinculado (que causava o erro de chatInput)
    node.parameters.promptSource = "define"; 

    console.log("Updating node with params:", JSON.stringify(node.parameters, null, 2));

    // 3. Push update back
    const updateRes = await fetch(`${baseUrl}/workflows/${workflowId}`, {
      method: "PUT",
      headers: { 
        "X-N8N-API-KEY": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings,
        staticData: workflow.staticData
      })
    });
    
    const result = await updateRes.json();
    if (updateRes.ok) {
      console.log("Workflow updated successfully!");
    } else {
      console.error("Failed to update workflow:", JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

updateWorkflow();
