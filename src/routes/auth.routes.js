import express from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../utils/validators.js';

const router = express.Router();

router.post('/register',
  authenticate,
  authorize(['SUPER_ADMIN']),
  validate(registerSchema),
  register
);

router.post('/login',
  validate(loginSchema),
  login
);

router.get('/me',
  authenticate,
  getMe
);

export default router;