"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getDoctors() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return [];

  try {
    return await prisma.doctor.findMany({
      where: { clinicId: session.user.clinicId },
      orderBy: { name: "asc" }
    });
  } catch (error) {
    console.error("Erro ao buscar médicos:", error);
    return [];
  }
}

export async function addDoctor(data: {
  name: string;
  specialty: string;
  crm?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return { error: "Não autorizado" };

  try {
    const doctor = await prisma.doctor.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        specialty: data.specialty,
        crm: data.crm,
        isActive: true
      }
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/agenda");
    return { success: true, id: doctor.id };
  } catch (error) {
    console.error("Erro ao adicionar médico:", error);
    return { error: "Falha ao cadastrar médico." };
  }
}

export async function toggleDoctorStatus(id: string, isActive: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return { error: "Não autorizado" };

  try {
    await prisma.doctor.update({
      where: { id, clinicId: session.user.clinicId },
      data: { isActive }
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (error) {
    return { error: "Falha ao alterar status." };
  }
}

export async function deleteDoctor(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return { error: "Não autorizado" };

  try {
    // Verifica se há agendamentos vinculados
    const appointmentsCount = await prisma.appointment.count({
      where: { doctorId: id }
    });

    if (appointmentsCount > 0) {
      return { error: "Não é possível excluir um médico com agendamentos vinculados. Desative-o em vez disso." };
    }

    await prisma.doctor.delete({
      where: { id, clinicId: session.user.clinicId }
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (error) {
    return { error: "Falha ao excluir médico." };
  }
}
