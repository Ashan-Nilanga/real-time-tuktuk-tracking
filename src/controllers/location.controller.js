import { pool } from '../config/db.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

export const ping = async (req, res, next) => {
  try {
    const { deviceId, latitude, longitude, timestamp, speed, accuracy } = req.body;

    // Look up vehicle by deviceId
    const vehicle = await pool.query(
      'SELECT id, province_id, district_id FROM tuktuk.vehicles WHERE device_id = $1',
      [deviceId]
    );

    if (!vehicle.rows.length) {
      return sendError(res, 'Vehicle not found for this device.', 404);
    }

    const v = vehicle.rows[0];

    // DEVICE users can only ping for their own assigned vehicle
    if (req.user.role === 'DEVICE' && req.user.assignedVehicleId !== v.id) {
      return sendError(res, 'You can only post pings for your own assigned vehicle.', 403);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert location ping
      await client.query(
        `INSERT INTO tuktuk.location_pings (vehicle_id, latitude, longitude, speed, accuracy, province_id, district_id, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [v.id, latitude, longitude, speed || null, accuracy || null, v.province_id, v.district_id, timestamp || new Date()]
      );

      // Atomically update vehicle's last known location
      await client.query(
        `UPDATE tuktuk.vehicles
         SET last_latitude = $1, last_longitude = $2, last_speed = $3, last_ping_at = $4
         WHERE id = $5`,
        [latitude, longitude, speed || null, timestamp || new Date(), v.id]
      );

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    sendSuccess(res, { vehicleId: v.id, latitude, longitude, timestamp: timestamp || new Date() }, 'Location ping recorded.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * All vehicles' last known locations.
 */
export const getLive = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { province, district } = req.query;

    let query = `
      SELECT v.id, v.registration_number, v.driver_name, v.device_id, v.status,
             v.last_latitude, v.last_longitude, v.last_speed, v.last_ping_at,
             p.name as province_name, d.name as district_name
      FROM tuktuk.vehicles v
      JOIN tuktuk.provinces p ON v.province_id = p.id
      JOIN tuktuk.districts d ON v.district_id = d.id
      WHERE v.last_latitude IS NOT NULL
    `;
    let countQuery = `
      SELECT COUNT(*) FROM tuktuk.vehicles v
      JOIN tuktuk.provinces p ON v.province_id = p.id
      JOIN tuktuk.districts d ON v.district_id = d.id
      WHERE v.last_latitude IS NOT NULL
    `;
    const values = [];

    if (province) {
      values.push(province);
      const cond = ` AND LOWER(p.name) = LOWER($${values.length})`;
      query += cond;
      countQuery += cond;
    }
    if (district) {
      values.push(district);
      const cond = ` AND LOWER(d.name) = LOWER($${values.length})`;
      query += cond;
      countQuery += cond;
    }
    if (req.scopeProvinceId) {
      values.push(req.scopeProvinceId);
      const cond = ` AND v.province_id = $${values.length}`;
      query += cond;
      countQuery += cond;
    }
    if (req.scopeDistrictId) {
      values.push(req.scopeDistrictId);
      const cond = ` AND v.district_id = $${values.length}`;
      query += cond;
      countQuery += cond;
    }

    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY v.last_ping_at DESC NULLS LAST LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    sendPaginated(res, result.rows, total, page, limit, 'Live locations retrieved.');
  } catch (err) {
    next(err);
  }
};


export const getHistory = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { vehicleId, from, to, province, district } = req.query;

    let query = `
      SELECT lp.id, lp.vehicle_id, lp.latitude, lp.longitude, lp.speed, lp.accuracy, lp.timestamp,
             v.registration_number, v.driver_name,
             p.name as province_name, d.name as district_name
      FROM tuktuk.location_pings lp
      JOIN tuktuk.vehicles v ON lp.vehicle_id = v.id
      JOIN tuktuk.provinces p ON lp.province_id = p.id
      JOIN tuktuk.districts d ON lp.district_id = d.id
    `;
    let countQuery = `
      SELECT COUNT(*) FROM tuktuk.location_pings lp
      JOIN tuktuk.vehicles v ON lp.vehicle_id = v.id
      JOIN tuktuk.provinces p ON lp.province_id = p.id
      JOIN tuktuk.districts d ON lp.district_id = d.id
    `;
    const conditions = [];
    const values = [];

    if (vehicleId) { values.push(vehicleId); conditions.push(`lp.vehicle_id = $${values.length}`); }
    if (from) { values.push(from); conditions.push(`lp.timestamp >= $${values.length}`); }
    if (to) { values.push(to); conditions.push(`lp.timestamp <= $${values.length}`); }
    if (province) { values.push(province); conditions.push(`LOWER(p.name) = LOWER($${values.length})`); }
    if (district) { values.push(district); conditions.push(`LOWER(d.name) = LOWER($${values.length})`); }
    if (req.scopeProvinceId) { values.push(req.scopeProvinceId); conditions.push(`lp.province_id = $${values.length}`); }
    if (req.scopeDistrictId) { values.push(req.scopeDistrictId); conditions.push(`lp.district_id = $${values.length}`); }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      query += where;
      countQuery += where;
    }

    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY lp.timestamp DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    sendPaginated(res, result.rows, total, page, limit, 'Location history retrieved.');
  } catch (err) {
    next(err);
  }
};
