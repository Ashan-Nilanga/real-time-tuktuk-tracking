import { pool } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';


export const getAllProvinces = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, code, created_at FROM tuktuk.provinces ORDER BY name'
    );
    sendSuccess(res, result.rows, 'Provinces retrieved successfully.');
  } catch (err) {
    next(err);
  }
};


export const getDistrictsByProvince = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify province exists
    const province = await pool.query(
      'SELECT id, name FROM tuktuk.provinces WHERE id = $1',
      [id]
    );
    if (!province.rows.length) {
      return sendError(res, 'Province not found.', 404);
    }

    const result = await pool.query(
      'SELECT id, name, province_id, created_at FROM tuktuk.districts WHERE province_id = $1 ORDER BY name',
      [id]
    );

    sendSuccess(res, {
      province: province.rows[0],
      districts: result.rows
    }, 'Districts retrieved successfully.');
  } catch (err) {
    next(err);
  }
};
