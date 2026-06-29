import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const examenes = await prisma.subcategoriaPrueba.findMany({
      include: {
        categoria: true,
        pruebas: { orderBy: { ordenVisual: 'asc' } }
      },
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json(examenes);
  } catch (error: any) {
    return NextResponse.json({ error: `Error al cargar el catálogo: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Validar duplicados dentro del mismo formulario
    const codigos = body.pruebas.map((p: any) => p.codigo.toUpperCase());
    const duplicadosEnForm = codigos.filter((item: string, index: number) => codigos.indexOf(item) !== index);
    if (duplicadosEnForm.length > 0) {
      const repetidos = Array.from(new Set(duplicadosEnForm)).join(", ");
      return NextResponse.json({ error: `Has repetido códigos en la lista (${repetidos}). Cada código debe ser único en la misma estructura.` }, { status: 400 });
    }

    const pruebasExistentes = await prisma.prueba.findMany({
      where: { codigo: { in: codigos } }
    });

    if (pruebasExistentes.length > 0) {
      const conflictos = [];
      for (const pExistente of pruebasExistentes) {
        const pNueva = body.pruebas.find((p: any) => p.codigo.toUpperCase() === pExistente.codigo);
        if (pNueva && pNueva.nombre.trim().toUpperCase() !== pExistente.nombre.trim().toUpperCase()) {
          conflictos.push(`El código ${pExistente.codigo} ya está usado en "${pExistente.nombre}" y tú intentaste usarlo para "${pNueva.nombre}"`);
        }
      }

      if (conflictos.length > 0) {
        return NextResponse.json({ error: `Error de códigos compartidos: ${conflictos.join(" | ")}.` }, { status: 400 });
      }
    }

    // 2. Validar que el nombre del paquete/perfil no exista ya
    const subcatExistente = await prisma.subcategoriaPrueba.findFirst({
      where: { nombre: body.subcategoria.toUpperCase() }
    });
    if (subcatExistente) {
      return NextResponse.json({ error: `El perfil, paquete o subcategoría con el nombre "${body.subcategoria.toUpperCase()}" ya existe en el sistema.` }, { status: 400 });
    }

    const categoria = await prisma.categoriaPrueba.upsert({
      where: { nombre: body.categoria.toUpperCase() },
      update: {},
      create: { nombre: body.categoria.toUpperCase() }
    });

    const nuevaSubcategoria = await prisma.subcategoriaPrueba.create({
      data: {
        nombre: body.subcategoria,
        categoriaId: categoria.id,
        activa: true,
        esPaquete: body.esPaquete,
        precioUSD: body.esPaquete ? parseFloat(body.precioPaqueteUSD) : null,
        pruebas: {
          create: body.pruebas.map((p: any, index: number) => ({
            codigo: p.codigo.toUpperCase(),
            nombre: p.nombre.toUpperCase(),
            precioUSD: body.esPaquete ? null : parseFloat(p.precioUSD),
            unidades: p.unidades || null,
            valoresReferencia: p.valoresReferencia || null,
            opcionesPredefinidas: p.opcionesPredefinidas || null,
            activa: true,
            ordenVisual: index + 1,
            categoriaVisual: p.categoriaVisual || null,
            subcategoriaVisual: p.subcategoriaVisual || null
          }))
        }
      },
      include: { categoria: true, pruebas: true }
    });
    
    return NextResponse.json(nuevaSubcategoria);
  } catch (error: any) {
    console.error("Error en POST /api/pruebas:", error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || "un campo";
      return NextResponse.json({ error: `Error: Ya existe un registro con ese nombre o código (${target}).` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Error al crear el registro" }, { status: 500 });
  }
}