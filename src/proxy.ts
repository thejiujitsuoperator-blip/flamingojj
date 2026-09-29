import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// One codebase, two sites. The RSVP deployment (flamingorsvp.vercel.app,
// rsvp.flamingojiujitsu.com) serves only the Community Day RSVP page; the
// coach/member app's deployment doesn't expose it. SITE_MODE overrides the
// hostname check: "rsvp", "coach" or "all".

const RSVP_PAGE = "/FlamingoCommunityRSVP";
const RSVP_PATHS = [RSVP_PAGE, "/api/rsvp"];

type SiteMode = "rsvp" | "coach" | "all";

function siteMode(host: string): SiteMode {
  const forced = process.env.SITE_MODE;
  if (forced === "rsvp" || forced === "coach" || forced === "all") return forced;
  const hostname = host.split(":")[0].toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1") return "all";
  if (hostname.startsWith("flamingorsvp") || hostname.startsWith("rsvp.")) return "rsvp";
  return "coach";
}

function isRsvpPath(pathname: string): boolean {
  return RSVP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function proxy(request: NextRequest) {
  const mode = siteMode(request.headers.get("host") ?? "");
  const { pathname } = request.nextUrl;

  if (mode === "rsvp" && !isRsvpPath(pathname)) {
    if (pathname.startsWith("/api/")) return new NextResponse("Not found", { status: 404 });
    return NextResponse.redirect(new URL(RSVP_PAGE, request.url));
  }
  if (mode === "coach" && isRsvpPath(pathname)) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  // Skip build assets and files from public/ (logos, favicon).
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|svg|jpg|ico)$).*)"],
};
