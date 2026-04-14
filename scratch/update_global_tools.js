
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
const baseUrl = "https://lostbaskingshark-n8n.cloudfy.live/api/v1";
const workflowId = "bRQoyjQbfwsE9yRZ";

async function updateAllTools() {
  try {
    const getRes = await fetch(`${baseUrl}/workflows/${workflowId}`, {
      headers: { "X-N8N-API-KEY": apiKey }
    });
    const workflow = await getRes.json();
    
    const crmUrl = "https://lostbaskingshark-crm.cloudfy.live";
    const authHeader = "Bearer clini-smart-auth-2026";

    const updateNode = (nodeNameOrId, endpoint, bodyParams) => {
      const node = workflow.nodes.find(n => n.name === nodeNameOrId || n.id === nodeNameOrId);
      if (!node) {
        console.log(`Node '${nodeNameOrId}' not found.`);
        return;
      }
      
      node.parameters.url = `${crmUrl}${endpoint}`;
      node.parameters.sendHeaders = true;
      node.parameters.parametersHeaders = {
        values: [{ name: "Authorization", value: authHeader }]
      };
      node.parameters.sendBody = true;
      node.parameters.specifyBody = "json";
      node.parameters.jsonBody = JSON.stringify(bodyParams);
      console.log(`Updated node: ${node.name}`);
    };

    // 1. Obter Dados Clínicos
    updateNode("obter_dados_clínicos", "/api/whatsapp/tools/get-clinic-data", {
      clinicId: "={{ $node[\"Agente Gerente Sofia\"].json[\"clinicId\"] || $node[\"CRM Webhook Trigger\"].json[\"clinicId\"] }}"
    });

    // 2. Verificar Disponibilidade
    updateNode("check_availability", "/api/whatsapp/tools/check-availability", {
      clinicId: "={{ $node[\"Agente Gerente Sofia\"].json[\"clinicId\"] || $node[\"CRM Webhook Trigger\"].json[\"clinicId\"] }}",
      date: "={{ $json[\"date\"] }}",
      specialty: "={{ $json[\"specialty\"] }}"
    });

    // 3. Agendar Consulta
    updateNode("schedule_appointment", "/api/whatsapp/tools/schedule", {
      clinicId: "={{ $node[\"Agente Gerente Sofia\"].json[\"clinicId\"] || $node[\"CRM Webhook Trigger\"].json[\"clinicId\"] }}",
      patientPhone: "={{ $node[\"Agente Gerente Sofia\"].json[\"patientPhone\"] || $node[\"CRM Webhook Trigger\"].json[\"patientPhone\"] }}",
      date: "={{ $json[\"date\"] }}",
      time: "={{ $json[\"time\"] }}",
      specialty: "={{ $json[\"specialty\"] }}",
      doctorId: "={{ $json[\"doctorId\"] }}"
    });

    // 4. Cancelar Consulta
    updateNode("cancel_appointment", "/api/whatsapp/tools/cancel-appointment", {
      appointmentId: "={{ $json[\"appointmentId\"] }}",
      patientPhone: "={{ $node[\"Agente Gerente Sofia\"].json[\"patientPhone\"] || $node[\"CRM Webhook Trigger\"].json[\"patientPhone\"] }}"
    });

    // 5. Enviar resposta ao CRM (Node final HTTP)
    updateNode("Enviar resposta ao CRM", "/api/whatsapp/send", {
      patientId: "={{ $node[\"Agente Gerente Sofia\"].json[\"patientId\"] || $node[\"CRM Webhook Trigger\"].json[\"patientId\"] }}",
      textMessage: "={{ $json[\"output\"] }}",
      sentBy: "ia"
    });

    console.log("Pushing bulk tool updates to n8n...");

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
      console.log("Global tool configuration successful!");
    } else {
      console.log("Fail:", await updateRes.text());
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

updateAllTools();
