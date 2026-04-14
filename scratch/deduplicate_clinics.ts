import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Deduplicação de Instâncias ---');

  // 1. Remover a instância da Clinica Teste
  const updateTeste = await prisma.clinic.update({
    where: { id: '319b410f-7917-422c-a386-b5e02fc33884' },
    data: { whatsappInstance: null }
  });
  console.log('✅ Clinica Teste atualizada (whatsappInstance = null)');

  // 2. Garantir que Oliveira está com a instância correta
  const updateOliveira = await prisma.clinic.update({
    where: { id: '15e2eda4-bef3-45f5-8b8d-ae9604e242bb' },
    data: { whatsappInstance: 'SOFIA_CRM' }
  });
  console.log('✅ Clinica Oliveira garantida (whatsappInstance = SOFIA_CRM)');

  console.log('--- Fim da Deduplicação ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
