import jwt from 'jsonwebtoken';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from './tenantContext.js';

const JWT_SECRET = process.env.JWT_SECRET || 'PawnBookPro_Enterprise_Secure_Token_Key_2026';

export async function protect(req, res, next) {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this resource. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const User = getTenantModel(tenantCode, 'User');
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found in tenant database' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'User account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Protect Error]:', err.message);
    return res.status(401).json({ success: false, message: 'Session expired or token invalid. Please log in again.' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const normalizedUserRole = (req.user.role || '').toUpperCase();
    const allowed = roles.map(r => r.toUpperCase());
    
    if (!allowed.includes(normalizedUserRole) && normalizedUserRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: `Role '${req.user.role}' is not authorized to perform this operation.` });
    }
    next();
  };
}

export default {
  protect,
  authorize
};
