import { loginWithPassword, seedDefaultsIfEmpty, verifyPassword, updatePassword } from '../staff-auth.js';
import { createToken, verifyToken, getTokenFromRequest, requireRole } from '../session.js';

export async function handleAuthLogin(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password required' });
  }

  try {
    await seedDefaultsIfEmpty();
    const role = await loginWithPassword(password.trim());
    if (!role) {
      return res.status(401).json({ error: 'Wrong password' });
    }

    return res.status(200).json({
      token: createToken(role),
      role,
      label: 'Staff'
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Login failed' });
  }
}

export async function handleAuthVerify(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getTokenFromRequest(req);
  const role = verifyToken(token);
  if (!role) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  return res.status(200).json({ role, label: 'Staff' });
}

export async function handleAuthChangePassword(req, res) {
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

export async function handleAuthResetStaff(req, res) {
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
