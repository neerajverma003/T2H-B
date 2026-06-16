import jwt from 'jsonwebtoken';
import { ENV } from '../config/ENV.js';

export const auth = async (req, res, next) => {
  try {
    // Check token from either cookie or Authorization header
    let tokenSource = '';
    let token = req.headers.authorization?.split(' ')[1];
    if (token) {
      tokenSource = 'header:authorization';
    } else {
      token = req.cookies.token;
      if (token) {
        tokenSource = 'cookie:token';
      } else {
        token = req.cookies.user_token;
        if (token) {
          tokenSource = 'cookie:user_token';
        }
      }
    }

    if (!token) {
      console.log(`[AUTH] No token found in cookies or headers`);
      return res.status(401).json({ msg: 'Unauthorized: No token', success: false });
    }

    const authorized = jwt.verify(token, ENV.JWT_SECRET);
    console.log(`[AUTH] Token verified successfully from ${tokenSource}. Decoded ID: ${authorized.id}`);

    req.userId = authorized.id;
    req.userRole = authorized.role || null;

    next();
  } catch (error) {
    console.error(`Auth middleware -> ${error}`);
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ msg: 'Unauthorized: Invalid or expired token', success: false });
    }
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      token = req.cookies.token || req.cookies.user_token;
    }

    if (!token) {
      return next();
    }

    const authorized = jwt.verify(token, ENV.JWT_SECRET);
    req.userId = authorized.id;
    req.userRole = authorized.role || null;
    next();
  } catch (error) {
    console.warn(`[OPTIONAL-AUTH] Verification failed -> ${error.message}`);
    next();
  }
};
// Flexible role-based authorization
export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ msg: 'Unauthorized: No role assigned', success: false });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        msg: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
        success: false
      });
    }
    next();
  };
};

// Legacy support if needed, but we'll transition to 'authorize'
export const authorizeAdmin = authorize(['superadmin', 'admin']);
export const authorizeSuperadmin = authorize(['superadmin']);
