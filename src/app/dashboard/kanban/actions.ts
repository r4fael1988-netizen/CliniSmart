"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";


// Interface espelho do Client
export type CardType = {
  id: string;
  columnId: string;
  patientName: string;
  specialty: string;
  lastMessage: string;
  timeAgo: string;
  priority: "normal" | "attention" | "urgent";
  source: string;
  isOverdue: boolean;
};

export async function getKanbanCards(): Promise<CardType[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      throw new Error("Não autorizado");
    }

    const clinicId = session.user.clinicId;

    // Busca os pacientes da clínica e a sua última conversa para montar os cards
    const patients = await prisma.patient.findMany({
      where: { clinicId },
      include: {
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
          take: 1,
          include: {
            interactions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          take: 1
        }
      }
    });

    const now = new Date().getTime();
    const FOUR_HOURS_IN_MS = 4 * 60 * 60 * 1000;

    return patients.map(p => {
      // Definir a última interação caso exista
      const lastConv = p.conversations[0];
      const lastMsg = lastConv?.interactions?.[0];
      const lastMsgDate = lastMsg?.createdAt || p.updatedAt;
      
      const timeDiff = now - new Date(lastMsgDate).getTime();
      let timeAgo = "Recente";
      
      if (timeDiff < 60000) timeAgo = "Agora";
      else if (timeDiff < 3600000) timeAgo = `${Math.floor(timeDiff/60000)} min`;
      else if (timeDiff < 86400000) timeAgo = `${Math.floor(timeDiff/3600000)} h`;
      else timeAgo = `${Math.floor(timeDiff/86400000)} d`;

      // Regra de Overdue (Atraso de +4hrs sem mexer na aba de status e se a prioridade não for cancelled/done)
      const isClosed = p.status === 'cancelled' || p.status === 'done';
      let overdue = false;
      if (!isClosed && timeDiff > FOUR_HOURS_IN_MS) {
        overdue = true;
      }

      // Se não há mensagens ainda, o lastMessage é o genérico.
      const lastMessageText = lastMsg ? lastMsg.content : "Iniciou contato na clínica";

      // Pega a especialidade da última consulta, ou exibe Padrão
      const specialty = p.appointments[0]?.specialty || "Triagem Geral";

      return {
        id: p.id,
        columnId: p.status, // coluna atual do lead no banco
        patientName: p.fullName,
        specialty,
        lastMessage: lastMessageText,
        timeAgo,
        priority: p.priority as "normal" | "attention" | "urgent" || "normal",
        source: p.source || "Geral",
        isOverdue: overdue,
      };
    });

  } catch (error) {
    console.error("Erro na busca dos Kanban Cards: ", error);
    return [];
  }
}

export async function updatePatientStatus(patientId: string, newStatus: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      throw new Error("Não autorizado");
    }

    // Security check pra garantir que o paciente é desta clínica
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId }
    });

    if (!patient) throw new Error("Paciente não encontrado ou acesso restrito.");

    await prisma.patient.update({
      where: { id: patientId },
      data: { status: newStatus }
    });

    // Avisa pro Next.js limpar o cache e revalidar a navegação globalmente
    revalidatePath("/dashboard/kanban");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status: ", error);
    return { success: false };
  }
}
