import express from 'express';
import { pool } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.post('/', authenticate, authorize(['ADMIN']), async (req, res) => {
  const { id, plateNumber, deviceId, districtId } = req.body;

  await pool.query(
    `INSERT INTO vehicles VALUES ($1,$2,$3,$4)`,
    [id, plateNumber, deviceId, districtId]
  );

  res.send("Vehicle added");
});

router.get('/', authenticate,
  authorize(['ADMIN', 'PROVINCIAL']), async (req, res) => {
  const data = await pool.query('SELECT * FROM vehicles');
  res.json(data.rows);
});

export default router;