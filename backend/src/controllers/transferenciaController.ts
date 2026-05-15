import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

const transferenciaSchema = z.object({
  produtoId: z.string().cuid(),
  lojaDestinoId: z.string().cuid(),
  quantidade: z.coerce.number().int().positive('Quantidade deve ser positiva'),
});

export async function transferir(req: AuthRequest, res: Response) {
  const data = transferenciaSchema.parse(req.body);
  const usuarioId = req.usuario?.id;
  const lojaOrigemId = req.headers['x-loja-id'] as string;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  if (!lojaOrigemId) {
    return res.status(400).json({ error: 'Loja de origem não informada' });
  }

  if (lojaOrigemId === data.lojaDestinoId) {
    return res.status(400).json({ error: 'Loja de origem e destino não podem ser iguais' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscar produto de origem
      const produtoOrigem = await tx.produto.findUnique({
        where: { id: data.produtoId },
      });

      if (!produtoOrigem || produtoOrigem.lojaId !== lojaOrigemId) {
        throw new Error('Produto de origem não encontrado nesta unidade');
      }

      if (produtoOrigem.qtd_estoque < data.quantidade) {
        throw new Error('Estoque insuficiente para transferência');
      }

      // 2. Buscar ou Criar produto na loja de destino (pelo SKU)
      let produtoDestino = await tx.produto.findUnique({
        where: {
          sku_lojaId: {
            sku: produtoOrigem.sku,
            lojaId: data.lojaDestinoId,
          },
        },
      });

      if (!produtoDestino) {
        // Criar produto na unidade de destino
        produtoDestino = await tx.produto.create({
          data: {
            nome: produtoOrigem.nome,
            sku: produtoOrigem.sku,
            custo: produtoOrigem.custo,
            preco_venda: produtoOrigem.preco_venda,
            codigo_barras: produtoOrigem.codigo_barras,
            qtd_estoque: 0,
            estoque_minimo: produtoOrigem.estoque_minimo,
            categoriaId: produtoOrigem.categoriaId,
            lojaId: data.lojaDestinoId,
          },
        });
      }

      // 3. Atualizar estoques
      await tx.produto.update({
        where: { id: produtoOrigem.id },
        data: { qtd_estoque: { decrement: data.quantidade } },
      });

      await tx.produto.update({
        where: { id: produtoDestino.id },
        data: { qtd_estoque: { increment: data.quantidade } },
      });

      // 4. Registrar Movimentações
      // Saída na origem
      await tx.movimentacao.create({
        data: {
          tipo: 'SAIDA_TRANSFERENCIA',
          quantidade: data.quantidade,
          produtoId: produtoOrigem.id,
          usuarioId: usuarioId,
          lojaId: lojaOrigemId,
          valor_unit: produtoOrigem.custo,
          valor_total: produtoOrigem.custo * data.quantidade,
          observacao: `Transferência para unidade: ${data.lojaDestinoId}`,
        },
      });

      // Entrada no destino
      await tx.movimentacao.create({
        data: {
          tipo: 'ENTRADA_TRANSFERENCIA',
          quantidade: data.quantidade,
          produtoId: produtoDestino.id,
          usuarioId: usuarioId,
          lojaId: data.lojaDestinoId,
          valor_unit: produtoOrigem.custo,
          valor_total: produtoOrigem.custo * data.quantidade,
          observacao: `Transferência vinda da unidade: ${lojaOrigemId}`,
        },
      });

      return {
        mensagem: 'Transferência concluída com sucesso',
        quantidade: data.quantidade,
        produto: produtoOrigem.nome,
      };
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}
