const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'prisma/dev.db');
console.log('Caminho do banco:', dbPath);
console.log('Arquivo existe?', fs.existsSync(dbPath));

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'file:' + dbPath }
  }
});

prisma.$connect()
  .then(() => {
    console.log('Conectado ao Prisma');
    return prisma.usuario.findMany();
  })
  .then(users => {
    console.log('Usuarios:', JSON.stringify(users, null, 2));
    return prisma.$disconnect();
  })
  .catch(err => {
    console.error('Erro:', err && err.meta ? JSON.stringify(err.meta) : err);
    return prisma.$disconnect();
  });