import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuario = await prisma.usuario.findUnique({ where: { correo: session.user.email } });
    if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();
    const { ordenId, resultados } = body;

    if (!ordenId || !resultados || resultados.length === 0) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Usamos upsert para cada resultado. Si ya existía, lo pisa. Si es nuevo, lo crea.
      for (const res of resultados) {
        await tx.resultadoPrueba.upsert({
          where: { detalleOrdenId: res.detalleOrdenId },
          update: {
            valores: res.valores,
            observaciones: res.observaciones || null,
            usuarioId: usuario.id,
            fechaProcesado: new Date() // Actualizamos la fecha de modificación
          },
          create: {
            detalleOrdenId: res.detalleOrdenId,
            usuarioId: usuario.id,
            valores: res.valores,
            observaciones: res.observaciones || null
          }
        });
      }

      await tx.orden.update({
        where: { id: ordenId },
        data: { resultadosCompletados: true }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al guardar resultados:", error);
    return NextResponse.json({ error: "Error interno al guardar" }, { status: 500 });
  }
}