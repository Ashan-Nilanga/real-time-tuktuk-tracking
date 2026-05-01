import express from 'express';
import { getAllProvinces, getDistrictsByProvince } from '../controllers/province.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllProvinces);

router.get('/:id/districts', authenticate, getDistrictsByProvince);

export default router;
