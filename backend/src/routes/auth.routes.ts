import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Rotas protegidas (apenas ADM)
router.get('/pendentes', authMiddleware, authController.listarPendentes);
router.patch('/gerenciar/:id', authMiddleware, authController.gerenciarConta);

export default router;
