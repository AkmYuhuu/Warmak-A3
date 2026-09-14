import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export type DeviceView = "mobile" | "desktop";

function detectMobile(req: NextRequest): boolean {
  const chMobile = req.headers.get("sec-ch-ua-mobile");
  if (chMobile === "?1") return true;
  if (chMobile === "?0") return false;
  const ua = req.headers.get("user-agent") ?? "";
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(ua);
}

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const viewParam = url.searchParams.get("view");
  const res = NextResponse.next();
  let view: DeviceView;
  if (viewParam === "mobile" || viewParam === "desktop") {
    view = viewParam;
    res.cookies.set("view", view, { path: "/", maxAge: 60 * 60 * 24 * 30 });
  } else {
    const cookieView = req.cookies.get("view")?.value;
    view = cookieView === "mobile" || cookieView === "desktop" ? cookieView : detectMobile(req) ? "mobile" : "desktop";
  }
  res.headers.set("x-device", view);
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
