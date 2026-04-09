"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getClinicUsers() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return [];

  return await prisma.user.findMany({
    where: { clinicId: session.user.clinicId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createClinicUser(data: {
  name: string;
  email: string;
  role: string;
  password?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId || session?.user?.role !== 'admin') {
    return { error: "Não autorizado" };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { error: "E-mail já cadastrado." };

    const hashedPassword = await bcrypt.hash(data.password || "123456", 10);

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash: hashedPassword,
        clinicId: session.user.clinicId,
      }
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao criar usuário." };
  }
}

export async function toggleUserStatus(userId: string, active: boolean) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return { error: "Não autorizado" };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: active }
    });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao atualizar status." };
  }
}
