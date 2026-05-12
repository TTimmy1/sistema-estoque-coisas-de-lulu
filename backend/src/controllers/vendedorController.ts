import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const createSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
});

export async function index(_req: Request, res: Response) {
  const vendedores = await prisma.vendedor.findMany({
    orderBy: { nome: 'asc' },
    include: {
      _count: {
        select: {
          movimentacoes: {
            where: {
              tipo: { in: ['SAIDA_VENDA', 'SAIDA_DESCARTE'] },
            },
          },
        },
      },
      movimentacoes: {
        where: {
          tipo: { in: ['SAIDA_VENDA', 'SAIDA_DESCARTE'] },
        },
        select: { valor_total: true },
      },
    },
  });

  const result = vendedores.map((v) => ({
    id: v.id,
    nome: v.nome,
    criado_em: v.criado_em,
    _count: v._count,
    totalVendas: v.movimentacoes.reduce((sum, m) => sum + m.valor_total, 0),
  }));

  return res.json(result);
}

export async function create(req: Request, res: Response) {
  const data = createSchema.parse(req.body);

  const existe = await prisma.vendedor.findUnique({ where: { nome: data.nome } });
  if (existe) {
    return res.status(400).json({ error: 'Vendedor já cadastrado' });
  }

  const vendedor = await prisma.vendedor.create({ data });
  return res.status(201).json(vendedor);
}

export async function update(req: Request, res: Response) {
  const id = req.params.id as string;
  const data = createSchema.parse(req.body);

  const existe = await prisma.vendedor.findUnique({ where: { nome: data.nome } });
  if (existe && existe.id !== id) {
    return res.status(400).json({ error: 'Vendedor já cadastrado' });
  }

  const vendedor = await prisma.vendedor.update({
    where: { id },
    data,
  });
  return res.json(vendedor);
}

export async function remove(req: Request, res: Response) {
  const id = req.params.id as string;
  
  // Verify if it has any movements
  const count = await prisma.movimentacao.count({ where: { vendedorId: id } });
  if (count > 0) {
    return res.status(400).json({ error: 'Não é possível excluir vendedor com movimentações registradas' });
  }

  await prisma.vendedor.delete({ where: { id } });
  return res.status(204).send();
}
