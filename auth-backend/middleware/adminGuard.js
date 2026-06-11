const requireAdmin = (req, res, next) => {
  const roleName = req?.auth?.role;
  if (roleName !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { requireAdmin };

