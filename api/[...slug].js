export default async function handler(req, res) {
  try {
    const slug = req.query.slug;
    const path = Array.isArray(slug) ? slug.join('/') : (slug || '');

    switch (path) {
      case 'health': {
        const { handleHealth } = await import('./lib/routes/health.js');
        return handleHealth(req, res);
      }
      case 'chat': {
        const { handleChat } = await import('./lib/routes/chat.js');
        return handleChat(req, res);
      }
      case 'vehicles': {
        const { handleVehicles } = await import('./lib/routes/vehicles.js');
        return handleVehicles(req, res);
      }
      case 'auth/login': {
        const { handleAuthLogin } = await import('./lib/routes/auth.js');
        return handleAuthLogin(req, res);
      }
      case 'auth/verify': {
        const { handleAuthVerify } = await import('./lib/routes/auth.js');
        return handleAuthVerify(req, res);
      }
      case 'auth/change-password': {
        const { handleAuthChangePassword } = await import('./lib/routes/auth.js');
        return handleAuthChangePassword(req, res);
      }
      case 'auth/reset-staff': {
        const { handleAuthResetStaff } = await import('./lib/routes/auth.js');
        return handleAuthResetStaff(req, res);
      }
      default:
        return res.status(404).json({ error: 'Not found', path });
    }
  } catch (e) {
    console.error('API router error:', e);
    return res.status(500).json({ error: 'Server error', detail: e.message });
  }
}
