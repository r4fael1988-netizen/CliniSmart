import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

dotenv.config();

const prisma = new PrismaClient();
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_BASE_URL = "https://lostbaskingshark-evolution.cloudfy.live";

async function createSofiaInstance() {
  console.log("Iniciando criação da instância SOFIA_CRM (Tentativa 2)...");

  try {
    // 1. Criar Instância com integração especificada
    const createRes = await fetch(`${EVOLUTION_BASE_URL}/instance/create`, {
      method: "POST",
      headers: {
        "apikey": EVOLUTION_API_KEY || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        instanceName: "SOFIA_CRM",
        token: "SOFIA_TOKEN_2026",
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      })
    });

    const createData = await createRes.json() as any;

    if (!createRes.ok) {
        console.error("Erro ao criar instância:", createData);
        // Se já existir, tentamos apenas conectar
        if (createData.response?.message?.includes("already exists") || createData.status === 403) {
            console.log("Instância pode já existir, tentando capturar QR...");
        } else {
            return;
        }
    } else {
        console.log("Instância criada com sucesso!");
    }

    // 2. Capturar QR Code
    const connectRes = await fetch(`${EVOLUTION_BASE_URL}/instance/connect/SOFIA_CRM`, {
      method: "GET",
      headers: { "apikey": EVOLUTION_API_KEY || "" }
    });

    const connectData = await connectRes.json() as any;
    const qrBase64 = connectData.base64 || connectData.code;

    if (qrBase64) {
      console.log("QR Code disponível!");
    } else {
      console.warn("QR Code ainda não disponível.");
    }

    // 3. Configurar Webhook para o CRM
    const webhookRes = await fetch(`${EVOLUTION_BASE_URL}/webhook/set/SOFIA_CRM`, {
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

    if (webhookRes.ok) {
        console.log("Webhook configurado.");
    }

    // 4. Atualizar o CRM (Banco de Dados)
    const clinic = await prisma.clinic.findFirst({
        where: { name: { contains: "MASTER" } }
    });

    if (clinic) {
        await prisma.clinic.update({
            where: { id: clinic.id },
            data: { whatsappInstance: "SOFIA_CRM" }
        });
        console.log(`CRM atualizado para usar 'SOFIA_CRM'.`);
    }

    // Salvar QR em arquivo acessível
    fs.writeFileSync("./scratch/evolution_qr_result.json", JSON.stringify({
      instanceName: "SOFIA_CRM",
      qrCode: qrBase64,
      status: connectData.instance?.state
    }, null, 2));

  } catch (err: any) {
    console.error("Erro fatal:", err.message);
  } finally {
      await prisma.$disconnect();
  }
}

createSofiaInstance();
