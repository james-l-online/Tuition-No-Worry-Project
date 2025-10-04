import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { validateReturnTo } from "./lib/auth";
import { NextResponse } from "next/server";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

// Avoid noisy logs during Next.js dev hot reloads / multiple middleware evaluations.
// Enable detailed middleware logging only when DEBUG_MIDDLEWARE=true in your env.
if (process.env.NODE_ENV === 'development' && process.env.DEBUG_MIDDLEWARE === 'true') {
  const summary = Object.entries(routeAccessMap).map(([route, roles]) => ({ route, allowedRoles: roles }));
  console.log('middleware routeAccessMap summary:', JSON.stringify(summary, null, 2));
}

export default clerkMiddleware((auth, req) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

  // if no session, redirect to sign-in with validated returnTo
  const { sessionId } = auth();
  if (!sessionId) {
    // Allow unauthenticated users to access the sign-in pages and logout page
    const pathname = new URL(req.url).pathname;
    if (pathname === "/" || pathname.startsWith("/sign-in") || pathname.startsWith("/logout")) {
      return; // continue — let the sign-in/logout pages render
    }

    const origin = new URL(req.url).origin;
    const returnTo = validateReturnTo(req.url, origin);
    // If this is an API/fetch request, return 401 JSON instead of redirecting to avoid
    // browser navigations that result from fetches following a redirect. This prevents
    // multiple simultaneous unauthenticated requests from producing many sign-in redirects.
    const accept = req.headers.get('accept') || '';
    if (pathname.startsWith('/api') || pathname.startsWith('/trpc') || accept.includes('application/json')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return NextResponse.redirect(new URL(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`, origin));
  }

  // Role-based checks for protected routes
  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req) && !allowedRoles.includes(role!)) {
      // user is authenticated but not authorized for this route
      return NextResponse.rewrite(new URL(`/403`, req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
