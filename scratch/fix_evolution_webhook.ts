import dotenv from "dotenv";

dotenv.config();

const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_BASE_URL = "https://lostbaskingshark-evolution.cloudfy.live";
const CRM_WEBHOOK_URL = "https://clini-smart.vercel.app/api/webhooks/whatsapp";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "secret-para-validar-webhook";

async function fixWebhook() {
  console.log("Corrigindo Webhook da Evolution API...");

  try {
    const res = await fetch(`${EVOLUTION_BASE_URL}/webhook/set/SOFIA_CRM`, {
      method: "POST",
      headers: {
        "apikey": EVOLUTION_API_KEY || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: CRM_WEBHOOK_URL,
        enabled: true,
        webhookByEvents: false,
        events: ["MESSAGES_UPSERT"],
        headers: {
          "Authorization": `Bearer ${WEBHOOK_SECRET}`
        }
      })
    });

    const data = await res.json() as any;
    if (res.ok) {
      console.log("Webhook corrigido! Agora aponta para o CRM com Autenticação.");
    } else {
      console.error("Erro ao corrigir webhook:", data);
    }
  } catch (err: any) {
    console.error("Erro fatal:", err.message);
  }
}

fixWebhook();
