const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123456', 10);
  await prisma.usuario.update({
    where: { email: 'admin@test.com' },
    data: { senha: hash }
  });
  console.log('Senha atualizada com sucesso para admin@test.com');
}

main().catch(console.error).finally(() => prisma.$disconnect());
