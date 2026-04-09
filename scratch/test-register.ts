import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function test() {
  const clinicName = "Clinica Teste " + Date.now()
  const userName = "Admin Teste"
  const email = "teste" + Date.now() + "@exemplo.com"
  const password = "password123"

  const slug = clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log("Iniciando transação...");
    
    const result = await prisma.$transaction(async (tx) => {
      console.log("Criando clínica...");
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          slug: slug,
          planStatus: "trial",
          whatsappInstance: `whatsapp_${slug}`,
          settings: {
            iaName: "Assistente Virtual",
            iaEnabled: false
          }
        }
      });
      console.log("Clínica criada:", clinic.id);

      console.log("Criando usuário...");
      const user = await tx.user.create({
        data: {
          clinicId: clinic.id,
          name: userName,
          email: email,
          passwordHash: passwordHash,
          role: "admin",
          isActive: true
        }
      });
      console.log("Usuário criado:", user.id);

      return { clinic, user };
    });

    console.log("Sucesso:", result.clinic.name);
  } catch (error) {
    console.error("ERRO DETALHADO NO CADASTRO:");
    console.error(error);
  } finally {
    await prisma.$disconnect()
  }
}

test()
