import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      detalhes: err.errors.map((e) => ({
        campo: e.path.join('.'),
        mensagem: e.message,
      })),
    });
  }

  console.error(err);

  // Erros de transação do Prisma
  if (err.message.includes('Estoque insuficiente') || err.message.includes('Produto não encontrado')) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Erro interno do servidor' });
}
