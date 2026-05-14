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
    
    if (body.activa !== undefined && Object.keys(body).length === 1) {
      const actualizado = await prisma.subcategoriaPrueba.update({
        where: { id },
        data: { activa: body.activa }
      });
      return NextResponse.json(actualizado);
    }

    const codigos = body.pruebas.map((p: any) => p.codigo.toUpperCase());
    const pruebasExistentes = await prisma.prueba.findMany({
      where: { codigo: { in: codigos }, subcategoriaId: { not: id } }
    });

    if (pruebasExistentes.length > 0) {
      const repetidos = pruebasExistentes.map(p => p.codigo).join(", ");
      return NextResponse.json({ error: `Los códigos ${repetidos} ya están en uso.` }, { status: 400 });
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
        esPaquete: body.esPaquete,
        precioUSD: body.esPaquete ? parseFloat(body.precioPaqueteUSD) : null,
        pruebas: {
          deleteMany: { id: { notIn: idsMantener } },
          upsert: body.pruebas.map((p: any, index: number) => ({
            where: { id: p.id || 'fake-id' },
            update: { 
              codigo: p.codigo.toUpperCase(), 
              nombre: p.nombre.toUpperCase(), 
              precioUSD: body.esPaquete ? null : parseFloat(p.precioUSD),
              unidades: p.unidades, 
              valoresReferencia: p.valoresReferencia,
              ordenVisual: index + 1 
            },
            create: { 
              codigo: p.codigo.toUpperCase(), 
              nombre: p.nombre.toUpperCase(), 
              precioUSD: body.esPaquete ? null : parseFloat(p.precioUSD),
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.claveMaestra !== process.env.CLAVE_MAESTRA) {
      return NextResponse.json({ error: "Clave maestra incorrecta." }, { status: 401 });
    }

    await prisma.subcategoriaPrueba.delete({ where: { id: id } });
    return NextResponse.json({ message: "Subcategoría eliminada correctamente." });
  } catch (error: any) {
    if (error.code === 'P2014' || error.code === 'P2003') {
      return NextResponse.json(
        { error: "No puedes eliminar esta subcategoría porque algunas de sus pruebas ya tienen resultados registrados en pacientes." }, 
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Error interno al eliminar la subcategoría" }, { status: 500 });
  }
}