import express from 'express';
import { getAllDistricts } from '../controllers/district.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllDistricts);

export default router;
