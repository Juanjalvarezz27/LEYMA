import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cedula = searchParams.get("cedula");

  if (!cedula) {
    return NextResponse.json({ error: "Cédula no proporcionada" }, { status: 400 });
  }

  try {
    const paciente = await prisma.paciente.findUnique({
      where: { cedula },
    });
    
    // Si no lo encuentra, devolvemos null (no es un error 500, simplemente es un paciente nuevo)
    return NextResponse.json(paciente || null);
  } catch (error) {
    return NextResponse.json({ error: "Error al buscar el paciente" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validar que si no es bebé, tenga cédula
    if (!body.esBebe && (!body.cedula || body.cedula.trim() === "")) {
      return NextResponse.json({ error: "La cédula es obligatoria para adultos" }, { status: 400 });
    }

    // Asegurar que la fecha de nacimiento venga en formato ISO-8601
    const fechaNacimiento = new Date(body.fechaNacimiento);

    const nuevoPaciente = await prisma.paciente.create({
      data: {
        cedula: body.esBebe ? null : body.cedula,
        nombreCompleto: body.nombreCompleto,
        fechaNacimiento: fechaNacimiento,
        esBebe: body.esBebe,
        sexo: body.sexo,
        telefono: body.telefono || null,
        correo: body.correo || null,
        direccion: body.direccion || null,
        observaciones: body.observaciones || null,
      }
    });

    return NextResponse.json(nuevoPaciente);
  } catch (error: any) {
    // Manejo de error si intentan meter una cédula que ya existe
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Esta cédula ya está registrada en el sistema" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno al registrar paciente" }, { status: 500 });
  }
}