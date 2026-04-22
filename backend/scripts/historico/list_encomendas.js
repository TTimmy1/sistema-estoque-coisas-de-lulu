const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Conectado ao Prisma');
    const encs = await prisma.encomenda.findMany();
    console.log('Encomendas:', JSON.stringify(encs, null, 2));
  } catch(e) {
    console.error('Erro:', e && e.meta ? JSON.stringify(e.meta) : e);
  } finally {
    await prisma.$disconnect();
  }
}
main();