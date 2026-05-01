import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Buscamos órdenes que no estén anuladas y que no tengan los resultados completados
    const ordenes = await prisma.orden.findMany({
      where: {
        resultadosCompletados: false,
        estado: { nombre: { not: "ANULADA" } }
      },
      include: {
        paciente: true,
        estado: { select: { nombre: true } },
        detalles: {
          include: {
            prueba: true
          }
        }
      },
      orderBy: { fechaCreacion: 'asc' } // Las más viejas primero (prioridad)
    });

    return NextResponse.json(ordenes);
  } catch (error) {
    console.error("Error al obtener pendientes:", error);
    return NextResponse.json({ error: "Error interno al cargar pendientes" }, { status: 500 });
  }
}