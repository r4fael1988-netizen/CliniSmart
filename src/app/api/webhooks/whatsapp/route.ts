import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * RECEPTOR DE WEBHOOK ULTRA-RESILIENTE (SOFIA CRM v3)
 * Este endpoint recebe mensagens da Evolution API e as processa para o n8n.
 * Projetado para ser tolerante a variações de payload da v1/v2.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Webhook Received:", JSON.stringify(payload).substring(0, 200));

    // 1. Validação de Segurança (com Fallback)
    const authHeader = req.headers.get("authorization");
    const validSecret = process.env.WEBHOOK_SECRET || "clini-smart-auth-2026";
    
    if (authHeader !== `Bearer ${validSecret}`) {
      console.error("Auth Fail. Received:", authHeader);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Normalização do Evento (Independente de Case/Versão)
    const rawEvent = payload.event || payload.evento || "";
    const eventType = rawEvent.toString().toLowerCase();
    
    // Aceita mensagens novas (upsert)
    if (!eventType.includes('messages.upsert') && !eventType.includes('messages_upsert')) {
       return NextResponse.json({ status: "ignored event", event: rawEvent }, { status: 200 });
    }

    // 3. Extração Segura de Dados (Data Mapping)
    const instance = payload.instance || payload.instancia || "unknown";
    const data = payload.data || payload.dados || {};
    
    // Tenta encontrar a mensagem em diferentes estruturas (v1 vs v2)
    const messageData = (data.messages && data.messages[0]) || data;
    const remoteJid = messageData.key?.remoteJid || messageData.remoteJid || "";
    const pushName = messageData.pushName || payload.senderName || "Paciente";
    const isFromMe = !!messageData.key?.fromMe;

    // Conteúdo da Mensagem (Texto)
    const textContent = 
      messageData.message?.conversation || 
      messageData.message?.extendedTextMessage?.text || 
      messageData.content || 
      "";

    if (!remoteJid || isFromMe) {
       return NextResponse.json({ status: "handled internally or invalid", isFromMe }, { status: 200 });
    }

    const patientPhone = remoteJid.split('@')[0];

    // 4. Localização de Clínica e Paciente
    const clinic = await prisma.clinic.findFirst({
      where: { whatsappInstance: instance }
    });

    if (!clinic) {
      console.error(`Clinic not found for instance: ${instance}`);
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Busca/Cria Paciente
    let patient = await prisma.patient.findFirst({
      where: { clinicId: clinic.id, phone: { contains: patientPhone.replace('55', '') } }
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          clinicId: clinic.id,
          fullName: pushName,
          phone: patientPhone,
          email: `${patientPhone}@temp.clinismart.com`,
          source: 'whatsapp'
        }
      });
    }

    // 5. Registro da Interação (Omnichannel)
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
        direction: 'inbound',
        handledBy: 'client'
      }
    });

    // 6. ENCAMINHAMENTO DUPLO (PRODUÇÃO + TESTE) PARA N8N
    const settings = (clinic.settings as any) || {};
    if (settings.aiActive !== false) {
        const DEFAULT_PROD_URL = "https://lostbaskingshark-n8n.cloudfy.live/webhook/crm-manager-agent-v1";
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_BASE || DEFAULT_PROD_URL;
        
        // Gera as URLs de destino (Produção e Teste se possível)
        const urlsToNotify = [n8nWebhookUrl];
        if (n8nWebhookUrl.includes('/webhook/') && !n8nWebhookUrl.includes('/webhook-test/')) {
           urlsToNotify.push(n8nWebhookUrl.replace('/webhook/', '/webhook-test/'));
        }

        const forwardPayload = {
          clinicId: clinic.id,
          clinicName: clinic.name,
          patientId: patient.id,
          patientName: patient.fullName,
          patientPhone: patientPhone,
          message: textContent,
          agentName: settings.agentName || "Sofia",
          masterPrompt: settings.masterPrompt || "",
          instance: instance
        };

        // Envia para todas as URLs mapeadas de forma assíncrona
        urlsToNotify.forEach(url => {
           fetch(url, {
              method: 'POST',
              headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${process.env.WEBHOOK_SECRET || 'clini-smart-auth-2026'}`
              },
              body: JSON.stringify(forwardPayload)
           }).catch(err => console.error(`Forwarding Fail to ${url}:`, err.message));
        });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Critical Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
