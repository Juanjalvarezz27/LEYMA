import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Traemos TODAS las órdenes que no estén anuladas, sin importar si tienen resultados o no.
    const ordenes = await prisma.orden.findMany({
      where: {
        estado: { nombre: { not: "ANULADA" } }
      },
      include: {
        paciente: true,
        estado: { select: { nombre: true } },
        detalles: {
          include: {
            prueba: true,
            resultado: true // <--- MUY IMPORTANTE: Traemos el resultado guardado por si queremos editarlo
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' } // Las más recientes primero
    });

    return NextResponse.json(ordenes);
  } catch (error) {
    console.error("Error al obtener lista de resultados:", error);
    return NextResponse.json({ error: "Error interno al cargar la lista" }, { status: 500 });
  }
}