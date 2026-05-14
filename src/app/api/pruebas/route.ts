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
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar el catálogo" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const codigos = body.pruebas.map((p: any) => p.codigo.toUpperCase());
    const pruebasExistentes = await prisma.prueba.findMany({
      where: { codigo: { in: codigos } }
    });

    if (pruebasExistentes.length > 0) {
      const repetidos = pruebasExistentes.map(p => p.codigo).join(", ");
      return NextResponse.json({ error: `Los siguientes códigos ya están registrados: ${repetidos}` }, { status: 400 });
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
            // Si es paquete, las pruebas hijas no tienen precio propio
            precioUSD: body.esPaquete ? null : parseFloat(p.precioUSD),
            unidades: p.unidades || null,
            valoresReferencia: p.valoresReferencia || null,
            activa: true,
            ordenVisual: index + 1
          }))
        }
      },
      include: { categoria: true, pruebas: true }
    });
    
    return NextResponse.json(nuevaSubcategoria);
  } catch (error) {
    return NextResponse.json({ error: "Error al crear el registro" }, { status: 500 });
  }
}