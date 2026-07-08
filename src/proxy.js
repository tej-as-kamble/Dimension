import { auth } from '@/lib/auth';

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // If not logged in and trying to access dashboard, redirect to login
  if (!isLoggedIn) {
    return Response.redirect(new URL('/login', nextUrl));
  }

  // Allow the request to continue
  return;
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
