/**
 * Sistema Automatizado de Follow-Ups (Cron Job)
 * Requisitos: node-cron e prisma client
 * Para rodar localmente ou em conteiner: npx tsx scripts/cron.ts
 */
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";

const prisma = new PrismaClient();

// URL do webhook que vai disparar a mensagem via Evolution API/n8n
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_BASE || "https://lostbaskingshark-n8n.cloudfy.live/webhook";

console.log("🚀 Serviço de Cron (Lembretes) iniciado...");

async function sendFollowUp(appointmentId: string, patientPhone: string, type: "24h" | "2h", message: string) {
  try {
    console.log(`Enviando alerta de ${type} para ${patientPhone}...`);
    // Passamos a responsabilidade de montar e enviar para o n8n ou disparar numa API local de Sender
    await fetch(`${N8N_WEBHOOK_URL}/follow-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: patientPhone, type, message })
    });

    // Atualiza o banco para não mandar duas vezes
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: type === "24h" ? { reminder24hSent: true } : { reminder2hSent: true }
    });
  } catch (err) {
    console.error(`Erro ao disparar reminder ${type}:`, err);
  }
}

// Verifica a cada 15 minutos se existem consultas batendo o critério de 24h ou 2h de distância.
cron.schedule("*/15 * * * *", async () => {
  console.log("⏳ Checando agendamentos para follow-up...");
  
  const now = new Date();
  
  // Limites temporais (+24h) (+2h)
  const in24HoursStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
  const in24HoursEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

  const in2HoursStart = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);
  const in2HoursEnd = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

  try {
    const upcoming = await prisma.appointment.findMany({
      where: {
        status: "scheduled",
        OR: [
          { scheduledAt: { gte: in24HoursStart, lte: in24HoursEnd }, reminder24hSent: false },
          { scheduledAt: { gte: in2HoursStart, lte: in2HoursEnd }, reminder2hSent: false }
        ]
      },
      include: { patient: true }
    });

    for (const app of upcoming) {
      const is24h = app.scheduledAt >= in24HoursStart && app.scheduledAt <= in24HoursEnd;
      
      if (is24h && !app.reminder24hSent) {
        await sendFollowUp(
          app.id, 
          app.patient.phone, 
          "24h", 
          `Olá ${app.patient.fullName}! Sua consulta está confirmada para amanhã às ${app.scheduledAt.getHours()}:${app.scheduledAt.getMinutes().toString().padStart(2, '0')}.`
        );
      } else if (!is24h && !app.reminder2hSent) {
        await sendFollowUp(
          app.id, 
          app.patient.phone, 
          "2h", 
          `Lembrete: Sua consulta é daqui a pouco, às ${app.scheduledAt.getHours()}:${app.scheduledAt.getMinutes().toString().padStart(2, '0')}. Estamos aguardando você!`
        );
      }
    }

  } catch (error) {
    console.error("Erro na rotina de agendamentos:", error);
  }
});
