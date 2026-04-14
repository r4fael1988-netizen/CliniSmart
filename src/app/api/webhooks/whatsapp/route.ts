import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// Evolution API Integration / Webhook Receptor
export async function POST(req: Request) {
  try {
    // 1. Recebe payload vindo do Evolution API
    const payload = await req.json();

    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      console.error("Tentativa de acesso não autorizado ao Webhook:", authHeader);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Estrutura Evolution API v2
    const { instance, data, event } = payload;
    
    const eventType = (event || "").toString().toLowerCase();
    
    if (eventType !== 'messages.upsert' && eventType !== 'messages_upsert') {
      return NextResponse.json({ status: "ignored event type", event }, { status: 200 });
    }

    const messageData = data.messages[0];
    const remoteJid = messageData.key.remoteJid;
    const pushName = messageData.pushName || "Desconhecido";
    const textContent = messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || "";
    const isFromMe = messageData.key.fromMe;

    if (!remoteJid || !textContent) {
      return NextResponse.json({ status: "invalid message payload" }, { status: 200 });
    }

    const patientPhone = remoteJid.split('@')[0];

    // Busca clínica vinculada a esta instância do WhatsApp
    const clinic = await prisma.clinic.findFirst({
      where: { whatsappInstance: instance }
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found for this instance" }, { status: 404 });
    }

    // Gerenciamento de Paciente/Lead
    let patient = await prisma.patient.findFirst({
      where: { clinicId: clinic.id, phone: { contains: patientPhone } }
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          clinicId: clinic.id,
          fullName: pushName,
          phone: patientPhone,
          email: `${patientPhone}@temp.clinismart.com`,
        }
      });
    }

    // Registro da Mensagem no CRM
    let conversation = await prisma.conversation.findFirst({
      where: { patientId: patient.id, status: 'active' }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          phoneNumber: patientPhone,
          whatsappInstance: instance,
          status: 'active'
        }
      });
    }

    await prisma.interaction.create({
      data: {
        clinicId: clinic.id,
        patientId: patient.id,
        conversationId: conversation.id,
        channel: 'whatsapp',
        content: textContent,
        direction: isFromMe ? 'outbound' : 'inbound',
        handledBy: isFromMe ? 'human' : 'client'
      }
    });

    // ENCAMINHAMENTO PARA AGENTE DE IA (n8n)
    const settings = (clinic.settings as any) || {};
    if (settings.aiActive && !isFromMe) {
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_BASE;
        if (n8nWebhookUrl) {
           console.log(`Forwarding message from ${patientPhone} to n8n...`);
           
           // Dispara async para não travar o webhook do Evolution
           fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${process.env.WEBHOOK_SECRET || 'clini-smart-auth-2026'}`
              },
              body: JSON.stringify({
                clinicId: clinic.id,
                clinicName: clinic.name,
                patientId: patient.id,
                patientName: patient.fullName,
                patientPhone: patientPhone,
                message: textContent,
                agentName: settings.agentName || "Sofia",
                masterPrompt: settings.masterPrompt || "",
                instance: instance
              })
           }).then(async (res) => {
              if (!res.ok) {
                 const errText = await res.text();
                 console.error(`n8n Webhook Error [${res.status}]:`, errText);
              } else {
                 console.log(`Successfully forwarded to n8n for patient ${patientPhone}`);
              }
           }).catch(err => {
              console.error("Critical Error forwarding to n8n:", err.message);
           });
        } else {
           console.warn("N8N_WEBHOOK_BASE not configured in environment.");
        }
    }

    return NextResponse.json({ success: true, message: "Interaction logged and forwarded" }, { status: 200 });

  } catch (error) {
    console.error("Evolution Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
