"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";


export async function getServices() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return [];

  try {
    const services = await prisma.service.findMany({
      where: { clinicId: session.user.clinicId },
      orderBy: { createdAt: "desc" },
    });
    
    // Converte os decimals do Prisma param números legíveis no Frontend
    return services.map(s => ({
      ...s,
      price: Number(s.price)
    }));
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return [];
  }
}

export async function addService(data: { name: string; price: number }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return { error: "Não autorizado" };

  try {
    await prisma.service.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        price: data.price,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    return { error: "Falha ao criar serviço." };
  }
}

export async function deleteService(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return { error: "Não autorizado" };

  try {
    // Confirma que o serviço pertence à clinica
    const service = await prisma.service.findFirst({
      where: { id, clinicId: session.user.clinicId },
    });

    if (!service) return { error: "Serviço não encontrado." };

    await prisma.service.delete({
      where: { id },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar serviço:", error);
    return { error: "Falha ao deletar serviço, ele pode estar atrelado a um agendamento existente." };
  }
}
