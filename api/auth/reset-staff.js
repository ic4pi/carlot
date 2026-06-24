import { updatePassword, verifyPassword } from '../lib/staff-auth.js';
import { requireRole } from '../lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const role = requireRole(req, res, 'admin');
  if (!role) return;

  const { adminPassword, newStaffPassword } = req.body || {};

  if (!adminPassword || !newStaffPassword) {
    return res.status(400).json({ error: 'adminPassword and newStaffPassword are required' });
  }

  if (newStaffPassword.length < 6) {
    return res.status(400).json({ error: 'New staff password must be at least 6 characters' });
  }

  const adminOk = await verifyPassword(adminPassword, 'admin');
  if (!adminOk) {
    return res.status(401).json({ error: 'Manager password is incorrect' });
  }

  const result = await updatePassword('staff', newStaffPassword);
  if (!result.ok) {
    return res.status(503).json({ error: result.error });
  }

  return res.status(200).json({
    success: true,
    message: 'Staff password has been reset'
  });
}
