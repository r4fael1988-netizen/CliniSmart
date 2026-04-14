import dotenv from "dotenv";

dotenv.config();

const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_BASE_URL = "https://lostbaskingshark-evolution.cloudfy.live";
const CRM_WEBHOOK_URL = "https://clini-smart.vercel.app/api/webhooks/whatsapp";
const NEW_SECRET = "clini-smart-auth-2026";

async function fixWebhook() {
  console.log("Sincronizando Webhook da Evolution com Novo Secret...");

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
            "Authorization": `Bearer ${NEW_SECRET}`
          }
        }
      })
    });

    const data = await res.json() as any;
    if (res.ok) {
      console.log("Evolution API Webhook atualizado com sucesso!");
    } else {
      console.error("Erro na Evolution:", JSON.stringify(data, null, 2));
    }
  } catch (err: any) {
    console.error("Erro fatal:", err.message);
  }
}

fixWebhook();
