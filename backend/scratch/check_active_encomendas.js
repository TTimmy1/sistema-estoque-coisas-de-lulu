const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const n = await prisma.encomenda.count({
    where: {
      status: { in: ['EM_ANDAMENTO', 'PENDENTE', 'EM PRODUCAO'] }
    }
  });
  console.log('Count:', n);
  const items = await prisma.encomenda.findMany({
    where: {
      status: { in: ['EM_ANDAMENTO', 'PENDENTE', 'EM PRODUCAO'] }
    },
    take: 5
  });
  console.log('Items:', JSON.stringify(items, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
