import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const NEW_INSTANCE = "SOFIA_CRM";

async function updateClinic() {
  console.log("Atualizando registro da clínica...");

  try {
    // Buscamos a primeira clínica
    const clinic = await prisma.clinic.findFirst();

    if (clinic) {
      await prisma.clinic.update({
        where: { id: clinic.id },
        data: { 
            whatsappInstance: NEW_INSTANCE,
            // Garantimos que a IA está ativa e configurada
            settings: {
                ...(clinic.settings as any),
                aiActive: true,
                iaEnabled: true
            }
        }
      });
      console.log(`Clínica '${clinic.name}' atualizada com a instância '${NEW_INSTANCE}'.`);
    } else {
      console.error("Nenhuma clínica encontrada no banco.");
    }
  } catch (err: any) {
    console.error("Erro ao atualizar banco:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateClinic();
