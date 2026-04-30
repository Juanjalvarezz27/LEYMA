import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const ordenId = parseInt(resolvedParams.id, 10);
    const body = await req.json();

    const { clave, estadoDestino } = body;

    // 1. Verificamos la clave maestra (Le ponemos un fallback por si olvidas el .env)
    const CLAVE_REAL = process.env.CLAVE_MAESTRA || "leyma2026";
    
    if (clave !== CLAVE_REAL) {
      return NextResponse.json({ error: "Clave maestra incorrecta" }, { status: 403 });
    }

    // 2. Buscamos el ID del estado al que queremos cambiar
    const estadoEnBD = await prisma.estadoOrden.findUnique({ where: { nombre: estadoDestino } });
    
    if (!estadoEnBD) {
      return NextResponse.json({ error: "Estado de destino no existe" }, { status: 500 });
    }

    // 3. Actualizamos la orden
    const ordenActualizada = await prisma.orden.update({
      where: { id: ordenId },
      data: { estadoId: estadoEnBD.id }
    });

    return NextResponse.json({ success: true, orden: ordenActualizada });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    return NextResponse.json({ error: "Error interno al cambiar el estado" }, { status: 500 });
  }
}