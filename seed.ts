import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);
  
  const clinic = await prisma.clinic.upsert({
    where: { slug: 'clinica-demo' },
    update: {},
    create: {
      name: 'Clínica Demo',
      slug: 'clinica-demo',
      planStatus: 'active',
    }
  });

  const user = await prisma.user.upsert({
    where: { email: 'admin@clinismart.com' },
    update: { passwordHash },
    create: {
      clinicId: clinic.id,
      name: 'Dr. Administrador',
      email: 'admin@clinismart.com',
      passwordHash,
      role: 'admin',
    }
  });

  console.log('Seed executado com sucesso:');
  console.log('E-mail: admin@clinismart.com');
  console.log('Senha: 123456');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
