import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req: NextRequest) {
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET ?? "dev-insecure-secret-change-me",
    });

    const { pathname, search } = req.nextUrl;
    const isAuthPage = pathname === "/login" || pathname === "/signup";
    const isDashboardPage = pathname.startsWith("/dashboard");

    if (isAuthPage && token) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (isDashboardPage && !token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/signup"],
};
