import { NextResponse, type NextRequest } from "next/server";

/** Expose the requested path to server components (used to send people back after logging in). */
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/((?!_next/|api/|favicon|icon-|apple-touch|logo-|manifest|.well-known).*)"] };
