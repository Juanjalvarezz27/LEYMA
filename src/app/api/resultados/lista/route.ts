import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const ordenes = await prisma.orden.findMany({
      where: {
        estado: { nombre: { not: "ANULADA" } }
      },
      include: {
        paciente: true,
        estado: { select: { nombre: true } },
        creadoPor: { select: { nombre: true } }, // Para saber qué asistente la registró
        detalles: {
          include: {
            resultado: { 
              include: { 
                valores: true,
                procesadoPor: { 
                  select: { 
                    id: true, 
                    nombre: true, 
                    firmaUrl: true,
                    mpps: true,
                    col: true
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
      orderBy: { fechaCreacion: 'desc' }
    });

    return NextResponse.json(ordenes);
  } catch (error: any) {
    console.error("Error al obtener lista de resultados:", error);
    return NextResponse.json({ error: `Error interno al cargar la lista: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}