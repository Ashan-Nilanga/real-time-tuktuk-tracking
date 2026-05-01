import express from 'express';
import { getOverview, getProvinceStats } from '../controllers/stats.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.get('/overview',
  authenticate,
  authorize(['SUPER_ADMIN', 'PROVINCIAL_ADMIN']),
  getOverview
);

router.get('/province/:id',
  authenticate,
  authorize(['SUPER_ADMIN', 'PROVINCIAL_ADMIN']),
  getProvinceStats
);

export default router;
