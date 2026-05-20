import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const ordenId = parseInt(resolvedParams.id, 10);

    if (isNaN(ordenId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: {
        paciente: true,
        estado: { select: { nombre: true } },
        creadoPor: { select: { nombre: true } },
        detalles: {
          include: {
            resultado: { 
              include: { 
                valores: true,
                procesadoPor: { 
                  select: { 
                    id: true, 
                    nombre: true, 
                    firmaUrl: true 
                  } 
                }
              } 
            }, 
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
    });

    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (!orden.resultadosCompletados) {
      return NextResponse.json({ error: "Los resultados aún no están listos" }, { status: 403 });
    }

    return NextResponse.json(orden);
  } catch (error) {
    console.error("Error al obtener datos del PDF:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
