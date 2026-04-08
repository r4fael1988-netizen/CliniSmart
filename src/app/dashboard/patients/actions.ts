"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";


const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

export async function getPatients() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return [];

  try {
    const patients = await prisma.patient.findMany({
      where: { clinicId: session.user.clinicId },
      orderBy: { updatedAt: "desc" },
    });
    
    return patients;
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return [];
  }
}

export async function getPatientById(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return null;

  try {
    const patient = await prisma.patient.findFirst({
      where: { id, clinicId: session.user.clinicId },
      include: {
        appointments: {
          orderBy: { scheduledAt: "desc" },
          include: { doctor: true, service: true }
        },
        conversations: {
          take: 1,
          orderBy: { lastMessageAt: "desc" },
          include: {
            interactions: {
              orderBy: { createdAt: "asc" },
            }
          }
        }
      }
    });

    return patient;
  } catch (error) {
    console.error("Erro ao buscar paciente:", error);
    return null;
  }
}

export async function sendMessage(patientId: string, content: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return { error: "Não autorizado" };

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId, clinicId: session.user.clinicId },
      include: { clinic: true }
    });

    if (!patient || !patient.clinic.whatsappInstance) {
      return { error: "Paciente ou instância WhatsApp não encontrados." };
    }

    const instance = patient.clinic.whatsappInstance;
    const phone = patient.phone.replace(/\D/g, "");

    // 1. Enviar via Evolution API
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY!,
      },
      body: JSON.stringify({
        number: phone,
        text: content,
        delay: 1200,
        linkPreview: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Erro ao enviar mensagem via WhatsApp API");
    }

    // 2. Registrar a interação no banco como "human" (secretária)
    // Buscamos a última conversa ativa para este paciente
    let conversation = await prisma.conversation.findFirst({
      where: { patientId, clinicId: session.user.clinicId, status: "active" }
    });

    // Se não houver conversa ativa, abrimos uma nova
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          clinicId: session.user.clinicId,
          patientId,
          phoneNumber: patient.phone,
          whatsappInstance: instance,
          status: "active",
        }
      });
    }

    await prisma.interaction.create({
      data: {
        clinicId: session.user.clinicId,
        patientId,
        conversationId: conversation.id,
        channel: "whatsapp",
        direction: "outbound",
        content: content,
        handledBy: "human",
        agentId: session.user.id
      }
    });

    revalidatePath(`/dashboard/patients/${patientId}`);
    return { success: true };

  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return { error: "Falha ao enviar mensagem." };
  }
}

export async function updatePatientNotes(id: string, notes: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return { error: "Não autorizado" };

  try {
    await prisma.patient.update({
      where: { id, clinicId: session.user.clinicId },
      data: { notes }
    });
    revalidatePath(`/dashboard/patients/${id}`);
    return { success: true };
  } catch (err) {
    return { error: "Falha ao salvar anotações." };
  }
}
