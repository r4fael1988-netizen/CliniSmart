import fetch from 'node-fetch';

const N8N_URL = "https://lostbaskingshark-n8n.cloudfy.live";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I";
const WORKFLOW_ID = "bRQoyjQbfwsE9yRZ";

/**
 * FIX DEFINITIVO: No Agent v3.1 do n8n, os subnós (tools) NÃO TÊM ACESSO
 * a $node["CRM Webhook Trigger"] pois não estão conectados diretamente.
 * 
 * A solução é passar clinicId e patientPhone como PLACEHOLDERS da IA
 * (junto com os outros campos dinâmicos) e remover as referências diretas
 * ao webhook trigger no jsonBody de cada ferramenta.
 * 
 * Assim, a IA preenche TODOS os campos que ela tem no context (prompt).
 * O clinicId e patientPhone já estão no prompt de sistema via 
 * $node["CRM Webhook Trigger"].json... no promptType do AI Agent.
 */
async function fixAllToolNodes() {
  console.log(`🚀 CORREÇÃO DEFINITIVA do workflow: ${WORKFLOW_ID}`);
  console.log(`   Problema: tools usam $node["CRM Webhook Trigger"] que é inacessível`);
  console.log(`   Solução: mover clinicId/patientPhone para placeholders\n`);

  const getRes = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
    headers: { 'X-N8N-API-KEY': API_KEY }
  });

  if (!getRes.ok) throw new Error(`Falha ao buscar workflow: ${await getRes.text()}`);
  const workflow = await getRes.json() as any;

  // Mapear todos os tool nodes e corrigir seus jsonBody e placeholders
  const toolFixes: Record<string, { jsonBody: string; placeholders: any[] }> = {
    "get_clinic_data": {
      jsonBody: '={\n  "clinicId": "{clinicId}"\n}',
      placeholders: [
        { name: "clinicId", description: "ID da clínica (recebido no inicio da conversa)", type: "string", required: true }
      ]
    },
    "get_patient_history": {
      jsonBody: '={\n  "clinicId": "{clinicId}",\n  "patientPhone": "{patientPhone}"\n}',
      placeholders: [
        { name: "clinicId", description: "ID da clínica", type: "string", required: true },
        { name: "patientPhone", description: "Telefone do paciente (número sem @s.whatsapp.net)", type: "string", required: true }
      ]
    },
    "check_availability": {
      jsonBody: '={\n  "clinicId": "{clinicId}",\n  "date": "{date}",\n  "specialty": "{specialty}"\n}',
      placeholders: [
        { name: "clinicId", description: "ID da clínica", type: "string", required: true },
        { name: "date", description: "Data no formato YYYY-MM-DD", type: "string", required: true },
        { name: "specialty", description: "Nome da especialidade médica", type: "string", required: false }
      ]
    },
    "schedule_appointment": {
      jsonBody: '={\n  "clinicId": "{clinicId}",\n  "patientPhone": "{patientPhone}",\n  "doctorId": "{doctorId}",\n  "date": "{date}",\n  "time": "{time}"\n}',
      placeholders: [
        { name: "clinicId", description: "ID da clínica", type: "string", required: true },
        { name: "patientPhone", description: "Telefone do paciente", type: "string", required: true },
        { name: "doctorId", description: "ID do médico escolhido", type: "string", required: true },
        { name: "date", description: "Data no formato YYYY-MM-DD", type: "string", required: true },
        { name: "time", description: "Horário no formato HH:MM", type: "string", required: true }
      ]
    },
    "cancel_appointment": {
      jsonBody: '={\n  "appointmentId": "{appointmentId}",\n  "patientPhone": "{patientPhone}"\n}',
      placeholders: [
        { name: "appointmentId", description: "ID do agendamento a cancelar", type: "string", required: true },
        { name: "patientPhone", description: "Telefone do paciente", type: "string", required: true }
      ]
    }
  };

  // Aplicar correções
  workflow.nodes.forEach((node: any) => {
    if (node.type === '@n8n/n8n-nodes-langchain.toolHttpRequest' && toolFixes[node.name]) {
      const fix = toolFixes[node.name];
      console.log(`  🔧 Corrigindo: ${node.name}`);
      console.log(`     Antes: ${node.parameters.jsonBody?.substring(0, 80)}...`);
      
      node.parameters.jsonBody = fix.jsonBody;
      node.parameters.placeholderDefinitions = { values: fix.placeholders };
      
      console.log(`     Depois: ${fix.jsonBody.substring(0, 80)}...`);
      console.log(`     Placeholders: ${fix.placeholders.map(p => p.name).join(', ')}\n`);
    }
  });

  // Também precisamos garantir que o AI Agent tenha o clinicId e patientPhone 
  // disponíveis no seu prompt de sistema
  const aiAgent = workflow.nodes.find((n: any) => n.name === 'AI Agent');
  if (aiAgent) {
    const currentPrompt = aiAgent.parameters.text || '';
    
    // Verificar se o prompt já inclui as informações de clinicId e patientPhone
    if (!currentPrompt.includes('clinicId')) {
      console.log('  📝 Adicionando clinicId e patientPhone ao prompt do AI Agent...');
      
      // Adicionar ao final do prompt
      const dataBlock = `\n\n---\n### DADOS DA SESSÃO ATUAL (USE NAS FERRAMENTAS):\n- **clinicId:** ={{ $json.clinicId || $json.body?.clinicId }}\n- **patientPhone:** ={{ $json.patientPhone || $json.body?.patientPhone }}\n- **patientName:** ={{ $json.patientName || $json.body?.patientName || "Paciente" }}`;
      
      aiAgent.parameters.text = currentPrompt + dataBlock;
      console.log('  ✅ Dados de sessão adicionados ao prompt!\n');
    } else {
      console.log('  ℹ️ Prompt já contém clinicId. Pulando.\n');
    }
  }

  // Enviar atualização
  const updateRes = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": API_KEY
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
    console.log("✅ CORREÇÃO DEFINITIVA APLICADA COM SUCESSO!");
    console.log("   Todos os tool nodes agora usam placeholders ao invés de $node[]");
    console.log("   O AI Agent tem clinicId/patientPhone no prompt de sistema");
  } else {
    console.error("❌ Falha ao atualizar:", await updateRes.text());
  }
}

fixAllToolNodes().catch(console.error);
