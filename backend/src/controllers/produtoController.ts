import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const createSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  sku: z.string().min(1, 'SKU é obrigatório').optional(),
  categoriaId: z.string().cuid().optional().nullable(),
  custo: z.coerce.number().positive('Custo deve ser positivo'),
  preco_venda: z.coerce.number().positive('Preço de venda deve ser positivo'),
  codigo_barras: z.string().optional().nullable(),
  qtd_estoque: z.coerce.number().int().nonnegative().default(0),
});

const updateSchema = z.object({
  nome: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  categoriaId: z.string().cuid().optional().nullable(),
  custo: z.coerce.number().positive().optional(),
  preco_venda: z.coerce.number().positive().optional(),
  codigo_barras: z.string().optional().nullable(),
});

export async function index(req: Request, res: Response) {
  const { busca, categoriaId } = req.query;
  const lojaId = req.headers['x-loja-id'] as string;

  if (!lojaId) {
    return res.status(400).json({ error: 'Loja não informada (x-loja-id ausente)' });
  }

  const where: Record<string, unknown> = {
    lojaId,
  };
  if (busca) {
    where.OR = [
      { nome: { contains: String(busca), mode: 'insensitive' } },
      { sku: { contains: String(busca), mode: 'insensitive' } },
      { codigo_barras: { contains: String(busca), mode: 'insensitive' } },
    ];
  }
  if (categoriaId) {
    where.categoriaId = categoriaId as string;
  }

  const produtos = await prisma.produto.findMany({
    where,
    include: { categoria: true },
    orderBy: { criado_em: 'desc' },
  });

  return res.json(produtos);
}

export async function show(req: Request, res: Response) {
  const id = req.params.id as string;
  const lojaId = req.headers['x-loja-id'] as string;

  const produto = await prisma.produto.findUnique({
    where: { id },
    include: {
      categoria: true,
      movimentacoes: {
        take: 10,
        orderBy: { criado_em: 'desc' },
        include: { usuario: { select: { id: true, nome: true, email: true } } },
      },
    },
  });

  if (!produto || produto.lojaId !== lojaId) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  return res.json(produto);
}

function gerarSku(nome: string): string {
  const prefixo = nome
    .substring(0, 3)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '');
  const timestamp = Date.now().toString().slice(-5);
  return `PRD-${prefixo}${timestamp}`;
}

export async function create(req: Request, res: Response) {
  const data = createSchema.parse(req.body);
  const sku = gerarSku(data.nome);
  const lojaId = req.headers['x-loja-id'] as string;

  if (!lojaId) {
    return res.status(400).json({ error: 'Loja não informada (x-loja-id ausente)' });
  }

  const produto = await prisma.produto.create({
    data: {
      nome: data.nome,
      sku,
      categoriaId: data.categoriaId,
      custo: data.custo,
      preco_venda: data.preco_venda,
      codigo_barras: data.codigo_barras,
      qtd_estoque: data.qtd_estoque,
      lojaId,
    },
    include: { categoria: true },
  });

  return res.status(201).json(produto);
}

export async function update(req: Request, res: Response) {
  const id = req.params.id as string;
  const data = updateSchema.parse(req.body);
  const lojaId = req.headers['x-loja-id'] as string;

  const produto = await prisma.produto.findUnique({ where: { id } });
  if (!produto || produto.lojaId !== lojaId) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  const atualizado = await prisma.produto.update({
    where: { id },
    data,
    include: { categoria: true },
  });

  return res.json(atualizado);
}

export async function remove(req: Request, res: Response) {
  const id = req.params.id as string;
  const lojaId = req.headers['x-loja-id'] as string;

  const produto = await prisma.produto.findUnique({ where: { id } });
  if (!produto || produto.lojaId !== lojaId) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  /* Removido o bloqueio por estoque para atender a solicitação de apagar quando quiser */
  /* if (produto.qtd_estoque > 0) {
    return res.status(400).json({ error: 'Não é possível excluir produto com estoque positivo' });
  } */

  // Para evitar erro de chave estrangeira, tratamos os registros vinculados
  await prisma.$transaction([
    // Deletamos as movimentações vinculadas (histórico de estoque do produto)
    prisma.movimentacao.deleteMany({ where: { produtoId: id } }),
    // Desvinculamos o produto de encomendas (mantendo o registro da encomenda)
    prisma.encomenda.updateMany({ where: { produtoId: id }, data: { produtoId: null } }),
    // Finalmente deletamos o produto
    prisma.produto.delete({ where: { id } }),
  ]);

  return res.status(204).send();
}
