import { pool } from '../config/db.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';


export const getAllStations = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { district, province } = req.query;

    let query = `
      SELECT ps.id, ps.name, ps.address, ps.phone, ps.district_id, ps.created_at,
             d.name as district_name, p.name as province_name, p.id as province_id
      FROM tuktuk.police_stations ps
      JOIN tuktuk.districts d ON ps.district_id = d.id
      JOIN tuktuk.provinces p ON d.province_id = p.id
    `;
    let countQuery = `
      SELECT COUNT(*) FROM tuktuk.police_stations ps
      JOIN tuktuk.districts d ON ps.district_id = d.id
      JOIN tuktuk.provinces p ON d.province_id = p.id
    `;

    const conditions = [];
    const values = [];

    if (district) {
      values.push(district);
      conditions.push(`LOWER(d.name) = LOWER($${values.length})`);
    }
    if (province) {
      values.push(province);
      conditions.push(`LOWER(p.name) = LOWER($${values.length})`);
    }

    // Apply scope filtering
    if (req.scopeProvinceId) {
      values.push(req.scopeProvinceId);
      conditions.push(`p.id = $${values.length}`);
    }
    if (req.scopeDistrictId) {
      values.push(req.scopeDistrictId);
      conditions.push(`d.id = $${values.length}`);
    }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      query += where;
      countQuery += where;
    }

    // Get total count
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    query += ` ORDER BY ps.name LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    sendPaginated(res, result.rows, total, page, limit, 'Police stations retrieved successfully.');
  } catch (err) {
    next(err);
  }
};


export const createStation = async (req, res, next) => {
  try {
    const { name, districtId, address, phone } = req.body;

    // Verify district exists
    const district = await pool.query('SELECT id FROM tuktuk.districts WHERE id = $1', [districtId]);
    if (!district.rows.length) {
      return sendError(res, 'District not found.', 404);
    }

    const result = await pool.query(
      `INSERT INTO tuktuk.police_stations (name, district_id, address, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, districtId, address || null, phone || null]
    );

    sendSuccess(res, result.rows[0], 'Police station created successfully.', 201);
  } catch (err) {
    next(err);
  }
};


export const getStationById = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ps.*, d.name as district_name, p.name as province_name, p.id as province_id
       FROM tuktuk.police_stations ps
       JOIN tuktuk.districts d ON ps.district_id = d.id
       JOIN tuktuk.provinces p ON d.province_id = p.id
       WHERE ps.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return sendError(res, 'Police station not found.', 404);
    }

    sendSuccess(res, result.rows[0], 'Police station retrieved successfully.');
  } catch (err) {
    next(err);
  }
};
