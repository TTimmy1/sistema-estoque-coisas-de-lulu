import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';
import { TipoMovimentacao } from '../utils/enums';

// ─── Schemas ─────────────────────────────────────────────

const entradaSchema = z.object({
  produtoId: z.string().cuid('ID do produto inválido'),
  quantidade: z.coerce.number().int().positive('Quantidade deve ser maior que zero'),
  custo: z.coerce.number().positive('Custo deve ser positivo').optional(),
  observacao: z.string().optional(),
});

const saidaSchema = z.object({
  produtoId: z.string().cuid('ID do produto inválido'),
  quantidade: z.coerce.number().int().positive('Quantidade deve ser maior que zero'),
  tipo: z.enum(['SAIDA_VENDA', 'SAIDA_DESCARTE']),
  desconto: z.coerce.number().min(0, 'Desconto não pode ser negativo').optional().default(0),
  observacao: z.string().optional(),
  telefone_cliente: z.string().optional(),
  vendedorId: z.string().cuid('Vendedor é obrigatório').optional(),
});

const vendaLoteSchema = z.object({
  vendedorId: z.string().cuid('Vendedor é obrigatório').optional(),
  telefone_cliente: z.string().optional(),
  observacao: z.string().optional(),
  descontoTotal: z.coerce.number().min(0).optional().default(0),
  itens: z.array(z.object({
    produtoId: z.string().cuid(),
    quantidade: z.number().int().positive(),
  })).min(1, 'Adicione pelo menos um item'),
});

// ─── Registrar Entrada ───────────────────────────────────
// Soma ao estoque, registra custo do lote, timestamp automático.

export async function registrarEntrada(req: AuthRequest, res: Response) {
  const usuario = req.usuario!;
  const data = entradaSchema.parse(req.body);
  const lojaId = req.headers['x-loja-id'] as string;

  if (!lojaId) {
    return res.status(400).json({ error: 'Loja não informada (x-loja-id ausente)' });
  }

  await prisma.$transaction(async (tx) => {
    // Buscar produto para validar e pegar dados atuais
    const produto = await tx.produto.findUnique({ where: { id: data.produtoId } });

    if (!produto || produto.lojaId !== lojaId) {
      throw new Error('Produto não encontrado nesta loja');
    }

    // Usa custo informado ou o custo atual do produto
    const custoLote = data.custo ?? Number(produto.custo);

    // Criar movimentação de ENTRADA
    await tx.movimentacao.create({
      data: {
        usuarioId: usuario.id,
        produtoId: data.produtoId,
        tipo: TipoMovimentacao.ENTRADA,
        quantidade: data.quantidade,
        valor_unit: custoLote,
        valor_total: custoLote * data.quantidade,
        observacao: data.observacao,
        lojaId,
      },
    });

    // Atualizar estoque e custo do produto
    await tx.produto.update({
      where: { id: data.produtoId },
      data: {
        qtd_estoque: produto.qtd_estoque + data.quantidade,
        custo: custoLote,
      },
    });
  });

  return res.status(201).json({
    message: 'Entrada registrada com sucesso',
    produtoId: data.produtoId,
    quantidade: data.quantidade,
  });
}

// ─── Registrar Saída ─────────────────────────────────────
// Subtrai do estoque, CONGELA o preço de venda do momento.

export async function registrarSaida(req: AuthRequest, res: Response) {
  const usuario = req.usuario!;
  const data = saidaSchema.parse(req.body);
  const lojaId = req.headers['x-loja-id'] as string;

  if (!lojaId) {
    return res.status(400).json({ error: 'Loja não informada (x-loja-id ausente)' });
  }

  await prisma.$transaction(async (tx) => {
    const produto = await tx.produto.findUnique({ where: { id: data.produtoId } });

    if (!produto || produto.lojaId !== lojaId) {
      throw new Error('Produto não encontrado nesta loja');
    }

    if (data.quantidade > produto.qtd_estoque) {
      throw new Error(
        `Estoque insuficiente. Disponível: ${produto.qtd_estoque}, Solicitado: ${data.quantidade}`
      );
    }

    const descontoNum = data.desconto ?? 0;
    const valorUnitario =
      data.tipo === TipoMovimentacao.SAIDA_VENDA
        ? Number(produto.preco_venda)
        : Number(produto.custo);

    const valorBruto = valorUnitario * data.quantidade;
    const valorLiquido = Math.max(0, valorBruto - descontoNum);

    // Criar movimentação de SAÍDA com preço congelado
    await tx.movimentacao.create({
      data: {
        usuarioId: usuario.id,
        produtoId: data.produtoId,
        tipo: data.tipo,
        quantidade: data.quantidade,
        valor_unit: valorUnitario,
        valor_total: valorLiquido,
        desconto: descontoNum,
        observacao: data.observacao,
        telefone_cliente: data.telefone_cliente,
        vendedorId: data.vendedorId || null,
        lojaId,
      },
    });

    // Atualizar estoque
    await tx.produto.update({
      where: { id: data.produtoId },
      data: {
        qtd_estoque: produto.qtd_estoque - data.quantidade,
      },
    });
  });

  return res.status(201).json({
    message: 'Saída registrada com sucesso',
    produtoId: data.produtoId,
    quantidade: data.quantidade,
    tipo: data.tipo,
  });
}

export async function registrarVendaLote(req: AuthRequest, res: Response) {
  const usuario = req.usuario!;
  const data = vendaLoteSchema.parse(req.body);
  const lojaId = req.headers['x-loja-id'] as string;

  if (!lojaId) {
    return res.status(400).json({ error: 'Loja não informada (x-loja-id ausente)' });
  }

  await prisma.$transaction(async (tx) => {
    // 1. Buscar todos os produtos e validar estoque
    const ids = data.itens.map(i => i.produtoId);
    const produtos = await tx.produto.findMany({
      where: { id: { in: ids }, lojaId }
    });

    if (produtos.length !== ids.length) {
      throw new Error('Um ou mais produtos não foram encontrados nesta loja');
    }

    // Calcula bruto total para rateio do desconto
    let totalBrutoVenda = 0;
    const itensProcessados = data.itens.map(item => {
      const p = produtos.find(p => p.id === item.produtoId)!;
      if (item.quantidade > p.qtd_estoque) {
        throw new Error(`Estoque insuficiente para ${p.nome}. Disponível: ${p.qtd_estoque}`);
      }
      const valorUnitario = Number(p.preco_venda);
      const brutoItem = valorUnitario * item.quantidade;
      totalBrutoVenda += brutoItem;
      return { ...item, p, valorUnitario, brutoItem };
    });

    const descontoTotal = data.descontoTotal || 0;

    // 2. Registrar cada movimentação e atualizar estoque
    for (const item of itensProcessados) {
      // Rateio do desconto proporcional
      const proporcao = totalBrutoVenda > 0 ? item.brutoItem / totalBrutoVenda : 0;
      const descontoItem = proporcao * descontoTotal;
      const valorFinalItem = Math.max(0, item.brutoItem - descontoItem);

      await tx.movimentacao.create({
        data: {
          usuarioId: usuario.id,
          produtoId: item.produtoId,
          tipo: TipoMovimentacao.SAIDA_VENDA,
          quantidade: item.quantidade,
          valor_unit: item.valorUnitario,
          valor_total: valorFinalItem,
          desconto: descontoItem,
          observacao: data.observacao,
          telefone_cliente: data.telefone_cliente,
          vendedorId: data.vendedorId || null,
          lojaId,
        },
      });

      await tx.produto.update({
        where: { id: item.produtoId },
        data: { qtd_estoque: item.p.qtd_estoque - item.quantidade },
      });
    }
  });

  return res.status(201).json({ message: 'Venda em lote registrada com sucesso' });
}

// ─── Listar Movimentações ────────────────────────────────

export async function index(req: Request, res: Response) {
  const {
    produtoId,
    usuarioId,
    tipo,
    dataInicio,
    dataFim,
    pagina = '1',
    limite = '20',
  } = req.query;

  const lojaId = req.headers['x-loja-id'] as string;

  if (!lojaId) {
    return res.status(400).json({ error: 'Loja não informada' });
  }

  const where: Record<string, unknown> = { lojaId };

  if (produtoId) where.produtoId = produtoId as string;
  if (usuarioId) where.usuarioId = usuarioId as string;
  if (tipo) where.tipo = tipo as string;
  if (dataInicio || dataFim) {
    where.criado_em = {};
    if (dataInicio) {
      (where.criado_em as Record<string, unknown>).gte = new Date(dataInicio as string);
    }
    if (dataFim) {
      (where.criado_em as Record<string, unknown>).lte = new Date(dataFim as string);
    }
  }

  const page = parseInt(pagina as string, 10);
  const limit = parseInt(limite as string, 10);
  const skip = (page - 1) * limit;

  const [movimentacoes, total] = await Promise.all([
    prisma.movimentacao.findMany({
      where,
      include: {
        produto: { select: { id: true, nome: true, sku: true } },
        usuario: { select: { id: true, nome: true, email: true } },
        vendedor: { select: { id: true, nome: true } },
      },
      orderBy: { criado_em: 'desc' },
      skip,
      take: limit,
    }),
    prisma.movimentacao.count({ where }),
  ]);

  return res.json({
    movimentacoes,
    paginacao: {
      pagina: page,
      limite: limit,
      total,
      totalPaginas: Math.ceil(total / limit),
    },
  });
}

// ─── Detalhes de uma Movimentação ────────────────────────

export async function show(req: Request, res: Response) {
  const { id } = req.params;

  const lojaId = req.headers['x-loja-id'] as string;

  const movimentacao = await prisma.movimentacao.findUnique({
    where: { id },
    include: {
      produto: { select: { id: true, nome: true, sku: true } },
      usuario: { select: { id: true, nome: true, email: true } },
      vendedor: { select: { id: true, nome: true } },
    },
  });

  if (!movimentacao || movimentacao.lojaId !== lojaId) {
    return res.status(404).json({ error: 'Movimentação não encontrada' });
  }

  return res.json(movimentacao);
}

// ─── Dashboard - Resumo ─────────────────────────────────

export async function dashboard(req: AuthRequest, res: Response) {
  const lojaId = req.headers['x-loja-id'] as string;

  if (!lojaId) {
    return res.status(400).json({ error: 'Loja não informada' });
  }

  // Totais gerais
  const totalProdutos = await prisma.produto.count({ where: { lojaId } });
  const valorEstoque = await prisma.produto.aggregate({
    _sum: { custo: true },
    where: { lojaId },
  });

  const movimentacoesHoje = await prisma.movimentacao.count({
    where: {
      lojaId,
      criado_em: { gte: new Date(new Date().toDateString()) },
    },
  });

  const entradasMes = await prisma.movimentacao.count({
    where: {
      lojaId,
      tipo: TipoMovimentacao.ENTRADA,
      criado_em: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    },
  });

  const saidasMes = await prisma.movimentacao.count({
    where: {
      lojaId,
      tipo: { in: [TipoMovimentacao.SAIDA_VENDA, TipoMovimentacao.SAIDA_DESCARTE] },
      criado_em: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    },
  });

  const { vendedorId } = req.query;
  const usuario = req.usuario!;

  let baseWhereVendas: any = {
    lojaId,
    tipo: TipoMovimentacao.SAIDA_VENDA,
  };

  if (usuario.role !== 'ADMIN') {
    const myVendedor = await prisma.vendedor.findFirst({
      where: { nome: usuario.nome }
    });
    if (myVendedor) {
      baseWhereVendas.vendedorId = myVendedor.id;
    } else {
      baseWhereVendas.usuarioId = usuario.id;
    }
  } else if (vendedorId) {
    baseWhereVendas.vendedorId = vendedorId as string;
  }

  // Receita do mês
  const receitaMes = await prisma.movimentacao.aggregate({
    _sum: { valor_total: true },
    where: {
      ...baseWhereVendas,
      criado_em: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    },
  });

  // Vendas hoje
  const vendasDiaAgg = await prisma.movimentacao.aggregate({
    _sum: { valor_total: true },
    where: {
      ...baseWhereVendas,
      criado_em: { gte: new Date(new Date().toDateString()) },
    },
  });

  // Vendas da semana (segunda a hoje)
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=domingo
  const diff = diaSemana === 0 ? 6 : diaSemana - 1; // quantos dias voltar para segunda-feira
  const inicioSemana = new Date();
  inicioSemana.setDate(hoje.getDate() - diff);
  inicioSemana.setHours(0, 0, 0, 0);
  const vendasSemanaAgg = await prisma.movimentacao.aggregate({
    _sum: { valor_total: true },
    where: {
      ...baseWhereVendas,
      criado_em: { gte: inicioSemana },
    },
  });

  const itensEstoqueBaixo = await prisma.produto.findMany({
    where: { lojaId, qtd_estoque: { lte: 5 } },
    select: { id: true, nome: true, sku: true, qtd_estoque: true },
    orderBy: { qtd_estoque: 'asc' },
    take: 10,
  });

  const encomendasAtivasCount = await prisma.encomenda.count({
    where: {
      lojaId,
      status: { in: ['EM_ANDAMENTO', 'PENDENTE', 'EM PRODUCAO', 'PRONTO'] },
    },
  });

  const encomendasRecentes = await prisma.encomenda.findMany({
    where: {
      lojaId,
      status: { in: ['EM_ANDAMENTO', 'PENDENTE', 'EM PRODUCAO', 'PRONTO'] },
    },
    select: {
      id: true,
      pedido: true,
      nome_cliente: true,
      status: true,
      previsao_entrega: true,
      valor_total: true,
      valor_sinal: true,
      pago_total: true,
    },
    orderBy: { criado_em: 'desc' },
    take: 5,
  });

  return res.json({
    totalProdutos,
    valorTotalEstoque: valorEstoque._sum.custo ?? 0,
    movimentacoesHoje,
    entradasMes,
    saidasMes,
    receitaMes: receitaMes._sum.valor_total ?? 0,
    vendasDia: vendasDiaAgg._sum.valor_total ?? 0,
    vendasSemana: vendasSemanaAgg._sum.valor_total ?? 0,
    estoqueBaixo: itensEstoqueBaixo,
    encomendasAtivasCount,
    encomendasRecentes,
  });
}

