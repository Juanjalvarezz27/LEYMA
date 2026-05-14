import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const examenes = await prisma.subcategoriaPrueba.findMany({
      include: {
        categoria: true,
        pruebas: { 
          orderBy: { ordenVisual: 'asc' } 
        }
      },
      orderBy: { nombre: 'asc' },
    });
    // Forzamos que el JSON lleve los campos correctos
    return NextResponse.json(examenes);
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar el catálogo" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
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
        pruebas: {
          create: body.pruebas.map((p: any, index: number) => ({
            codigo: p.codigo.toUpperCase(),
            nombre: p.nombre.toUpperCase(),
            precioUSD: parseFloat(p.precioUSD),
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