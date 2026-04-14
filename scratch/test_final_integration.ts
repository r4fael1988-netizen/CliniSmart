import dotenv from "dotenv";

dotenv.config();

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_BASE;

async function testIntegration() {
  console.log(`Testando conexão com o n8n: ${N8N_WEBHOOK_URL}`);
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL || "", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Oi, Sofia! Quem são os médicos da clínica?",
        clinicId: "demo-id",
        clinicName: "Clínica Demo",
        patientName: "Rafael Teste",
        patientPhone: "5511999999999",
        masterPrompt: "Você é a Sofia, gestora do CRM. Use a ferramenta get_clinic_data para responder."
      })
    });

    if (response.ok) {
      console.log("Conexão SUCESSO! O n8n recebeu a mensagem.");
      // Note: We don't wait for wait=true here necessarily, but the 200 OK is enough to know the path is right.
    } else {
      console.error(`Erro na conexão: ${response.status}`);
      const text = await response.text();
      console.error(text);
    }
  } catch (error: any) {
    console.error("Erro no teste:", error.message);
  }
}

testIntegration();
