export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists (set by auth middleware)
    if (!req.user) {
      return res.status(401).send("Unauthorized");
    }

    // Check if user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).send("Forbidden");
    }

    next();
  };
};