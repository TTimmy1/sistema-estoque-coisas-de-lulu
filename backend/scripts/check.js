const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lojas = await prisma.loja.findMany();
  console.log("LOJAS:", lojas);

  const produtos = await prisma.produto.findMany();
  console.log("PRODUTOS:", produtos);
}

main().catch(console.error).finally(() => prisma.$disconnect());
