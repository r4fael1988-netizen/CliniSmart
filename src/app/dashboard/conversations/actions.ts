"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getConversations() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return [];

  try {
    const convs = await prisma.conversation.findMany({
      where: { clinicId: session.user.clinicId },
      orderBy: { lastMessageAt: "desc" },
      include: {
        patient: { select: { fullName: true } },
        interactions: {
            orderBy: { createdAt: "desc" },
            take: 1
        }
      }
    });

    return convs.map(c => ({
      id: c.id,
      patientId: c.patientId,
      patientName: c.patient?.fullName || "Visitante",
      lastMsg: c.interactions[0]?.content || "Iniciando conversa...",
      updatedAt: c.lastMessageAt,
      isEscalated: c.isEscalated,
      status: c.status
    }));
  } catch (error) {
    console.error("Erro ao buscar conversas:", error);
    return [];
  }
}

export async function getConversationMessages(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return [];

  try {
    return await prisma.interaction.findMany({
      where: { conversationId: id, clinicId: session.user.clinicId },
      orderBy: { createdAt: "asc" }
    });
  } catch (error) {
    return [];
  }
}

export async function takeOverConversation(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return { error: "Não autorizado" };

  try {
    await prisma.conversation.update({
      where: { id, clinicId: session.user.clinicId },
      data: { isEscalated: true, escalatedTo: session.user.id }
    });
    
    // Registra evento de sistema para feedback visual no chat
    await prisma.interaction.create({
        data: {
            clinicId: session.user.clinicId,
            conversationId: id,
            channel: "system",
            direction: "outbound",
            content: "O atendimento foi assumido por um humano. A IA está pausada.",
            handledBy: "human"
        }
    });

    revalidatePath("/dashboard/conversations");
    return { success: true };
  } catch (error) {
    return { error: "Falha ao assumir atendimento." };
  }
}

export async function handBackToAI(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return { error: "Não autorizado" };

  try {
    await prisma.conversation.update({
      where: { id, clinicId: session.user.clinicId },
      data: { isEscalated: false, escalatedTo: null }
    });

    revalidatePath("/dashboard/conversations");
    return { success: true };
  } catch (error) {
    return { error: "Falha ao devolver para a IA." };
  }
}

export async function sendMessage(conversationId: string, content: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return { error: "Não autorizado" };

  try {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId, clinicId: session.user.clinicId },
      include: { clinic: true, patient: true }
    });

    if (!conv || !conv.clinic.whatsappInstance) return { error: "Instância WhatsApp não configurada." };

    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
    const phone = conv.phoneNumber.replace(/\D/g, "");

    // Dispara via Evolution API
    await fetch(`${EVOLUTION_API_URL}/message/sendText/${conv.clinic.whatsappInstance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY! },
      body: JSON.stringify({ number: phone, text: content, delay: 500 }),
    });

    // Salva interação
    await prisma.interaction.create({
      data: {
        clinicId: session.user.clinicId,
        conversationId: conversationId,
        patientId: conv.patientId,
        channel: "whatsapp",
        direction: "outbound",
        content: content,
        handledBy: "human",
        agentId: session.user.id
      }
    });

    // Atualiza data da conversa
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
    });

    revalidatePath("/dashboard/conversations");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao enviar mensagem." };
  }
}

