import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// Evolution API Integration / Outbound Sender Endpoint
export async function POST(req: Request) {
  try {
    const { patientId, textMessage, sentBy = "human" } = await req.json();

    // Na prática o Endpoint protegerá a rota com auth middleware
    if (!patientId || !textMessage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Chamada REAL para Evolution API enviar a mensagem  
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_TOKEN;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || "ClinicaMaster";

    // Uncomment para uso real em produção:
    /*
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EVOLUTION_API_KEY}`
      },
      body: JSON.stringify({
        number: patient.phone, // Formato exigido: 5511999999999
        text: textMessage
      })
    });

    if (!response.ok) {
       throw new Error("Evolution API failed to send message");
    }
    */

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
