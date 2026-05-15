import { Router } from 'express';
import * as transferenciaController from '../controllers/transferenciaController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', transferenciaController.transferir);

export default router;
