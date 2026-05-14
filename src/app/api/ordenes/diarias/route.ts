import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fechaParam = searchParams.get("fecha");

    if (!fechaParam) {
      return NextResponse.json({ error: "Debe proporcionar una fecha" }, { status: 400 });
    }

    const fechaInicio = new Date(`${fechaParam}T00:00:00.000-04:00`);
    const fechaFin = new Date(`${fechaParam}T23:59:59.999-04:00`);

    const ordenes = await prisma.orden.findMany({
      where: {
        fechaCreacion: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        paciente: true,
        estado: { select: { nombre: true } },
        tipoDescuento: { select: { nombre: true } }, 
        detalles: {
          include: {
            prueba: true,
            tipoDescuento: { select: { nombre: true } } 
          }
        },
        pagos: {
          include: { metodo: true }
        },
        creadoPor: { select: { nombre: true } }
      },
      orderBy: {
        fechaCreacion: 'desc'
      }
    });

    return NextResponse.json(ordenes);
  } catch (error) {
    console.error("Error al obtener lista diaria:", error);
    return NextResponse.json({ error: "Error al cargar las órdenes" }, { status: 500 });
  }
}