(function () {
  const TOKEN_KEY = 'carlot_staff_token';

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function saveSession(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
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
      return await res.json();
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
    saveSession(data.token);
    return data;
  }

  function staffHome() {
    return '/staff/';
  }

  function requireAuth(options = {}) {
    const { loginPath = null } = options;

    return verify().then((session) => {
      if (!session) {
        const dest = loginPath || staffHome();
        const next = encodeURIComponent(location.pathname + location.search);
        location.href = `${dest}${dest.includes('?') ? '&' : '?'}login=1&next=${next}`;
        return null;
      }
      return session;
    });
  }

  window.CarlotAuth = {
    getToken,
    login,
    logout,
    verify,
    requireAuth,
    staffHome
  };
})();
