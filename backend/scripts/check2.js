const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const v = await prisma.vendedor.findMany();
  console.log("VENDEDORES:", v);
}

main().catch(console.error).finally(() => prisma.$disconnect());
