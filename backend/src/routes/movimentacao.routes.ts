import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as controller from '../controllers/movimentacaoController';

const router = Router();

router.use(authMiddleware);

router.post('/entrada', controller.registrarEntrada);
router.post('/saida', controller.registrarSaida);
router.post('/venda-lote', controller.registrarVendaLote);
router.get('/', controller.index);
router.get('/dashboard', controller.dashboard);
router.get('/:id', controller.show);

export default router;
