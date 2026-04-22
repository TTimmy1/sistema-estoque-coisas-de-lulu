import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de Lojas...');

  // Criar Lojas Iniciais
  let loja1 = await prisma.loja.findUnique({ where: { nome: 'Loja 1' } });
  if (!loja1) {
    loja1 = await prisma.loja.create({ data: { nome: 'Loja 1' } });
    console.log(`Loja 1 criada com ID: ${loja1.id}`);
  }

  let loja2 = await prisma.loja.findUnique({ where: { nome: 'Loja 2' } });
  if (!loja2) {
    loja2 = await prisma.loja.create({ data: { nome: 'Loja 2' } });
    console.log(`Loja 2 criada com ID: ${loja2.id}`);
  }

  // Atualizar registros existentes para a Loja 1
  const updateResultProdutos = await prisma.produto.updateMany({
    where: { lojaId: null },
    data: { lojaId: loja1.id },
  });
  console.log(`Produtos atualizados para Loja 1: ${updateResultProdutos.count}`);

  const updateResultMovimentacoes = await prisma.movimentacao.updateMany({
    where: { lojaId: null },
    data: { lojaId: loja1.id },
  });
  console.log(`Movimentacoes atualizados para Loja 1: ${updateResultMovimentacoes.count}`);

  const updateResultPedidos = await prisma.pedido.updateMany({
    where: { lojaId: null },
    data: { lojaId: loja1.id },
  });
  console.log(`Pedidos atualizados para Loja 1: ${updateResultPedidos.count}`);

  const updateResultEncomendas = await prisma.encomenda.updateMany({
    where: { lojaId: null },
    data: { lojaId: loja1.id },
  });
  console.log(`Encomendas atualizadas para Loja 1: ${updateResultEncomendas.count}`);

  console.log('Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
