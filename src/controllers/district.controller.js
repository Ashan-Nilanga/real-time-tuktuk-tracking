import { pool } from '../config/db.js';
import { sendSuccess } from '../utils/response.js';


export const getAllDistricts = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.name, d.province_id, d.created_at, p.name as province_name, p.code as province_code
       FROM tuktuk.districts d
       JOIN tuktuk.provinces p ON d.province_id = p.id
       ORDER BY p.name, d.name`
    );
    sendSuccess(res, result.rows, 'Districts retrieved successfully.');
  } catch (err) {
    next(err);
  }
};
