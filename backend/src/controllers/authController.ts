import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
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

  const usuario = await prisma.usuario.create({
    data: {
      nome: data.nome,
      email: data.email,
      senha: senhaHash,
    },
    select: { id: true, nome: true, email: true, criado_em: true },
  });

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email },
    process.env.JWT_SECRET as string,
    { expiresIn: '8h' }
  );

  return res.status(201).json({ usuario, token });
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

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email },
    process.env.JWT_SECRET as string,
    { expiresIn: '8h' }
  );

  return res.json({
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    },
    token,
  });
}

export async function me(req: Request, res: Response) {
  return res.json({ usuario: req.params });
}
