import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fechaParam = searchParams.get("fecha");

    if (!fechaParam) {
      return NextResponse.json({ error: "Debe proporcionar una fecha" }, { status: 400 });
    }

    // Aseguramos la franja horaria de Venezuela (UTC-4) para buscar en el día exacto
    const fechaInicio = new Date(`${fechaParam}T00:00:00.000-04:00`);
    const fechaFin = new Date(`${fechaParam}T23:59:59.999-04:00`);

    const ordenes = await prisma.orden.findMany({
      where: {
        fechaCreacion: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      select: {
        id: true,
        fechaCreacion: true,
        subtotalUSD: true,
        descuentoGeneral: true,
        totalUSD: true,
        totalBS: true,
        tasaBCV: true,
        paciente: {
          select: {
            nombreCompleto: true,
            cedula: true,
            fechaNacimiento: true,
            esBebe: true,
            sexo: true,
            telefono: true
          }
        },
        estado: { select: { nombre: true } },
        tipoDescuento: { select: { nombre: true } }, 
        detalles: {
          select: {
            id: true,
            cantidad: true,
            precioCongeladoUSD: true,
            descuento: true,
            tipoDescuento: { select: { nombre: true } },
            prueba: {
              select: {
                nombre: true,
                codigo: true,
                subcategoria: {
                  select: {
                    id: true,
                    nombre: true,
                    esPaquete: true,
                    categoria: { select: { nombre: true } }
                  }
                }
              }
            }
          }
        },
        serviciosExtra: {
          select: {
            id: true,
            cantidad: true,
            precioCongeladoUSD: true,
            servicio: { select: { nombre: true } }
          }
        },
        pagos: {
          select: {
            id: true,
            montoUSD: true,
            montoBS: true,
            referencia: true,
            metodo: { select: { nombre: true } }
          }
        },
        creadoPor: { select: { nombre: true } },
        notasSubcategoria: {
          select: {
            subcategoria: true,
            nota: true
          }
        }
      },
      orderBy: {
        fechaCreacion: 'desc' 
      }
    });

    return NextResponse.json(ordenes);
  } catch (error: any) {
    console.error("Error al obtener lista diaria:", error);
    return NextResponse.json({ error: `Error al cargar las órdenes: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}