import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middlewares/error';

import authRoutes from './routes/auth.routes';
import produtoRoutes from './routes/produto.routes';
import movimentacaoRoutes from './routes/movimentacao.routes';
import categoriaRoutes from './routes/categoria.routes';
import vendedorRoutes from './routes/vendedor.routes';
import encomendaRoutes from './routes/encomenda.routes';
import { lojaRoutes } from './routes/loja.routes';

const app = express();
const PORT = process.env.PORT ?? 3333;

// ─── Middlewares ────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ─── Health Check ───────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ─────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/movimentacoes', movimentacaoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/vendedores', vendedorRoutes);
app.use('/api/encomendas', encomendaRoutes);
app.use('/api/lojas', lojaRoutes);

// ─── Error Handler ──────────────────────────────────────

app.use(errorMiddleware);

// ─── Start ──────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
