import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_BASE_URL = "https://lostbaskingshark-n8n.cloudfy.live/api/v1/workflows";

async function deployAndActivate() {
  try {
    const workflowPath = path.join(process.cwd(), "scratch/crm_manager_workflow.json");
    const workflowData = JSON.parse(fs.readFileSync(workflowPath, "utf-8"));

    // 1. Criar o Workflow (Sem o campo 'active')
    const createPayload = {
      name: "Sofia - Gestora de CRM Automática v2",
      nodes: workflowData.nodes,
      connections: workflowData.connections,
      settings: {
        saveExecutionProgress: true,
        saveManualExecutions: true
      }
    };

    console.log("1/2: Criando o workflow no n8n...");

    const createResponse = await fetch(N8N_BASE_URL, {
      method: "POST",
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(createPayload)
    });

    const createData = await createResponse.json() as any;

    if (!createResponse.ok) {
      console.error("Erro na criação:", createData);
      return;
    }

    const workflowId = createData.id;
    console.log(`Workflow criado! ID: ${workflowId}`);

    // 2. Ativar o Workflow
    console.log("2/2: Ativando o workflow...");
    const activateUrl = `${N8N_BASE_URL}/${workflowId}/activate`;
    
    const activateResponse = await fetch(activateUrl, {
      method: "POST",
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY || "",
        "Content-Type": "application/json"
      }
    });

    if (activateResponse.ok) {
        console.log("Workflow ATIVADO com sucesso!");
    } else {
        const activateData = await activateResponse.json();
        console.warn("Aviso: O workflow foi criado, mas não pôde ser ativado via API:", activateData);
    }

    // 3. Salvar resultados
    const webhookNode = createData.nodes.find((n: any) => n.name === "CRM Webhook");
    const webhookPath = webhookNode?.parameters?.path || "crm-manager-agent-v1";
    const finalWebhookUrl = `https://lostbaskingshark-n8n.cloudfy.live/webhook/${webhookPath}`;
    
    fs.writeFileSync(path.join(process.cwd(), "scratch/n8n_deploy_result.json"), JSON.stringify({
      id: workflowId,
      webhookUrl: finalWebhookUrl,
      active: activateResponse.ok
    }, null, 2));

    console.log(`\nOPERAÇÃO CONCLUÍDA!\nWebhook para o CRM: ${finalWebhookUrl}`);

  } catch (error: any) {
    console.error("Erro fatal na operação:", error.message);
  }
}

deployAndActivate();
