import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// Evolution API Integration / Outbound Sender Endpoint
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const validSecret = process.env.WEBHOOK_SECRET || "clini-smart-auth-2026";
    
    if (authHeader !== `Bearer ${validSecret}`) {
      console.error("Auth Fail: Received", authHeader, "Expected Bearer", validSecret);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientId, patientPhone, textMessage, sentBy = "human" } = await req.json();

    // Na prática o Endpoint protegerá a rota com auth middleware
    if ((!patientId && !patientPhone) || !textMessage) {
      return NextResponse.json({ error: "Missing required fields (patientId or patientPhone and textMessage)" }, { status: 400 });
    }

    let patient;
    if (patientId) {
       patient = await prisma.patient.findUnique({
         where: { id: patientId }
       });
    }

    if (!patient && patientPhone) {
       patient = await prisma.patient.findFirst({
         where: { phone: { contains: patientPhone } }
       });
    }

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Chamada REAL para Evolution API enviar a mensagem  
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "https://lostbaskingshark-evolution.cloudfy.live";
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "ZP2Vfc24UP1BtNZ6QlbISCVz0N9GW9BE";
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || "SOFIA_CRM";

    // Normalização do número de telefone (Garantir 55 e sem caracteres especiais)
    let formattedNumber = patient.phone.replace(/\D/g, "");
    if (!formattedNumber.startsWith("55")) {
      formattedNumber = `55${formattedNumber}`;
    }

    console.log(`Sending message via Evolution [${instanceName}] to ${formattedNumber}`);

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': `${EVOLUTION_API_KEY}`
      },
      body: JSON.stringify({
        number: formattedNumber,
        text: textMessage
      })
    });

    if (!response.ok) {
       const errorText = await response.text();
       console.error("Evolution API Error:", response.status, errorText);
       throw new Error(`Evolution API failed to send message: ${response.status}`);
    }

    // Se o envio for sucesso, atualizar o banco para aparecer no Omnichannel
    let conversation = await prisma.conversation.findFirst({
      where: { patientId: patient.id, status: 'active' }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          clinicId: patient.clinicId,
          patientId: patient.id,
          phoneNumber: patient.phone,
          whatsappInstance: instanceName,
          status: 'active'
        }
      });
    }

    const interaction = await prisma.interaction.create({
      data: {
        clinicId: patient.clinicId,
        patientId: patient.id,
        conversationId: conversation.id,
        channel: 'whatsapp',
        content: textMessage,
        direction: 'outbound',
        handledBy: sentBy // 'human' or 'ia'
      }
    });

    return NextResponse.json({ success: true, interaction }, { status: 200 });

  } catch (error) {
    console.error("Evolution Sender Error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
