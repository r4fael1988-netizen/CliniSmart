"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateClinicSettings(data: {
  agentName?: string;
  masterPrompt?: string;
  aiActive?: boolean;
  workHours?: any;
  logo?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return { error: "Não autorizado" };

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.clinicId }
    });

    if (!clinic) return { error: "Clínica não encontrada" };

    const currentSettings = (clinic.settings as any) || {};
    
    const updatedSettings = {
      ...currentSettings,
      agentName: data.agentName ?? currentSettings.agentName,
      masterPrompt: data.masterPrompt ?? currentSettings.masterPrompt,
      aiActive: data.aiActive ?? currentSettings.aiActive,
      workHours: data.workHours ?? currentSettings.workHours,
      logo: data.logo ?? currentSettings.logo,
    };

    await prisma.clinic.update({
      where: { id: session.user.clinicId },
      data: {
        settings: updatedSettings
      }
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return { error: "Falha ao salvar as configurações da clínica." };
  }
}

export async function getClinicSettings() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return null;

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.clinicId },
      select: { settings: true }
    });

    return clinic?.settings as any;
  } catch (error) {
    return null;
  }
}
