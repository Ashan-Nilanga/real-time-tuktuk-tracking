import express from 'express';
import { getAllStations, createStation, getStationById } from '../controllers/station.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { scopeToProvince, scopeToDistrict } from '../middleware/scopeFilter.js';
import { validate } from '../middleware/validate.js';
import { createStationSchema } from '../utils/validators.js';

const router = express.Router();

router.get('/',
  authenticate,
  scopeToProvince,
  scopeToDistrict,
  getAllStations
);

router.post('/',
  authenticate,
  authorize(['SUPER_ADMIN']),
  validate(createStationSchema),
  createStation
);

router.get('/:id', authenticate, getStationById);

export default router;
