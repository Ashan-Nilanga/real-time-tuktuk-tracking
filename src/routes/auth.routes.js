import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = (await pool.query(
    'SELECT * FROM users WHERE username=$1',
    [username]
  )).rows[0];

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).send("Invalid");

const token = jwt.sign(
  {
    id: user.id,
    role: user.role,
    provinceId: user.province_id,   // optional but useful
    districtId: user.station_id     // optional
  },
  process.env.JWT_SECRET
);

  res.json({ token });
});

export default router;