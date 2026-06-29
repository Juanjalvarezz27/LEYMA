import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || searchParams.get("cedula");

  if (!q) return NextResponse.json({ error: "Término de búsqueda no proporcionado" }, { status: 400 });

  try {
    const pacientes = await prisma.paciente.findMany({
      where: {
        OR: [
          { cedula: { contains: q } },
          { nombreCompleto: { contains: q, mode: "insensitive" } }
        ]
      },
      take: 10,
      orderBy: { nombreCompleto: "asc" }
    });
    return NextResponse.json(pacientes);
  } catch (error: any) {
    return NextResponse.json({ error: `Error al buscar pacientes: ${error?.message || 'Desconocido'}` }, { status: 500 });
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

    const fechaNacimiento = new Date(body.fechaNacimiento);
    if (isNaN(fechaNacimiento.getTime())) {
      return NextResponse.json({ error: "La fecha de nacimiento proporcionada es inválida." }, { status: 400 });
    }

    const nuevoPaciente = await prisma.paciente.create({
      data: {
        // Si es bebe o la cedula esta vacia, guardamos NULL para no romper el Unique de la DB
        cedula: (body.esBebe || !cedulaLimpia) ? null : cedulaLimpia,
        nombreCompleto: body.nombreCompleto.toUpperCase(),
        fechaNacimiento: fechaNacimiento,
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
    console.error("ERROR POST /api/pacientes:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: `Esta cédula ya está registrada: ${error?.message || 'Desconocido'}` }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno al registrar paciente", details: error.message }, { status: 500 });
  }
}