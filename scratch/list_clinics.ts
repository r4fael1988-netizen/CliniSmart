import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function listClinics() {
  const clinics = await prisma.clinic.findMany();
  console.log(JSON.stringify(clinics, null, 2));
  await prisma.$disconnect();
}

listClinics();
