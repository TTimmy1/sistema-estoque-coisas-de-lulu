const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
prisma.$connect()
  .then(() => {
    console.log('Conectado ao Prisma');
    return bcrypt.hash('admin123', 10);
  })
  .then(hash => {
    console.log('Hash gerada:', hash);
    return prisma.usuario.update({
      where: { email: 'admin@test.com' },
      data: { senha: hash }
    });
  })
  .then(() => {
    console.log('Senha atualizada com sucesso');
    return prisma.$disconnect();
  })
  .catch(err => {
    console.error('Erro:', err && err.meta ? JSON.stringify(err.meta) : err);
    return prisma.$disconnect();
  });