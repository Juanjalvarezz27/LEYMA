import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; 
    const body = await req.json();
    
    // Si solo enviamos el estado "activa" (Botón de inhabilitar)
    if (body.activa !== undefined && Object.keys(body).length === 1) {
      const actualizado = await prisma.prueba.update({
        where: { id },
        data: { activa: body.activa }
      });
      return NextResponse.json(actualizado);
    }

    // Si enviamos los datos completos (Edición individual)
    const actualizado = await prisma.prueba.update({
      where: { id },
      data: { 
        codigo: body.codigo.toUpperCase(),
        nombre: body.nombre.toUpperCase(),
        precioUSD: parseFloat(body.precioUSD),
        unidades: body.unidades || null,
        valoresReferencia: body.valoresReferencia || null
      }
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar la prueba individual" }, { status: 500 });
  }
}