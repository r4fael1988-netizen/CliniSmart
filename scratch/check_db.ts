import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const clinic = await prisma.clinic.findFirst({
    where: { name: { contains: "MASTER" } }
  });
  console.log(JSON.stringify(clinic, null, 2));
  await prisma.$disconnect();
}

check();
