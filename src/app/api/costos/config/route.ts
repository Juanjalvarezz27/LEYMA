import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    let config = await prisma.configuracionLaboratorio.findFirst();
    if (!config) {
      config = await prisma.configuracionLaboratorio.create({
        data: { volumenPruebasMensualEstimado: 1000 },
      });
    }
    
    // Obtener también el total de costos fijos para calcular la cuota directamente
    const sumatoria = await prisma.costoFijo.aggregate({
      _sum: { montoMensualUSD: true },
      where: { activo: true },
    });

    const costoFijoTotal = sumatoria._sum.montoMensualUSD || 0;
    const cuotaFijaPorPrueba = config.volumenPruebasMensualEstimado > 0 
      ? costoFijoTotal / config.volumenPruebasMensualEstimado 
      : 0;

    return NextResponse.json({
      config,
      costoFijoTotal,
      cuotaFijaPorPrueba
    });
  } catch (error) {
    console.error("Error en config costos:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { volumenPruebasMensualEstimado } = body;

    let config = await prisma.configuracionLaboratorio.findFirst();
    if (config) {
      config = await prisma.configuracionLaboratorio.update({
        where: { id: config.id },
        data: { volumenPruebasMensualEstimado: Number(volumenPruebasMensualEstimado) },
      });
    } else {
      config = await prisma.configuracionLaboratorio.create({
        data: { volumenPruebasMensualEstimado: Number(volumenPruebasMensualEstimado) },
      });
    }
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar config" }, { status: 500 });
  }
}
