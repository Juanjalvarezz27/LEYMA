import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Función de seguridad para evitar errores NaN en Prisma
const parsePrecioSeguro = (valor: any) => {
  if (valor === null || valor === undefined || valor === "") return null;
  const parseado = parseFloat(valor);
  return isNaN(parseado) ? null : parseado;
};

export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; 
    const body = await req.json();
    
    // CASO 1: Actualización simple de estado (Activar/Inactivar)
    if (body.activa !== undefined && Object.keys(body).length === 1) {
      const actualizado = await prisma.subcategoriaPrueba.update({
        where: { id },
        data: { activa: body.activa }
      });
      return NextResponse.json(actualizado);
    }

    // Validación de códigos repetidos globalmente (Excluyendo esta misma subcategoría)
    const codigos = body.pruebas.map((p: any) => p.codigo.toUpperCase());
    const pruebasExistentes = await prisma.prueba.findMany({
      where: { codigo: { in: codigos }, subcategoriaId: { not: id } }
    });

    if (pruebasExistentes.length > 0) {
      const repetidos = pruebasExistentes.map(p => p.codigo).join(", ");
      return NextResponse.json({ error: `Los códigos ${repetidos} ya están en uso.` }, { status: 400 });
    }

    // Filtramos los IDs que vienen del frontend para saber cuáles el usuario decidió mantener
    const idsMantener = body.pruebas.map((p: any) => p.id).filter(Boolean);

    // =========================================================================
    // NUEVA VALIDACIÓN: PREVENIR BORRADO DE PRUEBAS EN USO (Protección Foreing Key)
    // =========================================================================
    // Buscamos las pruebas que el usuario eliminó en el modal (las que NO están en idsMantener)
    const pruebasAEliminar = await prisma.prueba.findMany({
      where: {
        subcategoriaId: id,
        id: { notIn: idsMantener.length > 0 ? idsMantener : [''] } // Evita error si idsMantener está vacío
      },
      include: {
        detallesOrden: { take: 1 } // Solo necesitamos ver si tiene al menos 1 orden asociada
      }
    });

    // Filtramos las que ya tienen al menos un detalle de orden
    const pruebasEnUso = pruebasAEliminar.filter(p => p.detallesOrden.length > 0);

    if (pruebasEnUso.length > 0) {
      const nombresBloqueados = pruebasEnUso.map(p => p.nombre).join(", ");
      return NextResponse.json({ 
        error: `No puedes borrar "${nombresBloqueados}" porque ya está registrada en el historial de órdenes de pacientes. Si no la ofreces más, inactiva la subcategoría completa.` 
      }, { status: 400 });
    }
    // =========================================================================

    // Buscamos o creamos la Categoría Padre
    const categoria = await prisma.categoriaPrueba.upsert({
      where: { nombre: body.categoria.toUpperCase() },
      update: {},
      create: { nombre: body.categoria.toUpperCase() }
    });

    // Mapeamos el orden visual a todas las pruebas antes de separarlas
    const pruebasConOrden = body.pruebas.map((p: any, index: number) => ({
      ...p,
      ordenVisual: index + 1
    }));

    // SEPARAMOS LA LÓGICA: Nuevas vs Existentes
    const pruebasNuevas = pruebasConOrden.filter((p: any) => !p.id);
    const pruebasParaActualizar = pruebasConOrden.filter((p: any) => p.id);

    // Actualizamos la Subcategoría y sus relaciones de forma limpia
    const subcatActualizada = await prisma.subcategoriaPrueba.update({
      where: { id: id },
      data: {
        nombre: body.subcategoria,
        categoriaId: categoria.id,
        esPaquete: body.esPaquete,
        precioUSD: body.esPaquete ? parsePrecioSeguro(body.precioPaqueteUSD) : null,
        pruebas: {
          // 1. Eliminamos las pruebas (Ya validamos que es seguro borrarlas)
          deleteMany: { id: { notIn: idsMantener } },
          
          // 2. Creamos las pruebas nuevas agregadas
          create: pruebasNuevas.map((p: any) => ({
            codigo: p.codigo.toUpperCase(), 
            nombre: p.nombre.toUpperCase(), 
            precioUSD: body.esPaquete ? null : parsePrecioSeguro(p.precioUSD),
            unidades: p.unidades, 
            valoresReferencia: p.valoresReferencia,
            activa: true,
            ordenVisual: p.ordenVisual 
          })),

          // 3. Actualizamos las pruebas que ya existían
          update: pruebasParaActualizar.map((p: any) => ({
            where: { id: p.id },
            data: { 
              codigo: p.codigo.toUpperCase(), 
              nombre: p.nombre.toUpperCase(), 
              precioUSD: body.esPaquete ? null : parsePrecioSeguro(p.precioUSD),
              unidades: p.unidades, 
              valoresReferencia: p.valoresReferencia,
              ordenVisual: p.ordenVisual 
            }
          }))
        }
      },
      include: { categoria: true, pruebas: true }
    });
    
    return NextResponse.json(subcatActualizada);
  } catch (error) {
    console.error("Error en PUT /api/pruebas:", error);
    return NextResponse.json({ error: "Error al actualizar la estructura de la prueba" }, { status: 500 });
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