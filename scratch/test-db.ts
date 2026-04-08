
import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('Testando conexão com o banco de dados...')
    const result = await prisma.$queryRaw`SELECT 1`
    console.log('Conexão bem-sucedida:', result)
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
