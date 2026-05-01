import Joi from 'joi';

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('SUPER_ADMIN', 'PROVINCIAL_ADMIN', 'STATION_OFFICER', 'DEVICE').required(),
  assignedProvinceId: Joi.number().integer().positive().allow(null),
  assignedDistrictId: Joi.number().integer().positive().allow(null),
  assignedStationId: Joi.number().integer().positive().allow(null),
  assignedVehicleId: Joi.number().integer().positive().allow(null)
});

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

export const createVehicleSchema = Joi.object({
  registrationNumber: Joi.string().max(50).required(),
  driverName: Joi.string().max(200).required(),
  deviceId: Joi.string().max(100).required(),
  provinceId: Joi.number().integer().positive().required(),
  districtId: Joi.number().integer().positive().required(),
  status: Joi.string().valid('active', 'inactive').default('active')
});

export const updateVehicleSchema = Joi.object({
  registrationNumber: Joi.string().max(50),
  driverName: Joi.string().max(200),
  deviceId: Joi.string().max(100),
  provinceId: Joi.number().integer().positive(),
  districtId: Joi.number().integer().positive(),
  status: Joi.string().valid('active', 'inactive')
}).min(1);

export const locationPingSchema = Joi.object({
  deviceId: Joi.string().max(100).required(),
  latitude: Joi.number().min(5.9).max(9.9).required()
    .messages({ 'number.min': 'Latitude must be within Sri Lanka (5.9–9.9)', 'number.max': 'Latitude must be within Sri Lanka (5.9–9.9)' }),
  longitude: Joi.number().min(79.4).max(82.0).required()
    .messages({ 'number.min': 'Longitude must be within Sri Lanka (79.4–82.0)', 'number.max': 'Longitude must be within Sri Lanka (79.4–82.0)' }),
  timestamp: Joi.date().iso().default(() => new Date()),
  speed: Joi.number().min(0).max(200).allow(null),
  accuracy: Joi.number().min(0).allow(null)
});

export const createStationSchema = Joi.object({
  name: Joi.string().max(200).required(),
  districtId: Joi.number().integer().positive().required(),
  address: Joi.string().max(500).allow(null, ''),
  phone: Joi.string().max(20).allow(null, '')
});

export const historyQuerySchema = Joi.object({
  from: Joi.date().iso().required()
    .messages({ 'date.format': 'from must be a valid ISO8601 datetime string' }),
  to: Joi.date().iso().required()
    .messages({ 'date.format': 'to must be a valid ISO8601 datetime string' }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const bulkHistoryQuerySchema = Joi.object({
  vehicleId: Joi.number().integer().positive(),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  province: Joi.string(),
  district: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});
