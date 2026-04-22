import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export async function index(req: Request, res: Response) {
  const lojas = await prisma.loja.findMany({
    orderBy: { nome: 'asc' },
  });
  return res.json(lojas);
}
