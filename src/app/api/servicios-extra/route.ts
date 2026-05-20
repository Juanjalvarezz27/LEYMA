import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Devuelve el catálogo de servicios extra activos
export async function GET() {
  try {
    const servicios = await prisma.servicioExtra.findMany({
      where: { activo: true },
      orderBy: { precioUSD: "asc" },
    });
    return NextResponse.json(servicios);
  } catch (error) {
    console.error("Error al cargar servicios extra:", error);
    return NextResponse.json({ error: "Error interno al cargar servicios" }, { status: 500 });
  }
}
