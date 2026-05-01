import { sendError } from '../utils/response.js';


export const scopeToProvince = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Authentication required.', 401);
  }

  if (req.user.role === 'SUPER_ADMIN') {
    req.scopeProvinceId = null;
    return next();
  }

  if (req.user.role === 'PROVINCIAL_ADMIN') {
    if (!req.user.assignedProvinceId) {
      return sendError(res, 'User has no assigned province.', 403);
    }
    req.scopeProvinceId = req.user.assignedProvinceId;
    return next();
  }

  if (req.user.role === 'STATION_OFFICER') {
    if (!req.user.assignedProvinceId) {
      return sendError(res, 'User has no assigned province scope.', 403);
    }
    req.scopeProvinceId = req.user.assignedProvinceId;
    return next();
  }

  req.scopeProvinceId = null;
  next();
};


export const scopeToDistrict = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Authentication required.', 401);
  }

  if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'PROVINCIAL_ADMIN') {
    req.scopeDistrictId = null;
    return next();
  }

  if (req.user.role === 'STATION_OFFICER') {
    if (!req.user.assignedDistrictId) {
      return sendError(res, 'User has no assigned district.', 403);
    }
    req.scopeDistrictId = req.user.assignedDistrictId;
    return next();
  }

  req.scopeDistrictId = null;
  next();
};
