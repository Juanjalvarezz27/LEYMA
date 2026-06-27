import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ordenesPendientes = await prisma.orden.findMany({
      where: {
        estado: { nombre: "BORRADOR" }
      },
      include: {
        paciente: { select: { nombreCompleto: true } }
      },
      orderBy: {
        fechaCreacion: 'desc'
      },
      take: 20
    });

    return NextResponse.json(ordenesPendientes);
  } catch (error: any) {
    console.error("Error al obtener ordenes pendientes:", error);
    return NextResponse.json({ error: "Error al cargar las órdenes pendientes" }, { status: 500 });
  }
}
