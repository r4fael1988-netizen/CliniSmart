import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import path from 'path'

// Força o carregamento do .env usando o caminho absoluto na raiz do projeto
dotenv.config({ path: path.join(process.cwd(), '.env') })

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL não identificada em process.env. Verifique o arquivo .env na raiz.");
} else {
  console.log("✅ Conexão com o banco (DATABASE_URL) detectada com sucesso.");
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

