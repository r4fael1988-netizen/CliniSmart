import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Evolution API Integration / Webhook Receptor
export async function POST(req: Request) {
  try {
    // 1. Recebe payload vindo do Evolution API (ou propagado pelo n8n)
    const payload = await req.json();

    // Verificação de segurança (Webhook Secret ou API Key dependendo de como Evolution está configurado)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.EVOLUTION_API_TOKEN}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Estrutura básica Evolution API v2 para mensagens recebidas
    const { instance, data, event } = payload;
    
    // Ignorar eventos não relacionados a mensagens
    if (event !== 'messages.upsert') {
      return NextResponse.json({ status: "ignored event type" }, { status: 200 });
    }

    const messageData = data.messages[0];
    const remoteJid = messageData.key.remoteJid; // O telefone do contato ex: 5511999999999@s.whatsapp.net
    const pushName = messageData.pushName || "Desconhecido";
    const textContent = messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || "";
    const isFromMe = messageData.key.fromMe;

    if (!remoteJid || !textContent) {
      return NextResponse.json({ status: "invalid message payload" }, { status: 200 });
    }

    const patientPhone = remoteJid.split('@')[0];

    // Lógica para registrar interação no banco do CRM (Resgate do histórico exigido no Módulo 6)
    // Usamos transaction ou garantimos que o Clinic e Patient existem
    let patient = await prisma.patient.findFirst({
      where: { phone: { contains: patientPhone } }
    });

    // Se paciente não existe (Lead Novo), delegar para o n8n qualificá-lo primeiro
    // Mas registramos temporariamente se o clinica base estiver disponivel (Pegaremos o primeiro admin para demo)
    if (!patient) {
      const clinic = await prisma.clinic.findFirst();
      if (clinic) {
        patient = await prisma.patient.create({
          data: {
            clinicId: clinic.id,
            name: pushName,
            phone: patientPhone,
            email: `${patientPhone}@temp.clinismart.com`,
          }
        });
      }
    }

    if (patient) {
      // Garantir existência de uma Conversation aberta para popular a nossa UI Web do Chat
      let conversation = await prisma.conversation.findFirst({
        where: { patientId: patient.id, status: 'active' }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            clinicId: patient.clinicId,
            patientId: patient.id,
            status: 'active',
            channel: 'whatsapp'
          }
        });
      }

      // Inserir Interaction (A Mensagem)
      await prisma.interaction.create({
        data: {
          conversationId: conversation.id,
          type: 'text',
          content: textContent,
          direction: isFromMe ? 'outbound' : 'inbound',
          sentBy: isFromMe ? 'human' : 'client' // n8n ou IA será ajustado no próximo webhook
        }
      });
    }

    return NextResponse.json({ success: true, message: "Interaction logged" }, { status: 200 });

  } catch (error) {
    console.error("Evolution Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
