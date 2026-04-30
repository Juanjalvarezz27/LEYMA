import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const metodos = await prisma.metodoPago.findMany({
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json(metodos);
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar métodos de pago" }, { status: 500 });
  }
}