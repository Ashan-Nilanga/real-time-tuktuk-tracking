import express from 'express';
import { pool } from '../config/db.js';
import { redis } from '../config/redis.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

// Device sends location
router.post('/',  async (req, res) => {
  const { deviceId, latitude, longitude, timestamp } = req.body;

  const vehicle = await pool.query(
    'SELECT * FROM vehicles WHERE device_id=$1',
    [deviceId]
  );

  if (!vehicle.rows.length) return res.sendStatus(404);

  const vehicleId = vehicle.rows[0].id;

  // Save DB
  await pool.query(
    `INSERT INTO locations(vehicle_id, latitude, longitude, timestamp)
     VALUES ($1,$2,$3,$4)`,
    [vehicleId, latitude, longitude, timestamp]
  );

  // Cache latest in Redis
  await redis.set(
    `vehicle:${vehicleId}`,
    JSON.stringify({ latitude, longitude, timestamp })
  );

  res.send("OK");
});

// Get latest (FAST via Redis)
router.get('/:id/latest', authenticate, async (req, res) => {
  const cached = await redis.get(`vehicle:${req.params.id}`);

  if (cached) return res.json(JSON.parse(cached));

  const db = await pool.query(
    `SELECT l.*, v.plate_number, v.device_id
    FROM locations l
    INNER JOIN vehicles v 
    ON l.vehicle_id = v.id 
     WHERE l.vehicle_id=$1 
     ORDER BY l.timestamp DESC LIMIT 1`,
    [req.params.id]
  );

  res.json(db.rows[0]);
});

// History
router.get('/:id/history', authenticate, async (req, res) => {
  const { from, to } = req.query;

  const result = await pool.query(
    `SELECT l.*, v.plate_number, v.device_id
    FROM locations l
    INNER JOIN vehicles v 
    ON l.vehicle_id = v.id
     WHERE l.vehicle_id=$1 
     AND l.timestamp BETWEEN $2 AND $3`,
    [req.params.id, from, to]
  );
  res.json(result.rows);
});

router.get('/', authenticate, authorize(['ADMIN', 'PROVINCIAL', 'STATION']), async (req, res) => {
  const { districtId, provinceId } = req.query;

  try {
    let query = `
      SELECT l.*, v.plate_number, d.id as district_id, p.id as province_id
      FROM locations l
      JOIN vehicles v ON l.vehicle_id = v.id
      JOIN districts d ON v.district_id = d.id
      JOIN provinces p ON d.province_id = p.id
    `;

    let conditions = [];
    let values = [];

    if (districtId) {
      values.push(districtId);
      conditions.push(`d.id = $${values.length}`);
    }

    if (provinceId) {
      values.push(provinceId);
      conditions.push(`p.id = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY l.timestamp DESC LIMIT 100";

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

export default router;