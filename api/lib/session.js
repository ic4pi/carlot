import crypto from 'crypto';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function secret() {
  return process.env.AUTH_SECRET || process.env.OPENROUTER_API_KEY || 'carlot-dev-secret-change-me';
}

export function createToken(role) {
  const payload = {
    role,
    exp: Date.now() + TOKEN_TTL_MS
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  if (sig !== expected) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!payload.exp || Date.now() > payload.exp) return null;
    if (payload.role !== 'admin' && payload.role !== 'staff') return null;
    return payload.role;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return req.body?.token || null;
}

export function requireRole(req, res, minRole) {
  const token = getTokenFromRequest(req);
  const role = verifyToken(token);
  if (!role) {
    res.status(401).json({ error: 'Not logged in' });
    return null;
  }
  if (minRole === 'admin' && role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  return role;
}
