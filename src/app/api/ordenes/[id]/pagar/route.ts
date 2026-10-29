import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../app/api/auth/[...nextauth]/route";

const parseId = (id: any) => isNaN(Number(id)) ? id : Number(id);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const ordenId = parseId(resolvedParams.id);

    if (!ordenId) {
      return NextResponse.json({ error: "ID de orden inválido" }, { status: 400 });
    }

    const body = await req.json();

    if (!body.pagos || body.pagos.length === 0) {
      return NextResponse.json({ error: "Debe enviar al menos un método de pago." }, { status: 400 });
    }

    const estadoCerrada = await prisma.estadoOrden.findUnique({ where: { nombre: "CERRADA" } });
    if (!estadoCerrada) return NextResponse.json({ error: "Estado CERRADA no configurado" }, { status: 500 });

    const ordenActual = await prisma.orden.findUnique({
      where: { id: ordenId as any },
      select: {
        id: true,
        subtotalUSD: true,
        descuentoGeneral: true,
        tipoDescuentoId: true,
        totalUSD: true,
        tasaBCV: true,
        pagos: { select: { montoUSD: true } }
      }
    });

    if (!ordenActual) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const tasa = Number(body.tasaBCV || ordenActual.tasaBCV);
    const subtotalUSD = Number(ordenActual.subtotalUSD);
    let nuevoTotalUSD = Number(ordenActual.totalUSD);
    let nuevoDescuentoGeneral = ordenActual.descuentoGeneral;
    let nuevoTipoDescuentoId = ordenActual.tipoDescuentoId;

    if (body.descuentoGeneral !== undefined && body.descuentoGeneral !== null) {
      const tiposDescuento = await prisma.tipoDescuento.findMany();
      const getIdDescuento = (nombreStr: string) => tiposDescuento.find(t => t.nombre === nombreStr)?.id || null;
      nuevoDescuentoGeneral = Number(body.descuentoGeneral) || 0;
      nuevoTipoDescuentoId = nuevoDescuentoGeneral > 0 ? getIdDescuento(body.tipoDescuentoGral || "PORCENTAJE") : null;
      
      const tipoNombre = body.tipoDescuentoGral || "PORCENTAJE";
      const montoDesc = tipoNombre === "PORCENTAJE" 
        ? (subtotalUSD * (nuevoDescuentoGeneral / 100))
        : nuevoDescuentoGeneral;
      nuevoTotalUSD = Number(Math.max(0, subtotalUSD - montoDesc).toFixed(2));
    }

    const pagosPreviosUSD = ordenActual.pagos.reduce((acc: number, p: any) => acc + Number(p.montoUSD), 0);
    const totalDeudaUSD = nuevoTotalUSD;

    const pagosData: any[] = [];
    let deudaPendienteUSD = Math.max(0, totalDeudaUSD - pagosPreviosUSD);

    for (const p of body.pagos) {
      if (deudaPendienteUSD <= 0) break;

      let montoEnUSD = p.moneda === "USD" ? p.monto : (p.monto / tasa);
      
      if (montoEnUSD > deudaPendienteUSD) {
        montoEnUSD = deudaPendienteUSD;
      }
      
      let montoEnBS = p.moneda === "BS" ? (montoEnUSD * tasa) : (montoEnUSD * tasa);
      if (p.moneda === "BS" && montoEnUSD < deudaPendienteUSD) {
         montoEnBS = p.monto;
      }

      pagosData.push({
        metodoId: parseId(p.metodoId),
        montoUSD: parseFloat(montoEnUSD.toFixed(2)),
        montoBS: parseFloat(montoEnBS.toFixed(2)),
        referencia: p.referencia || null
      });

      deudaPendienteUSD -= montoEnUSD;
    }

    const ordenActualizada = await prisma.orden.update({
      where: { id: ordenId as any },
      data: {
        estadoId: estadoCerrada.id,
        ...(body.descuentoGeneral !== undefined && body.descuentoGeneral !== null ? {
          descuentoGeneral: nuevoDescuentoGeneral,
          tipoDescuentoId: nuevoTipoDescuentoId,
          totalUSD: nuevoTotalUSD,
          totalBS: Number((nuevoTotalUSD * tasa).toFixed(2)),
          tasaBCV: tasa
        } : {}),
        pagos: {
          create: pagosData
        }
      }
    });

    return NextResponse.json({ success: true, orden: ordenActualizada });
  } catch (error: any) {
    console.error("Error al procesar pago:", error);
    return NextResponse.json({ error: `Error interno al procesar el pago: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}
