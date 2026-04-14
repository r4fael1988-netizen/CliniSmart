import dotenv from "dotenv";

dotenv.config();

const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_BASE_URL = "https://lostbaskingshark-evolution.cloudfy.live";

async function minimalSet() {
  console.log("Tentando set minimalista do Webhook...");
  const res = await fetch(`${EVOLUTION_BASE_URL}/webhook/set/SOFIA_CRM`, {
    method: "POST",
    headers: {
      "apikey": EVOLUTION_API_KEY || "",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: "https://clini-smart.vercel.app/api/webhooks/whatsapp",
      enabled: true,
      webhookByEvents: false,
      events: ["MESSAGES_UPSERT"]
    })
  });

  const data = await res.json() as any;
  console.log("Resposta:", JSON.stringify(data, null, 2));
}

minimalSet();
