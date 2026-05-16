import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const usuario = await prisma.usuario.findUnique({
      where: { id: token.sub },
      select: {
        nombre: true,
        correo: true,
        pinFirma: true,
        firmaUrl: true,
        rol: { select: { nombre: true } }
      }
    });

    if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json(usuario);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { nombre, claveActual, nuevaClave, pinActual, nuevoPin, firmaUrl } = body;

    const usuarioActual = await prisma.usuario.findUnique({ where: { id: token.sub } });
    if (!usuarioActual) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const updateData: any = { nombre };

    // Validar y actualizar la Firma Digital (Imagen)
    if (firmaUrl !== undefined) updateData.firmaUrl = firmaUrl;

    // Validar y actualizar el PIN
    if (nuevoPin) {
      if (usuarioActual.pinFirma && usuarioActual.pinFirma !== pinActual) {
        return NextResponse.json({ error: "El PIN actual es incorrecto." }, { status: 400 });
      }
      updateData.pinFirma = nuevoPin;
    }

    // Validar y actualizar la Contraseña
    if (claveActual && nuevaClave) {
      const claveCorrecta = await bcrypt.compare(claveActual, usuarioActual.clave);
      if (!claveCorrecta) {
        return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 400 });
      }
      updateData.clave = await bcrypt.hash(nuevaClave, 10);
    }

    await prisma.usuario.update({
      where: { id: token.sub },
      data: updateData,
    });

    return NextResponse.json({ mensaje: "Perfil actualizado correctamente" });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}