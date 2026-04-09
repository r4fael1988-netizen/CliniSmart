"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateUserProfile(data: {
  name?: string;
  email?: string;
  phone?: string;
  image?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) return { error: "Usuário não encontrado" };

    // Se estiver tentando alterar a senha
    if (data.newPassword) {
      if (!data.currentPassword) {
        return { error: "Senha atual é obrigatória para alteração." };
      }

      const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!isValid) {
        return { error: "Senha atual incorreta." };
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: hashedPassword }
      });
    }

    // Atualizar outros campos
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name ?? user.name,
        email: data.email ?? user.email,
        avatarUrl: data.image ?? user.avatarUrl,
      }
    });

    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return { error: "Falha ao salvar as alterações do perfil." };
  }
}
