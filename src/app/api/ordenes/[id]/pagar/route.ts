import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();
const parseId = (id: any) => isNaN(Number(id)) ? id : Number(id);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const ordenId = parseId(resolvedParams.id); // <-- CORREGIDO

    if (!ordenId) {
      return NextResponse.json({ error: "ID de orden inválido" }, { status: 400 });
    }

    const body = await req.json();

    if (!body.pagos || body.pagos.length === 0) {
      return NextResponse.json({ error: "Debe enviar al menos un método de pago." }, { status: 400 });
    }

    const estadoCerrada = await prisma.estadoOrden.findUnique({ where: { nombre: "CERRADA" } });
    if (!estadoCerrada) return NextResponse.json({ error: "Estado CERRADA no configurado" }, { status: 500 });

    const pagosData = body.pagos.map((p: any) => {
      const montoEnUSD = p.moneda === "USD" ? p.monto : (p.monto / body.tasaBCV);
      const montoEnBS = p.moneda === "BS" ? p.monto : (p.monto * body.tasaBCV);

      return {
        metodoId: parseId(p.metodoId), // <-- CORREGIDO
        montoUSD: parseFloat(montoEnUSD.toFixed(2)),
        montoBS: parseFloat(montoEnBS.toFixed(2)),
        referencia: p.referencia || null
      };
    });

    const ordenActualizada = await prisma.orden.update({
      where: { id: ordenId as any },
      data: {
        estadoId: estadoCerrada.id,
        pagos: {
          create: pagosData
        }
      }
    });

    return NextResponse.json({ success: true, orden: ordenActualizada });
  } catch (error) {
    console.error("Error al procesar pago:", error);
    return NextResponse.json({ error: "Error interno al procesar el pago" }, { status: 500 });
  }
}