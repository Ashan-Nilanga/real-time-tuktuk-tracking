import express from 'express';
import { ping, getLive, getHistory } from '../controllers/location.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { scopeToProvince, scopeToDistrict } from '../middleware/scopeFilter.js';
import { validate } from '../middleware/validate.js';
import { locationPingSchema } from '../utils/validators.js';

const router = express.Router();

router.post('/ping',
  authenticate,
  authorize(['DEVICE']),
  validate(locationPingSchema),
  ping
);

router.get('/live',
  authenticate,
  authorize(['SUPER_ADMIN', 'PROVINCIAL_ADMIN', 'STATION_OFFICER']),
  scopeToProvince,
  scopeToDistrict,
  getLive
);

router.get('/history',
  authenticate,
  authorize(['SUPER_ADMIN', 'PROVINCIAL_ADMIN', 'STATION_OFFICER']),
  scopeToProvince,
  scopeToDistrict,
  getHistory
);

export default router;