
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
const baseUrl = "https://lostbaskingshark-n8n.cloudfy.live/api/v1";
const workflowId = "bRQoyjQbfwsE9yRZ";

async function fixWorkflowSyntax() {
  try {
    const getRes = await fetch(`${baseUrl}/workflows/${workflowId}`, {
      headers: { "X-N8N-API-KEY": apiKey }
    });
    const workflow = await getRes.json();
    
    const node = workflow.nodes.find(n => n.name === "Agente Gerente Sofia");
    if (!node) return;
    
    // Expressões Limpas (Removendo as chaves extras que o subagente colocou)
    node.parameters.text = "={{ $json.corpo.dados.message.conversation || $json.corpo.dados.message.extendedTextMessage.text }}";
    node.parameters.options.systemMessage = "={{ $json.corpo.masterPrompt || $json.corpo.dados.masterPrompt }}";
    node.parameters.promptType = "define";

    console.log("Pushing final syntax fix...");

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
    
    if (updateRes.ok) {
      console.log("Final syntax fix applied!");
    } else {
      console.log("Fail:", await updateRes.text());
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

fixWorkflowSyntax();
