import { loginWithPassword, seedDefaultsIfEmpty } from '../lib/staff-auth.js';
import { createToken } from '../lib/session.js';

export default async function handler(req, res) {
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
      label: role === 'admin' ? 'Manager' : 'Staff'
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Login failed' });
  }
}
