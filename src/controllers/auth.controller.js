import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';

const SALT_ROUNDS = 10;

export const register = async (req, res, next) => {
  try {
    const { username, password, role, assignedProvinceId, assignedDistrictId, assignedStationId, assignedVehicleId } = req.body;

    // Check if username already exists
    const existing = await pool.query(
      'SELECT id FROM tuktuk.users WHERE username = $1',
      [username]
    );
    if (existing.rows.length > 0) {
      return sendError(res, 'Username already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO tuktuk.users (username, password, role, assigned_province_id, assigned_district_id, assigned_station_id, assigned_vehicle_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, role, assigned_province_id, assigned_district_id, assigned_station_id, created_at`,
      [username, passwordHash, role, assignedProvinceId || null, assignedDistrictId || null, assignedStationId || null, assignedVehicleId || null]
    );

    sendSuccess(res, result.rows[0], 'User registered successfully.', 201);
  } catch (err) {
    next(err);
  }
};


export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      `SELECT u.*, p.name as province_name, d.name as district_name
       FROM tuktuk.users u
       LEFT JOIN tuktuk.provinces p ON u.assigned_province_id = p.id
       LEFT JOIN tuktuk.districts d ON u.assigned_district_id = d.id
       WHERE u.username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      return sendError(res, 'Invalid username or password.', 401);
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return sendError(res, 'Invalid username or password.', 401);
    }

    const expiresIn = user.role === 'DEVICE' ? '7d' : '24h';

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      assignedProvinceId: user.assigned_province_id,
      assignedDistrictId: user.assigned_district_id,
      assignedStationId: user.assigned_station_id,
      assignedVehicleId: user.assigned_vehicle_id
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn });

    sendSuccess(res, {
      token,
      expiresIn,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        assignedProvince: user.province_name || null,
        assignedDistrict: user.district_name || null
      }
    }, 'Login successful.');
  } catch (err) {
    next(err);
  }
};


export const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.role, u.assigned_province_id, u.assigned_district_id, u.assigned_station_id, u.created_at,
              p.name as province_name, d.name as district_name, ps.name as station_name
       FROM tuktuk.users u
       LEFT JOIN tuktuk.provinces p ON u.assigned_province_id = p.id
       LEFT JOIN tuktuk.districts d ON u.assigned_district_id = d.id
       LEFT JOIN tuktuk.police_stations ps ON u.assigned_station_id = ps.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return sendError(res, 'User not found.', 404);
    }

    sendSuccess(res, result.rows[0], 'User profile retrieved.');
  } catch (err) {
    next(err);
  }
};
