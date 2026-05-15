import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const createSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  sku: z.string().optional().transform(v => v === "" ? undefined : v),
  categoriaId: z.string().cuid().optional().nullable(),
  custo: z.coerce.number().positive('Custo deve ser positivo'),
  preco_venda: z.coerce.number().positive('Preço de venda deve ser positivo'),
  codigo_barras: z.string().optional().nullable(),
  qtd_estoque: z.coerce.number().int().nonnegative().default(0),
  estoque_minimo: z.coerce.number().int().nonnegative().default(5),
});

const updateSchema = z.object({
  nome: z.string().min(1).optional(),
  sku: z.string().optional().transform(v => v === "" ? undefined : v),
  categoriaId: z.string().cuid().optional().nullable(),
  custo: z.coerce.number().positive().optional(),
  preco_venda: z.coerce.number().positive().optional(),
  codigo_barras: z.string().optional().nullable(),
  estoque_minimo: z.coerce.number().int().nonnegative().optional(),
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
  const sku = data.sku || gerarSku(data.nome);
  const lojaOrigemId = req.headers['x-loja-id'] as string;

  if (!lojaOrigemId) {
    return res.status(400).json({ error: 'Loja não informada (x-loja-id ausente)' });
  }

  // 1. Buscar todas as lojas cadastradas
  const lojas = await prisma.loja.findMany();

  // 2. Criar em todas as lojas
  const resultados = await Promise.all(
    lojas.map(async (loja) => {
      // Verificar se já existe esse SKU nessa loja específica
      const existente = await prisma.produto.findUnique({
        where: {
          sku_lojaId: {
            sku,
            lojaId: loja.id,
          },
        },
      });

      if (existente) {
        // Se já existe na loja ativa, retorna ele. Nas outras lojas, ignora.
        return existente;
      }

      return prisma.produto.create({
        data: {
          nome: data.nome,
          sku,
          categoriaId: data.categoriaId,
          custo: data.custo,
          preco_venda: data.preco_venda,
          codigo_barras: data.codigo_barras,
          qtd_estoque: loja.id === lojaOrigemId ? data.qtd_estoque : 0,
          estoque_minimo: data.estoque_minimo,
          lojaId: loja.id,
        },
      });
    })
  );

  // Retornar o produto da loja que solicitou o cadastro
  const produtoPrincipal = resultados.find((p) => p.lojaId === lojaOrigemId);

  return res.status(201).json(produtoPrincipal);
}

export async function update(req: Request, res: Response) {
  const id = req.params.id as string;
  const data = updateSchema.parse(req.body);
  const lojaId = req.headers['x-loja-id'] as string;

  const produto = await prisma.produto.findUnique({ where: { id } });
  if (!produto || produto.lojaId !== lojaId) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  // Se o usuário estiver editando dados básicos (nome, preço, categoria),
  // talvez ele queira atualizar em todas as unidades?
  // O usuário não pediu isso explicitamente, mas é uma boa prática.
  // Por enquanto, vou atualizar apenas na unidade atual para evitar efeitos colaterais.

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

  await prisma.$transaction([
    prisma.movimentacao.deleteMany({ where: { produtoId: id } }),
    prisma.encomenda.updateMany({ where: { produtoId: id }, data: { produtoId: null } }),
    prisma.produto.delete({ where: { id } }),
  ]);

  return res.status(204).send();
}
