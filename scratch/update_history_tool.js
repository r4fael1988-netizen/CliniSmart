
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
const baseUrl = "https://lostbaskingshark-n8n.cloudfy.live/api/v1";
const workflowId = "bRQoyjQbfwsE9yRZ";

async function updateToolNode() {
  try {
    const getRes = await fetch(`${baseUrl}/workflows/${workflowId}`, {
      headers: { "X-N8N-API-KEY": apiKey }
    });
    const workflow = await getRes.json();
    
    // Configurações reais
    const crmUrl = "https://lostbaskingshark-crm.cloudfy.live";
    const authHeader = "Bearer clini-smart-auth-2026";

    const node = workflow.nodes.find(n => n.name === "get_patient_history");
    if (!node) {
      console.error("Node 'get_patient_history' not found.");
      return;
    }
    
    // Atualizar parâmetros
    node.parameters.url = `${crmUrl}/api/whatsapp/tools/get-patient-history`;
    node.parameters.sendHeaders = true;
    node.parameters.parametersHeaders = {
      values: [
        { name: "Authorization", value: authHeader }
      ]
    };
    node.parameters.sendBody = true;
    node.parameters.specifyBody = "json";
    node.parameters.jsonBody = JSON.stringify({
      clinicId: "={{ $node[\"Agente Gerente Sofia\"].json[\"clinicId\"] || $node[\"CRM Webhook Trigger\"].json[\"clinicId\"] }}",
      patientPhone: "={{ $node[\"Agente Gerente Sofia\"].json[\"patientPhone\"] || $node[\"CRM Webhook Trigger\"].json[\"patientPhone\"] }}"
    });

    // Como o formato do node pode variar, vamos garantir o mapeamento de parâmetros corpo a corpo se não estiver usando jsonBody direto
    node.parameters.parametersBody = {
      values: [
        { name: "clinicId", value: "={{ $json.corpo.clinicId || $json.corpo.dados.clinicId }}" },
        { name: "patientPhone", value: "={{ $json.corpo.patientPhone || $json.corpo.dados.patientPhone }}" }
      ]
    };

    console.log("Pushing tool node update...");

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
      console.log("Tool node configured successfully!");
    } else {
      console.log("Fail:", await updateRes.text());
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

updateToolNode();
