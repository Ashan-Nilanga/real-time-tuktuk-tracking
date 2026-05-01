import express from 'express';
import {
  getAllVehicles, createVehicle, getVehicleById,
  updateVehicle, deleteVehicle, getVehicleLocation, getVehicleHistory
} from '../controllers/vehicle.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { scopeToProvince, scopeToDistrict } from '../middleware/scopeFilter.js';
import { validate } from '../middleware/validate.js';
import { createVehicleSchema, updateVehicleSchema } from '../utils/validators.js';

const router = express.Router();

router.get('/',
  authenticate,
  authorize(['SUPER_ADMIN', 'PROVINCIAL_ADMIN', 'STATION_OFFICER']),
  scopeToProvince,
  scopeToDistrict,
  getAllVehicles
);

router.post('/',
  authenticate,
  authorize(['SUPER_ADMIN']),
  validate(createVehicleSchema),
  createVehicle
);

router.get('/:id',
  authenticate,
  authorize(['SUPER_ADMIN', 'PROVINCIAL_ADMIN', 'STATION_OFFICER']),
  getVehicleById
);

router.put('/:id',
  authenticate,
  authorize(['SUPER_ADMIN']),
  validate(updateVehicleSchema),
  updateVehicle
);

router.delete('/:id',
  authenticate,
  authorize(['SUPER_ADMIN']),
  deleteVehicle
);

router.get('/:id/location',
  authenticate,
  authorize(['SUPER_ADMIN', 'PROVINCIAL_ADMIN', 'STATION_OFFICER']),
  getVehicleLocation
);

router.get('/:id/history',
  authenticate,
  authorize(['SUPER_ADMIN', 'PROVINCIAL_ADMIN', 'STATION_OFFICER']),
  getVehicleHistory
);

export default router;