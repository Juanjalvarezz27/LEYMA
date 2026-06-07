import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ pruebaId: string }> }) {
  try {
    const { pruebaId } = await params;

    const [prueba, costosFijos, config] = await Promise.all([
      prisma.prueba.findUnique({
        where: { id: pruebaId },
        include: {
          insumosAsociados: {
            include: {
              insumo: true,
            }
          }
        }
      }),
      prisma.costoFijo.findMany({ where: { activo: true } }),
      prisma.configuracionLaboratorio.findFirst()
    ]);

    if (!prueba) return NextResponse.json({ error: "Prueba no encontrada" }, { status: 404 });

    const totalCostosFijos = costosFijos.reduce((sum, c) => sum + c.montoMensualUSD, 0);
    const volumenMensual = config?.volumenPruebasMensualEstimado || 1000;
    const costoFijoPorPrueba = volumenMensual > 0 ? totalCostosFijos / volumenMensual : 0;

    return NextResponse.json({
      prueba: {
        id: prueba.id,
        nombre: prueba.nombre,
        codigo: prueba.codigo,
        precioUSD: prueba.precioUSD,
      },
      receta: prueba.insumosAsociados,
      costoFijoPorPrueba
    });

  } catch (error: any) {
    console.error("Error en ensamblador:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ pruebaId: string }> }) {
  try {
    const { pruebaId } = await params;
    const body = await req.json();
    
    if (body.receta && Array.isArray(body.receta)) {
      await prisma.pruebaInsumo.deleteMany({
        where: { pruebaId }
      });

      if (body.receta.length > 0) {
        const dataInsert = body.receta.map((item: any) => ({
          pruebaId,
          insumoId: item.insumoId,
          cantidadUsada: Number(item.cantidadUsada)
        }));
        await prisma.pruebaInsumo.createMany({
          data: dataInsert
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al actualizar receta:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
