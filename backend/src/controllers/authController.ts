import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['ADMIN', 'USER']).optional().default('USER'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string(),
});

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existe = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (existe) {
    return res.status(400).json({ error: 'Email já cadastrado' });
  }

  const senhaHash = await bcrypt.hash(data.senha, 10);

  await prisma.usuario.create({
    data: {
      nome: data.nome,
      email: data.email,
      senha: senhaHash,
      role: data.role,
      status: 'PENDENTE',
    },
  });

  return res.status(201).json({
    message: 'Solicitação enviada! Aguarde a aprovação de um administrador para acessar o sistema.',
  });
}

export async function login(req: Request, res: Response) {
  const { email, senha } = loginSchema.parse(req.body);

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  if (usuario.status === 'PENDENTE') {
    return res.status(403).json({ error: 'Sua conta ainda está aguardando aprovação de um administrador.' });
  }

  if (usuario.status === 'REJEITADO') {
    return res.status(403).json({ error: 'Sua solicitação de acesso foi recusada. Entre em contato com um administrador.' });
  }

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '8h' }
  );

  return res.json({
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
    },
    token,
  });
}

export async function me(req: Request, res: Response) {
  return res.json({ usuario: req.params });
}

// ─── Admin: listar contas pendentes ──────────────────────

export async function listarPendentes(req: AuthRequest, res: Response) {
  const usuario = req.usuario as any;
  if (usuario?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const pendentes = await prisma.usuario.findMany({
    where: { status: 'PENDENTE' },
    select: { id: true, nome: true, email: true, role: true, criado_em: true },
    orderBy: { criado_em: 'asc' },
  });

  return res.json(pendentes);
}

// ─── Admin: aprovar ou rejeitar conta ────────────────────

export async function gerenciarConta(req: AuthRequest, res: Response) {
  const usuario = req.usuario as any;
  if (usuario?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { id } = req.params;
  const { acao } = req.body; // 'APROVAR' ou 'REJEITAR'

  if (!['APROVAR', 'REJEITAR'].includes(acao)) {
    return res.status(400).json({ error: 'Ação inválida. Use APROVAR ou REJEITAR.' });
  }

  const novoStatus = acao === 'APROVAR' ? 'ATIVO' : 'REJEITADO';

  const atualizado = await prisma.usuario.update({
    where: { id },
    data: { status: novoStatus },
    select: { id: true, nome: true, email: true, role: true, status: true },
  });

  return res.json(atualizado);
}
