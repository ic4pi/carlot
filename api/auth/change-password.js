import { verifyPassword, updatePassword } from '../lib/staff-auth.js';
import { requireRole } from '../lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const role = requireRole(req, res);
  if (!role) return;

  const { currentPassword, newPassword, targetRole } = req.body || {};

  if (!currentPassword || !newPassword || !targetRole) {
    return res.status(400).json({ error: 'currentPassword, newPassword, and targetRole are required' });
  }

  if (targetRole !== 'admin' && targetRole !== 'staff') {
    return res.status(400).json({ error: 'targetRole must be admin or staff' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const adminOk = await verifyPassword(currentPassword, 'admin');
  if (!adminOk) {
    return res.status(401).json({ error: 'Manager password is incorrect' });
  }

  const result = await updatePassword(targetRole, newPassword);
  if (!result.ok) {
    return res.status(503).json({ error: result.error });
  }

  return res.status(200).json({
    success: true,
    message: `${targetRole === 'admin' ? 'Manager' : 'Staff'} password updated`
  });
}
