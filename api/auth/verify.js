import { verifyToken, getTokenFromRequest } from '../lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getTokenFromRequest(req);
  const role = verifyToken(token);
  if (!role) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  return res.status(200).json({
    role,
    label: role === 'admin' ? 'Manager' : 'Staff'
  });
}
