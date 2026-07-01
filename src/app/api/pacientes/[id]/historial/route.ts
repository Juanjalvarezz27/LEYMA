import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const pacienteId = resolvedParams.id;

    if (!pacienteId) {
      return NextResponse.json({ error: "ID de paciente requerido" }, { status: 400 });
    }

    const pacienteHistorial = await prisma.paciente.findUnique({
      where: { id: pacienteId },
      include: {
        ordenes: {
          orderBy: {
            fechaCreacion: 'desc' 
          },
          include: {
            estado: true,
            creadoPor: true,
            detalles: {
              include: {
                prueba: {
                  include: {
                    subcategoria: {
                      include: {
                        categoria: true
                      }
                    }
                  }
                },
                resultado: {
                  include: {
                    valores: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!pacienteHistorial) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    return NextResponse.json(pacienteHistorial);
  } catch (error: any) {
    console.error(`Error al obtener historial del paciente:`, error);
    return NextResponse.json({ error: `Error interno al buscar historial: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
