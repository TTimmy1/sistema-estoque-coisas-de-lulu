import { Router } from 'express';
import * as lojaController from '../controllers/lojaController';

const router = Router();

router.get('/', lojaController.index);

export { router as lojaRoutes };
