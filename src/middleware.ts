import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Obtenemos el token de la sesión actual
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 1. Si el usuario ESTÁ logueado y trata de entrar al Login (/), lo mandamos al sistema
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/home/registro", req.url));
  }

  // 2. Si el usuario NO ESTÁ logueado y trata de entrar a cualquier ruta de /home, lo echamos al Login
  if (pathname.startsWith("/home") && !token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Si todo está en orden, dejamos que la petición continúe
  return NextResponse.next();
}

// Configuramos en qué rutas debe ejecutarse este middleware para no gastar recursos innecesarios
export const config = {
  matcher: [
    "/",
    "/home/:path*",
  ],
};