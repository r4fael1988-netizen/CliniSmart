import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

// Força o carregamento do .env em ambientes onde o Next.js falha no carregamento precoce
dotenv.config()

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL não encontrada em process.env durante a inicialização do Prisma.");
} else {
  console.log("✅ DATABASE_URL detectada com sucesso.");
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma

