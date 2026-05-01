import { sendError } from '../utils/response.js';


export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`, 403);
    }

    next();
  };
};