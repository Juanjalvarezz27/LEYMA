import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const insumos = await prisma.insumo.findMany({
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json(insumos);
  } catch (error) {
    console.error("Error al obtener insumos:", error);
    return NextResponse.json({ error: "Error al obtener insumos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, unidadMedida, costoUnitarioUSD, activo } = body;
    
    if (!nombre || !unidadMedida || costoUnitarioUSD === undefined) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const nuevoInsumo = await prisma.insumo.create({
      data: {
        nombre,
        unidadMedida,
        costoUnitarioUSD: Number(costoUnitarioUSD),
        activo: activo ?? true,
      },
    });

    return NextResponse.json(nuevoInsumo, { status: 201 });
  } catch (error) {
    console.error("Error al crear insumo:", error);
    return NextResponse.json({ error: "Error al crear insumo" }, { status: 500 });
  }
}
