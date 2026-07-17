import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dias = parseInt(searchParams.get("dias") || "7", 10);
    const busqueda = searchParams.get("busqueda") || "";
    const fechaFiltro = searchParams.get("fecha") || "";
    
    const whereClause: any = {
      estado: { nombre: { not: "ANULADA" } }
    };

    if (fechaFiltro) {
      // Filtro exacto por día
      const fechaInicio = new Date(`${fechaFiltro}T00:00:00.000-04:00`);
      const fechaFin = new Date(`${fechaFiltro}T23:59:59.999-04:00`);
      whereClause.fechaCreacion = { gte: fechaInicio, lte: fechaFin };
    } else if (busqueda) {
      // Búsqueda global (sin límite de fecha)
      const bNum = parseInt(busqueda, 10);
      whereClause.OR = [
        { paciente: { nombreCompleto: { contains: busqueda, mode: "insensitive" } } },
        { paciente: { cedula: { contains: busqueda, mode: "insensitive" } } }
      ];
      if (!isNaN(bNum)) {
         whereClause.OR.push({ id: bNum });
      }
    } else {
      // Por defecto: barrera protectora de N días
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - dias);
      whereClause.fechaCreacion = { gte: fechaLimite };
    }

    const ordenes = await prisma.orden.findMany({
      where: whereClause,
      take: busqueda ? 150 : undefined,
      select: {
        id: true,
        fechaCreacion: true,
        resultadosCompletados: true,
        paciente: {
          select: {
            nombreCompleto: true,
            cedula: true,
            sexo: true,
            esBebe: true,
            fechaNacimiento: true,
            telefono: true,
            observaciones: true
          }
        },
        estado: { select: { nombre: true } },
        creadoPor: { select: { nombre: true } },
        detalles: {
          select: {
            id: true,
            resultado: {
              select: {
                id: true,
                firmado: true,
                observaciones: true,
                fechaProcesado: true,
                valoresReferencia: true,
                valores: { select: { id: true, pruebaId: true, valorIngresado: true } },
                procesadoPor: {
                  select: { id: true, nombre: true, firmaUrl: true, mpps: true, col: true }
                }
              }
            },
            prueba: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                unidades: true,
                valoresReferencia: true,
                opcionesPredefinidas: true,
                ordenVisual: true,
                categoriaVisual: true,
                subcategoriaVisual: true,
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
        notasSubcategoria: { select: { subcategoria: true, nota: true } }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    return NextResponse.json(ordenes);
  } catch (error: any) {
    console.error("Error al obtener lista de resultados:", error);
    return NextResponse.json({ error: `Error interno al cargar la lista: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}