import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const ordenes = await prisma.orden.findMany({
      where: {
        resultadosCompletados: false,
        estado: { nombre: { not: "ANULADA" } }
      },
      take: 50,
      select: {
        id: true,
        fechaCreacion: true,
        paciente: {
          select: { nombreCompleto: true, cedula: true }
        },
        estado: { select: { nombre: true } },
        detalles: {
          select: {
            id: true,
            prueba: {
              select: {
                nombre: true,
                codigo: true,
                subcategoria: {
                  select: {
                    nombre: true,
                    esPaquete: true,
                    categoria: { select: { nombre: true } }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { fechaCreacion: 'asc' }
    });

    return NextResponse.json(ordenes);
  } catch (error: any) {
    console.error("Error al obtener pendientes:", error);
    return NextResponse.json({ error: `Error interno al cargar pendientes: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}