import { pool } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';


export const getOverview = async (req, res, next) => {
  try {
    // Total vehicles
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM tuktuk.vehicles');
    const total = parseInt(totalResult.rows[0].total);

    const activeResult = await pool.query(
      `SELECT COUNT(*) as active FROM tuktuk.vehicles
       WHERE last_ping_at > NOW() - INTERVAL '30 minutes' AND status = 'active'`
    );
    const activeNow = parseInt(activeResult.rows[0].active);

    // Count by province
    const byProvince = await pool.query(
      `SELECT p.id, p.name, p.code,
              COUNT(v.id) as total_vehicles,
              COUNT(CASE WHEN v.status = 'active' THEN 1 END) as active_vehicles,
              COUNT(CASE WHEN v.last_ping_at > NOW() - INTERVAL '30 minutes' THEN 1 END) as online_now
       FROM tuktuk.provinces p
       LEFT JOIN tuktuk.vehicles v ON v.province_id = p.id
       GROUP BY p.id, p.name, p.code
       ORDER BY p.name`
    );

    // Count by status
    const byStatus = await pool.query(
      `SELECT status, COUNT(*) as count FROM tuktuk.vehicles GROUP BY status`
    );

    sendSuccess(res, {
      totalVehicles: total,
      activeNow,
      byProvince: byProvince.rows,
      byStatus: byStatus.rows
    }, 'Overview statistics retrieved.');
  } catch (err) {
    next(err);
  }
};


export const getProvinceStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Province info
    const province = await pool.query('SELECT * FROM tuktuk.provinces WHERE id = $1', [id]);
    if (!province.rows.length) {
      return sendError(res, 'Province not found.', 404);
    }

    // Vehicle counts
    const vehicleStats = await pool.query(
      `SELECT
         COUNT(*) as total_vehicles,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_vehicles,
         COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_vehicles,
         COUNT(CASE WHEN last_ping_at > NOW() - INTERVAL '30 minutes' THEN 1 END) as online_now
       FROM tuktuk.vehicles WHERE province_id = $1`,
      [id]
    );

    // By district breakdown
    const byDistrict = await pool.query(
      `SELECT d.id, d.name,
              COUNT(v.id) as total_vehicles,
              COUNT(CASE WHEN v.status = 'active' THEN 1 END) as active_vehicles,
              COUNT(CASE WHEN v.last_ping_at > NOW() - INTERVAL '30 minutes' THEN 1 END) as online_now
       FROM tuktuk.districts d
       LEFT JOIN tuktuk.vehicles v ON v.district_id = d.id
       WHERE d.province_id = $1
       GROUP BY d.id, d.name
       ORDER BY d.name`,
      [id]
    );

    // Station count
    const stationCount = await pool.query(
      `SELECT COUNT(*) as count FROM tuktuk.police_stations ps
       JOIN tuktuk.districts d ON ps.district_id = d.id
       WHERE d.province_id = $1`,
      [id]
    );

    sendSuccess(res, {
      province: province.rows[0],
      vehicles: vehicleStats.rows[0],
      stations: parseInt(stationCount.rows[0].count),
      byDistrict: byDistrict.rows
    }, 'Province statistics retrieved.');
  } catch (err) {
    next(err);
  }
};
