import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const bioanalistas = await prisma.usuario.findMany({
      where: { 
        rol: { nombre: "ADMIN" },
        activo: true,
        pinFirma: { not: null }
      },
      select: { id: true, nombre: true }
    });
    
    return NextResponse.json(bioanalistas);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener lista de bioanalistas" }, { status: 500 });
  }
}