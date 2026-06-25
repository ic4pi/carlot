import { handleChat } from './lib/routes/chat.js';
import { handleHealth } from './lib/routes/health.js';
import { handleVehicles } from './lib/routes/vehicles.js';
import {
  handleAuthLogin,
  handleAuthVerify,
  handleAuthChangePassword,
  handleAuthResetStaff
} from './lib/routes/auth.js';

export default async function handler(req, res) {
  const slug = req.query.slug;
  const path = Array.isArray(slug) ? slug.join('/') : (slug || '');

  switch (path) {
    case 'health':
      return handleHealth(req, res);
    case 'chat':
      return handleChat(req, res);
    case 'vehicles':
      return handleVehicles(req, res);
    case 'auth/login':
      return handleAuthLogin(req, res);
    case 'auth/verify':
      return handleAuthVerify(req, res);
    case 'auth/change-password':
      return handleAuthChangePassword(req, res);
    case 'auth/reset-staff':
      return handleAuthResetStaff(req, res);
    default:
      return res.status(404).json({ error: 'Not found' });
  }
}
