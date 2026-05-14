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
    
    // Si es solo el toggle de activar/desactivar
    if (body.activa !== undefined && Object.keys(body).length === 1) {
      const actualizado = await prisma.subcategoriaPrueba.update({
        where: { id },
        data: { activa: body.activa }
      });
      return NextResponse.json(actualizado);
    }

    const categoria = await prisma.categoriaPrueba.upsert({
      where: { nombre: body.categoria.toUpperCase() },
      update: {},
      create: { nombre: body.categoria.toUpperCase() }
    });

    const idsMantener = body.pruebas.map((p: any) => p.id).filter(Boolean);

    const subcatActualizada = await prisma.subcategoriaPrueba.update({
      where: { id: id },
      data: {
        nombre: body.subcategoria,
        categoriaId: categoria.id,
        // Al actualizar la estructura, mantenemos el estado activa que ya tenía
        pruebas: {
          deleteMany: { id: { notIn: idsMantener } },
          upsert: body.pruebas.map((p: any, index: number) => ({
            where: { id: p.id || 'fake-id' },
            update: { 
              codigo: p.codigo.toUpperCase(), 
              nombre: p.nombre.toUpperCase(), 
              precioUSD: parseFloat(p.precioUSD),
              unidades: p.unidades, 
              valoresReferencia: p.valoresReferencia,
              ordenVisual: index + 1 
            },
            create: { 
              codigo: p.codigo.toUpperCase(), 
              nombre: p.nombre.toUpperCase(), 
              precioUSD: parseFloat(p.precioUSD),
              unidades: p.unidades, 
              valoresReferencia: p.valoresReferencia,
              activa: true,
              ordenVisual: index + 1 
            }
          }))
        }
      },
      include: { categoria: true, pruebas: true }
    });
    
    return NextResponse.json(subcatActualizada);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}