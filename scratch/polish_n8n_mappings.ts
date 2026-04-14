import fetch from "node-fetch";

async function polishMappings() {
  const n8nUrl = "https://lostbaskingshark-n8n.cloudfy.live";
  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
  const workflowId = "bRQoyjQbfwsE9yRZ";

  // Expressões ultra-seguras que buscam os dados em todos os níveis possíveis
  const clinicIdExp = "={{ $node[\"CRM Webhook Trigger\"].json.clinicId || $node[\"CRM Webhook Trigger\"].json.corpo?.clinicId || $node[\"CRM Webhook Trigger\"].json.corpo?.dados?.clinicId || $node[\"CRM Webhook Trigger\"].json.corpo?.instância }}";
  const patientPhoneExp = "={{ $node[\"CRM Webhook Trigger\"].json.patientPhone || $node[\"CRM Webhook Trigger\"].json.corpo?.patientPhone || $node[\"CRM Webhook Trigger\"].json.corpo?.dados?.patientPhone || ($node[\"CRM Webhook Trigger\"].json.corpo?.dados?.chave?.remoteJid || '').replace('@s.whatsapp.net', '') }}";
  const patientIdExp = "={{ $node[\"CRM Webhook Trigger\"].json.patientId || $node[\"CRM Webhook Trigger\"].json.corpo?.patientId || $node[\"CRM Webhook Trigger\"].json.corpo?.dados?.patientId }}";
  const messageExp = "={{ $node[\"CRM Webhook Trigger\"].json.message || $node[\"CRM Webhook Trigger\"].json.corpo?.message || $node[\"CRM Webhook Trigger\"].json.corpo?.dados?.mensagem?.conversa || $node[\"CRM Webhook Trigger\"].json.corpo?.dados?.message?.conversation }}";

  console.log("Baixando workflow para polimento de mapeamento...");
  const getRes = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
    headers: { "X-N8N-API-KEY": apiKey }
  });
  const workflow = await getRes.json();

  workflow.nodes = workflow.nodes.map(node => {
    // 1. Ferramentas (Tools)
    if (node.name === "get_patient_history" || node.name === "get_clinic_data" || node.name === "check_availability" || node.name === "schedule_appointment" || node.name === "cancel_appointment") {
       if (node.parameters.jsonBody) {
          let body = JSON.parse(node.parameters.jsonBody);
          if (body.clinicId) body.clinicId = clinicIdExp;
          if (body.patientPhone) body.patientPhone = patientPhoneExp;
          node.parameters.jsonBody = JSON.stringify(body);
          console.log(`- Refinado mapeamento da ferramenta: ${node.name}`);
       }
    }

    // 2. Nó de Resposta
    if (node.name === "Enviar resposta ao CRM") {
       node.parameters.jsonBody = JSON.stringify({
          patientId: patientIdExp,
          textMessage: "={{ $json.output }}",
          sentBy: "ia"
       });
       console.log("- Refinado mapeamento do Enviar resposta ao CRM");
    }

    // 3. Prompt do Agente ( Sofia )
    if (node.name === "AI Agent") {
       // Sincronizar o prompt para ler a mensagem corretamente
       node.parameters.text = node.parameters.text.replace(/MENSAGEM ATUAL DO PACIENTE:\n.*/s, `MENSAGEM ATUAL DO PACIENTE:\n${messageExp}`);
       console.log("- Refinado prompt da Sofia (leitura de mensagem)");
    }

    return node;
  });

  const putRes = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
    method: "PUT",
    headers: {
      "X-N8N-API-KEY": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings
    })
  });

  if (putRes.ok) {
    console.log("MAPEAMENTOS POLIDOS E ROBUSTOS! 🚀");
  } else {
    console.log("Erro no polimento: " + await putRes.text());
  }
}

polishMappings();
