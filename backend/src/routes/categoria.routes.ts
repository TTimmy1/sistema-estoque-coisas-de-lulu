import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as controller from '../controllers/categoriaController';

const router = Router();

router.use(authMiddleware);

router.get('/', controller.index);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
