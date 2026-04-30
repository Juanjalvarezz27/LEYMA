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
    
    // VALIDACIÓN: Verificar si el nuevo código ya lo tiene OTRA prueba diferente
    if (body.codigo) {
      const existeCodigo = await prisma.prueba.findFirst({
        where: { 
          codigo: body.codigo,
          id: { not: id } // Buscamos en todas menos en la que estamos editando
        }
      });

      if (existeCodigo) {
        return NextResponse.json(
          { error: `El código ${body.codigo} ya está en uso por otra prueba.` }, 
          { status: 400 }
        );
      }
    }

    const pruebaActualizada = await prisma.prueba.update({
      where: { id: id },
      data: {
        codigo: body.codigo,
        nombre: body.nombre,
        precioUSD: body.precioUSD ? parseFloat(body.precioUSD) : undefined,
        activa: body.activa,
      }
    });
    
    return NextResponse.json(pruebaActualizada);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno al actualizar la prueba" }, { status: 500 });
  }
}