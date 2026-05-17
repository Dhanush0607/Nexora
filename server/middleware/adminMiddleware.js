// middleware/adminMiddleware.js
// Checks if logged-in user is an admin
// Must be used AFTER protect middleware

const isAdmin = async (req, res, next) => {
  try {
    // req.user is set by protect middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    // Check admin flag
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }

    next();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Admin check failed.',
    });
  }
};

module.exports = { isAdmin };