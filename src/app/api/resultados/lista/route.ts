import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const ordenes = await prisma.orden.findMany({
      where: {
        estado: { nombre: { not: "ANULADA" } }
      },
      include: {
        paciente: true,
        estado: { select: { nombre: true } },
        detalles: {
          include: {
            // ¡ESTA LÍNEA ES LA QUE ARREGLA EL PROBLEMA DE LOS GUIONES!
            resultado: { include: { valores: true } }, 
            prueba: {
              include: {
                subcategoria: {
                  include: {
                    categoria: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    return NextResponse.json(ordenes);
  } catch (error) {
    console.error("Error al obtener lista de resultados:", error);
    return NextResponse.json({ error: "Error interno al cargar la lista" }, { status: 500 });
  }
}