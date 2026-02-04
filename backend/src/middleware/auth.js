const { AuthService } = require('../services/authService');

const authService = new AuthService();

/**
 * Middleware to authenticate requests using JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    // First try to verify as our JWT token
    let user = authService.verifyToken(token);
    
    // If that fails, try to verify as Supabase token
    if (!user) {
      user = await authService.verifySupabaseToken(token);
    }

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Try to verify token if provided
      let user = authService.verifyToken(token);
      
      if (!user) {
        user = await authService.verifySupabaseToken(token);
      }

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    // Continue without authentication
    next();
  }
};

module.exports = { authenticateToken, optionalAuth };