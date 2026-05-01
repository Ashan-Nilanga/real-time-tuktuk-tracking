import { pool } from '../config/db.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';


export const getAllVehicles = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { province, district, status } = req.query;

    let query = `
      SELECT v.id, v.registration_number, v.driver_name, v.device_id,
             v.province_id, v.district_id, v.status,
             v.last_latitude, v.last_longitude, v.last_speed, v.last_ping_at,
             v.registered_at, p.name as province_name, d.name as district_name
      FROM tuktuk.vehicles v
      JOIN tuktuk.provinces p ON v.province_id = p.id
      JOIN tuktuk.districts d ON v.district_id = d.id
    `;
    let countQuery = `
      SELECT COUNT(*) FROM tuktuk.vehicles v
      JOIN tuktuk.provinces p ON v.province_id = p.id
      JOIN tuktuk.districts d ON v.district_id = d.id
    `;
    const conditions = [];
    const values = [];

    if (province) { values.push(province); conditions.push(`LOWER(p.name) = LOWER($${values.length})`); }
    if (district) { values.push(district); conditions.push(`LOWER(d.name) = LOWER($${values.length})`); }
    if (status) { values.push(status.toLowerCase()); conditions.push(`v.status = $${values.length}`); }
    if (req.scopeProvinceId) { values.push(req.scopeProvinceId); conditions.push(`v.province_id = $${values.length}`); }
    if (req.scopeDistrictId) { values.push(req.scopeDistrictId); conditions.push(`v.district_id = $${values.length}`); }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      query += where;
      countQuery += where;
    }

    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY v.registration_number LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    sendPaginated(res, result.rows, total, page, limit, 'Vehicles retrieved successfully.');
  } catch (err) {
    next(err);
  }
};


export const createVehicle = async (req, res, next) => {
  try {
    const { registrationNumber, driverName, deviceId, provinceId, districtId, status } = req.body;
    const result = await pool.query(
      `INSERT INTO tuktuk.vehicles (registration_number, driver_name, device_id, province_id, district_id, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [registrationNumber, driverName, deviceId, provinceId, districtId, status || 'active']
    );
    sendSuccess(res, result.rows[0], 'Vehicle registered successfully.', 201);
  } catch (err) {
    next(err);
  }
};


export const getVehicleById = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT v.*, p.name as province_name, d.name as district_name
       FROM tuktuk.vehicles v
       JOIN tuktuk.provinces p ON v.province_id = p.id
       JOIN tuktuk.districts d ON v.district_id = d.id
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return sendError(res, 'Vehicle not found.', 404);
    sendSuccess(res, result.rows[0], 'Vehicle retrieved successfully.');
  } catch (err) {
    next(err);
  }
};


export const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { registrationNumber, driverName, deviceId, provinceId, districtId, status } = req.body;

    const existing = await pool.query('SELECT id FROM tuktuk.vehicles WHERE id = $1', [id]);
    if (!existing.rows.length) return sendError(res, 'Vehicle not found.', 404);

    const updates = [];
    const values = [];
    let n = 0;

    if (registrationNumber !== undefined) { n++; updates.push(`registration_number = $${n}`); values.push(registrationNumber); }
    if (driverName !== undefined) { n++; updates.push(`driver_name = $${n}`); values.push(driverName); }
    if (deviceId !== undefined) { n++; updates.push(`device_id = $${n}`); values.push(deviceId); }
    if (provinceId !== undefined) { n++; updates.push(`province_id = $${n}`); values.push(provinceId); }
    if (districtId !== undefined) { n++; updates.push(`district_id = $${n}`); values.push(districtId); }
    if (status !== undefined) { n++; updates.push(`status = $${n}`); values.push(status); }

    if (updates.length === 0) return sendError(res, 'No fields to update.', 400);

    n++;
    values.push(id);
    const result = await pool.query(
      `UPDATE tuktuk.vehicles SET ${updates.join(', ')} WHERE id = $${n} RETURNING *`,
      values
    );
    sendSuccess(res, result.rows[0], 'Vehicle updated successfully.');
  } catch (err) {
    next(err);
  }
};


export const deleteVehicle = async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE tuktuk.vehicles SET status = 'inactive' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return sendError(res, 'Vehicle not found.', 404);
    sendSuccess(res, result.rows[0], 'Vehicle deactivated successfully.');
  } catch (err) {
    next(err);
  }
};


export const getVehicleLocation = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT v.id, v.registration_number, v.device_id, v.driver_name,
              v.last_latitude, v.last_longitude, v.last_speed, v.last_ping_at,
              p.name as province_name, d.name as district_name
       FROM tuktuk.vehicles v
       JOIN tuktuk.provinces p ON v.province_id = p.id
       JOIN tuktuk.districts d ON v.district_id = d.id
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return sendError(res, 'Vehicle not found.', 404);
    const v = result.rows[0];
    if (!v.last_latitude) return sendError(res, 'No location data available.', 404);

    sendSuccess(res, {
      vehicleId: v.id, registrationNumber: v.registration_number,
      driverName: v.driver_name, latitude: v.last_latitude,
      longitude: v.last_longitude, speed: v.last_speed,
      lastPingAt: v.last_ping_at, province: v.province_name,
      district: v.district_name
    }, 'Last known location retrieved.');
  } catch (err) {
    next(err);
  }
};


export const getVehicleHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const vehicle = await pool.query('SELECT id FROM tuktuk.vehicles WHERE id = $1', [id]);
    if (!vehicle.rows.length) return sendError(res, 'Vehicle not found.', 404);

    let query = `SELECT id, latitude, longitude, speed, accuracy, timestamp
                 FROM tuktuk.location_pings WHERE vehicle_id = $1`;
    let countQuery = `SELECT COUNT(*) FROM tuktuk.location_pings WHERE vehicle_id = $1`;
    const values = [id];
    const countValues = [id];

    if (from) {
      values.push(from); countValues.push(from);
      query += ` AND timestamp >= $${values.length}`;
      countQuery += ` AND timestamp >= $${countValues.length}`;
    }
    if (to) {
      values.push(to); countValues.push(to);
      query += ` AND timestamp <= $${values.length}`;
      countQuery += ` AND timestamp <= $${countValues.length}`;
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY timestamp DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    sendPaginated(res, result.rows, total, page, limit, 'Vehicle location history retrieved.');
  } catch (err) {
    next(err);
  }
};
