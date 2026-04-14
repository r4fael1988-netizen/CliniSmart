import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkProjectHealth() {
  console.log("--- Diagnóstico de Lançamento ---");
  
  // 1. Clínicas
  const clinics = await prisma.clinic.findMany();
  console.log(`Clínicas cadastradas: ${clinics.length}`);
  for (const c of clinics) {
    const settings = (c.settings as any) || {};
    console.log(`  - Clinic: ${c.name} [Slug: ${c.slug}]`);
    console.log(`    AI Active: ${settings.aiActive}`);
    console.log(`    Agent Name: ${settings.agentName}`);
    console.log(`    WhatsApp Instance: ${c.whatsappInstance}`);
  }

  // 2. Médicos Ativos
  const activeDoctors = await prisma.doctor.count({ where: { isActive: true } });
  console.log(`Médicos Ativos: ${activeDoctors}`);

  // 3. Serviços Ativos
  const activeServices = await prisma.service.count({ where: { isActive: true } });
  console.log(`Serviços Ativos: ${activeServices}`);

  if (activeDoctors === 0 || activeServices === 0) {
    console.warn("AVISO: A clínica não possui médicos ou serviços cadastrados/ativos. A IA não conseguirá agendar nada.");
  } else {
    console.log("SUCESSO: Dados básicos encontrados.");
  }

  await prisma.$disconnect();
}

checkProjectHealth();
