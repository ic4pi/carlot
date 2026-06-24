export default function middleware(request) {
  const host = request.headers.get('host') || '';
  if (!host.startsWith('dash.')) return;

  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/' || path === '/dash' || path === '/dash/') {
    url.pathname = '/dash/index.html';
    return Response.rewrite(url);
  }

  if (path === '/add-car') {
    url.pathname = '/add-car.html';
    return Response.rewrite(url);
  }
}

export const config = {
  matcher: ['/', '/dash', '/dash/', '/add-car', '/dash/settings.html']
};
