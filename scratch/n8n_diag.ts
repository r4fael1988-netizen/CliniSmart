import fetch from 'node-fetch';

async function run() {
  const n8nUrl = 'https://lostbaskingshark-n8n.cloudfy.live';
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmRmODY4OC0wNDM0LTQyZjUtYTg3Yy0yYTJmMWIyYWM4ZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5MjY5MjY2fQ.Fq1ir3Y7lPq-umSMR7CF_6b5Rqdtm9nwkVgPx6hMq_I';

  console.log('Criando workflow de diagnóstico...');
  const createRes = await fetch(`${n8nUrl}/api/v1/workflows`, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Diagnostic Connectivity FINAL',
      nodes: [
        {
          name: 'Manual Trigger',
          type: 'n8n-nodes-base.manualTrigger',
          typeVersion: 1,
          position: [100, 100]
        },
        {
          name: 'Check DNS',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [300, 100],
          parameters: {
             jsCode: `const dns = require("dns"); 
             return new Promise((resolve) => { 
                dns.lookup("lostbaskingshark-crm.cloudfy.live", (err, address) => { 
                   resolve([{ json: { address: address || "NOT_FOUND", error: err ? err.message : null, time: new Date().toISOString() } }]); 
                }); 
             });`
          }
        }
      ],
      connections: {
        'Manual Trigger': {
          main: [
            [{ node: 'Check DNS', type: 'main', index: 0 }]
          ]
        }
      },
      settings: {},
      staticData: null,
      meta: {},
      tags: []
    })
  });

  const wf = await createRes.json();
  if (!wf.id) {
    console.log('Erro ao criar workflow:', JSON.stringify(wf));
    return;
  }

  console.log(`Workflow criado ID: ${wf.id}. Ativando e executando um teste...`);
  
  // Ativar para permitir execução
  await fetch(`${n8nUrl}/api/v1/workflows/${wf.id}/activate`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': apiKey }
  });

  console.log('Disparando execução manual...');
  // Nota: A API do n8n v1 não retorna o resultado da execução manual de forma síncrona facilmente.
  // Vou listar as execuções recentes para pegar o resultado.
  
  setTimeout(async () => {
    const execRes = await fetch(`${n8nUrl}/api/v1/executions?workflowId=${wf.id}&limit=1`, {
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    const execs = await execRes.json();
    console.log('Resultado do Diagnóstico:', JSON.stringify(execs, null, 2));
  }, 5000);
}

run();
