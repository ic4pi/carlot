(function () {
  const TOKEN_KEY = 'carlot_staff_token';
  const ROLE_KEY = 'carlot_staff_role';

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function getRole() {
    return sessionStorage.getItem(ROLE_KEY);
  }

  function isAdmin() {
    return getRole() === 'admin';
  }

  function saveSession(token, role) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(ROLE_KEY, role);
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
  }

  async function verify() {
    const token = getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        logout();
        return null;
      }
      const data = await res.json();
      sessionStorage.setItem(ROLE_KEY, data.role);
      return data;
    } catch {
      logout();
      return null;
    }
  }

  async function login(password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Login failed');
    saveSession(data.token, data.role);
    return data;
  }

  function dashHome() {
    const host = location.hostname;
    return host.startsWith('dash.') ? '/' : '/dash/index.html';
  }

  function requireAuth(options = {}) {
    const { adminOnly = false, loginPath = null } = options;

    return verify().then((session) => {
      if (!session) {
        const dest = loginPath || dashHome();
        const next = encodeURIComponent(location.pathname + location.search);
        location.href = `${dest}${dest.includes('?') ? '&' : '?'}login=1&next=${next}`;
        return null;
      }
      if (adminOnly && session.role !== 'admin') {
        location.href = dashHome();
        return null;
      }
      return session;
    });
  }

  window.CarlotAuth = {
    getToken,
    getRole,
    isAdmin,
    login,
    logout,
    verify,
    requireAuth,
    dashHome
  };
})();
