import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";


function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function POST(req: Request) {
  console.log("--> API DE REGISTRO CHAMADA às " + new Date().toLocaleTimeString());
  try {
    const { clinicName, userName, email, password } = await req.json();

    if (!clinicName || !userName || !email || !password) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
    }

    // Verifica se o email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Este email já está em uso." }, { status: 409 });
    }

    let slug = generateSlug(clinicName);
    // Verifica se o slug da clínica já existe, para evitar colisões
    const existingClinic = await prisma.clinic.findUnique({ where: { slug } });
    if (existingClinic) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Usa transaction para garantir que a clínica e o usuário sejam criados juntos
    // Se a criação do usuário falhar, a clínica será cancelada.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criamos a clínica configurando propriedades da API
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          slug: slug,
          planStatus: "trial",
          whatsappInstance: `whatsapp_${slug}_${Math.floor(Math.random() * 9999)}`,
          settings: {
            iaName: "Assistente Virtual",
            iaEnabled: false
          }
        }
      });

      // 2. Criamos o Usuário atrelado
      const user = await tx.user.create({
        data: {
          clinicId: clinic.id,
          name: userName,
          email: email,
          passwordHash: passwordHash,
          role: "admin", // Fundador tem permissões de admin
          isActive: true
        }
      });

      return { clinic, user };
    });

    return NextResponse.json({ 
      success: true, 
      message: "Clínica registrada com sucesso!",
      clinic: { id: result.clinic.id, slug: result.clinic.slug }
    }, { status: 201 });

  } catch (error: any) {
    // Erro genérico para produção por segurança
    let message = "Erro interno ao processar o cadastro.";
    
    // Tratamento de conflitos conhecidos
    if (error.code === 'P2002') {
       message = "Este email já está em uso ou houve um conflito no nome da clínica.";
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
