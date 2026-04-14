import dotenv from "dotenv";

dotenv.config();

const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY; // A chave correta que o CRM espera
const EVOLUTION_BASE_URL = "https://lostbaskingshark-evolution.cloudfy.live";
const CRM_WEBHOOK_URL = "https://clini-smart.vercel.app/api/webhooks/whatsapp";

async function fixWebhookAuth() {
  console.log("Corrigindo Autenticação do Webhook (Mismatch de Secret)...");

  try {
    const res = await fetch(`${EVOLUTION_BASE_URL}/webhook/set/SOFIA_CRM`, {
      method: "POST",
      headers: {
        "apikey": EVOLUTION_API_KEY || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        webhook: {
          url: CRM_WEBHOOK_URL,
          enabled: true,
          events: ["MESSAGES_UPSERT"],
          headers: {
            "Authorization": `Bearer ${EVOLUTION_API_KEY}` // AGORA COMBINA COM O CRM!
          }
        }
      })
    });

    const data = await res.json() as any;
    if (res.ok) {
      console.log("Sucesso! O CRM agora vai aceitar as mensagens da Evolution.");
    } else {
      console.error("Erro na Evolution:", data);
    }
  } catch (err: any) {
    console.error("Erro fatal:", err.message);
  }
}

fixWebhookAuth();
