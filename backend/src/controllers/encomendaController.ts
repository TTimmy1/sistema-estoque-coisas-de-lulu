import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const createSchema = z.object({
  pedido: z.string().min(1, 'Descrição do pedido é obrigatória'),
  quantidade: z.number().int().min(1).default(1),
  valor_unit: z.number().min(0).optional(),
  valor_total: z.number().min(0).optional(),
  nome_cliente: z.string().optional(),
  telefone_cliente: z.string().optional(),
  previsao_entrega: z.string().optional(),
  vendedorId: z.string().cuid('Vendedor é obrigatório'),
  valor_sinal: z.number().min(0).optional().default(0),
  pago_total: z.boolean().optional().default(false),
});

const updateSchema = z.object({
  pedido: z.string().optional(),
  quantidade: z.number().int().min(1).optional(),
  valor_unit: z.number().min(0).optional(),
  valor_total: z.number().min(0).optional(),
  status: z.string().optional(),
  nome_cliente: z.string().optional(),
  telefone_cliente: z.string().optional(),
  previsao_entrega: z.string().optional(),
  vendedorId: z.string().cuid('Vendedor é obrigatório').optional(),
  valor_sinal: z.number().min(0).optional(),
  pago_total: z.boolean().optional(),
});

export async function index(req: Request, res: Response) {
  const lojaId = req.headers['x-loja-id'] as string;
  if (!lojaId) return res.status(400).json({ error: 'Loja não informada' });

  const encomendas = await prisma.encomenda.findMany({
    where: { lojaId },
    orderBy: { criado_em: 'desc' },
  });
  return res.json(encomendas);
}

export async function create(req: Request, res: Response) {
  const data = createSchema.parse(req.body);
  const lojaId = req.headers['x-loja-id'] as string;
  if (!lojaId) return res.status(400).json({ error: 'Loja não informada' });

  // Se não enviou valor_total mas enviou unitário, calcula
  let valor_total = data.valor_total;
  if (!valor_total && data.valor_unit && data.quantidade) {
    valor_total = data.quantidade * data.valor_unit;
  }

  const encomenda = await prisma.encomenda.create({
    data: {
      ...data,
      valor_total,
      previsao_entrega: data.previsao_entrega ? new Date(data.previsao_entrega) : undefined,
      lojaId,
    },
  });
  return res.status(201).json(encomenda);
}

export async function update(req: Request, res: Response) {
  const id = req.params.id as string;
  const data = updateSchema.parse(req.body);
  const lojaId = req.headers['x-loja-id'] as string;

  const current = await prisma.encomenda.findUnique({ where: { id } });
  if (!current || current.lojaId !== lojaId) return res.status(404).json({ error: 'Pedido não encontrado' });

  // Recalcula total se quantidade ou valor unitário mudou
  let valor_total = data.valor_total ?? current.valor_total;
  const newQuant = data.quantidade ?? current.quantidade;
  const newUnit = data.valor_unit ?? current.valor_unit;

  if (data.valor_unit !== undefined || data.quantidade !== undefined) {
    if (newUnit && newQuant) {
      valor_total = newQuant * newUnit;
    }
  }

  const encomenda = await prisma.encomenda.update({
    where: { id },
    data: {
      ...data,
      valor_total,
      previsao_entrega: data.previsao_entrega ? new Date(data.previsao_entrega) : undefined,
    },
  });

  return res.json(encomenda);
}

export async function remove(req: Request, res: Response) {
  const id = req.params.id as string;
  const lojaId = req.headers['x-loja-id'] as string;

  const current = await prisma.encomenda.findUnique({ where: { id } });
  if (!current || current.lojaId !== lojaId) return res.status(404).json({ error: 'Pedido não encontrado' });

  await prisma.encomenda.delete({ where: { id } });
  return res.status(204).send();
}
