import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const pruebas = await prisma.prueba.findMany({
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json(pruebas);
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar las pruebas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Verificamos si el código ya existe para evitar errores bruscos de Prisma
    const existe = await prisma.prueba.findUnique({
      where: { codigo: body.codigo }
    });

    if (existe) {
      return NextResponse.json({ error: "El código de prueba ya está registrado" }, { status: 400 });
    }

    const nuevaPrueba = await prisma.prueba.create({
      data: {
        codigo: body.codigo,
        nombre: body.nombre,
        precioUSD: parseFloat(body.precioUSD),
        activa: true,
      }
    });
    
    return NextResponse.json(nuevaPrueba);
  } catch (error) {
    return NextResponse.json({ error: "Error interno al crear la prueba" }, { status: 500 });
  }
}