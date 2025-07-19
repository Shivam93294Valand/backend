const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.isAdmin = true; // Flag for admin routes
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
