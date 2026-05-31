import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await req.json();
    const { nombre, unidadMedida, costoUnitarioUSD, activo } = body;
    
    const actualizado = await prisma.insumo.update({
      where: { id },
      data: {
        nombre,
        unidadMedida,
        costoUnitarioUSD: costoUnitarioUSD !== undefined ? Number(costoUnitarioUSD) : undefined,
        activo,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar insumo:", error);
    return NextResponse.json({ error: "Error al actualizar insumo" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    await prisma.insumo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar insumo" }, { status: 500 });
  }
}
