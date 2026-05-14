import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cedula = searchParams.get("cedula");

  if (!cedula) return NextResponse.json({ error: "Cédula no proporcionada" }, { status: 400 });

  try {
    const paciente = await prisma.paciente.findUnique({ where: { cedula } });
    return NextResponse.json(paciente || null);
  } catch (error) {
    return NextResponse.json({ error: "Error al buscar el paciente" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // VALIDACIÓN ROBUSTA: Si no es bebé, la cédula debe tener texto real
    const cedulaLimpia = body.cedula?.trim();
    if (!body.esBebe && !cedulaLimpia) {
      return NextResponse.json({ error: "La cédula es obligatoria para adultos" }, { status: 400 });
    }

    const nuevoPaciente = await prisma.paciente.create({
      data: {
        // Si es bebe o la cedula esta vacia, guardamos NULL para no romper el Unique de la DB
        cedula: (body.esBebe || !cedulaLimpia) ? null : cedulaLimpia,
        nombreCompleto: body.nombreCompleto.toUpperCase(),
        fechaNacimiento: new Date(body.fechaNacimiento),
        esBebe: body.esBebe,
        sexo: body.sexo,
        telefono: body.telefono || null,
        correo: body.correo?.toLowerCase() || null,
        direccion: body.direccion || null,
        observaciones: body.observaciones || null,
      }
    });

    return NextResponse.json(nuevoPaciente);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Esta cédula ya está registrada" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno al registrar paciente" }, { status: 500 });
  }
}