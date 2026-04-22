import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const createSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
});

export async function index(_req: Request, res: Response) {
  const categorias = await prisma.categoria.findMany({
    orderBy: { nome: 'asc' },
    include: { _count: { select: { produtos: true } } },
  });
  return res.json(categorias);
}

export async function create(req: Request, res: Response) {
  const data = createSchema.parse(req.body);

  const existe = await prisma.categoria.findUnique({ where: { nome: data.nome } });
  if (existe) {
    return res.status(400).json({ error: 'Categoria já existe' });
  }

  const categoria = await prisma.categoria.create({ data });
  return res.status(201).json(categoria);
}

export async function update(req: Request, res: Response) {
  const { id } = req.params;
  const data = createSchema.parse(req.body);

  const existe = await prisma.categoria.findUnique({ where: { nome: data.nome } });
  if (existe && existe.id !== id) {
    return res.status(400).json({ error: 'Categoria já existe' });
  }

  const categoria = await prisma.categoria.update({
    where: { id },
    data,
  });
  return res.json(categoria);
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.categoria.delete({ where: { id } });
  return res.status(204).send();
}
