import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const pacientes = await prisma.paciente.findMany({
      orderBy: {
        nombreCompleto: 'asc' 
      },
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

    return NextResponse.json(pacientes);
  } catch (error) {
    console.error("Error al obtener el directorio de pacientes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}