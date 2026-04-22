const { PrismaClient } = require('@prisma/client');
const path = require('path');

const dbPath = path.resolve(__dirname, 'prisma/dev.db');
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:' + dbPath } }
});

async function main() {
  try {
    await prisma.$connect();
    const encs = await prisma.encomenda.findMany({
      include: {
        produto: { select: { nome: true, sku: true, preco_venda: true } },
        fornecedor: true
      }
    });
    console.log('Encomendas atuais:', JSON.stringify(encs, null, 2));
  } catch(e) {
    console.error('Erro:', e && e.meta ? JSON.stringify(e.meta) : e);
  } finally {
    await prisma.$disconnect();
  }
}
main();