import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCaracasTodayBounds, getCaracasBoundsForDate } from "../../../lib/dateUtils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tasaParam = searchParams.get("tasa");
    const tasaBCV = tasaParam ? parseFloat(tasaParam) : 1;
    const periodo = searchParams.get("periodo") || "HOY";
    const inicioStr = searchParams.get("inicio");
    const finStr = searchParams.get("fin");

    let fechaInicio: Date;
    let fechaFin: Date;

    if (periodo === "CUSTOM" && inicioStr && finStr) {
      // Si mandan un rango custom
      fechaInicio = new Date(`${inicioStr}T00:00:00`);
      fechaFin = new Date(`${finStr}T23:59:59`);
    } else {
      // Rango estricto de HOY adaptado a Caracas
      const bounds = getCaracasTodayBounds();
      fechaInicio = bounds.inicio;
      fechaFin = bounds.fin;
    }

    // 1. VERIFICAR SI YA SE CERRÓ HOY
    const cierreDeHoy = await prisma.cierreCaja.findFirst({
      where: { fechaCierre: { gte: fechaInicio, lte: fechaFin } }
    });
    const yaCerroHoy = !!cierreDeHoy;

    // 2. OBTENER EL HISTORIAL COMPLETO DE CIERRES
    const historialCierres = await prisma.cierreCaja.findMany({
      orderBy: { fechaCierre: 'desc' },
      include: { realizadoPor: { select: { nombre: true } } }
    });

    // 3. OBTENER ÓRDENES Y SUS PAGOS (DEL PERÍODO)
    const ordenes = await prisma.orden.findMany({
      where: {
        fechaCreacion: { gte: fechaInicio, lte: fechaFin },
        estado: { nombre: { not: "ANULADA" } }
      },
      include: {
        paciente: { select: { nombreCompleto: true, cedula: true } },
        estado: true,
        creadoPor: { select: { nombre: true } },
        pagos: { include: { metodo: true } }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    // --- LÓGICA DE ARQUEO (SOLO INGRESOS) ---
    const metodosMap: Record<string, { ingresosUSD: number }> = {};
    let totalCuentasPorCobrarUSD = 0;

    ordenes.forEach(o => {
      const montoOrden = Number(o.totalUSD) || 0;

      // REGLA: Si la orden TIENE pagos registrados, va al Líquido Real
      if (o.pagos && o.pagos.length > 0) {
        o.pagos.forEach(p => {
          const m = p.metodo.nombre;
          if (!metodosMap[m]) metodosMap[m] = { ingresosUSD: 0 };
          metodosMap[m].ingresosUSD += Number(p.montoUSD) || 0;
        });
      } else {
        // REGLA: Si NO hay pagos, es dinero que NO ESTÁ EN LA CAJA, va a Por Cobrar
        totalCuentasPorCobrarUSD += montoOrden;
      }
    });

    let totalCajaUSD = 0;
    const desglosesCaja = Object.entries(metodosMap).map(([nombre, valores]) => {
      totalCajaUSD += valores.ingresosUSD;
      // Mantenemos netoUSD igual a ingresosUSD para compatibilidad con el modal
      return { nombre, ingresosUSD: valores.ingresosUSD, netoUSD: valores.ingresosUSD };
    });

    return NextResponse.json({
      yaCerroHoy,
      historialCierres,
      resumen: {
        totalEnCajaUSD: totalCajaUSD,
        totalEnCajaBS: totalCajaUSD * tasaBCV,
        cuentasPorCobrarUSD: totalCuentasPorCobrarUSD,
        cuentasPorCobrarBS: totalCuentasPorCobrarUSD * tasaBCV,
        pacientesAtendidos: ordenes.length
      },
      desglosesCaja,
      flujoPacientes: ordenes.map(o => ({
        ordenId: o.id,
        cedula: o.paciente.cedula,
        paciente: o.paciente.nombreCompleto,
        totalUSD: Number(o.totalUSD) || 0,
        totalBS: Number(o.totalBS) || ((Number(o.totalUSD) || 0) * tasaBCV),
        estadoPago: (o.pagos && o.pagos.length > 0) ? "PAGADO" : "PENDIENTE",
        registradoPor: o.creadoPor.nombre,
        metodoUsado: (o.pagos && o.pagos.length > 0) ? o.pagos[0].metodo.nombre : "NINGUNO"
      }))
    });

  } catch (error: any) {
    return NextResponse.json({ error: `Error interno: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarioSesion = await prisma.usuario.findUnique({ where: { correo: session.user.email } });
    if (!usuarioSesion) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const { totalCalculadoUSD, totalCalculadoBS, totalDeclaradoUSD, totalDeclaradoBS, observaciones, tasaBCV, desglose } = body;
    
    // Obtenemos el rango del día actual en Caracas
    const { inicio: fechaInicio } = getCaracasTodayBounds();

    const cierreExistente = await prisma.cierreCaja.findFirst({
      where: { fechaCierre: { gte: fechaInicio } }
    });

    if (cierreExistente) {
      return NextResponse.json({ error: "El turno de hoy ya fue cerrado." }, { status: 400 });
    }

    const ultimoCierre = await prisma.cierreCaja.findFirst({ orderBy: { fechaCierre: 'desc' } });
    const fechaApertura = ultimoCierre ? ultimoCierre.fechaCierre : fechaInicio;

    const descuadreUSD = parseFloat(totalDeclaradoUSD) - parseFloat(totalCalculadoUSD);
    const descuadreBS = parseFloat(totalDeclaradoBS) - parseFloat(totalCalculadoBS);

    const nuevoCierre = await prisma.cierreCaja.create({
      data: {
        usuarioId: usuarioSesion.id,
        fechaApertura,
        totalCalculadoUSD: parseFloat(totalCalculadoUSD),
        totalCalculadoBS: parseFloat(totalCalculadoBS),
        totalDeclaradoUSD: parseFloat(totalDeclaradoUSD),
        totalDeclaradoBS: parseFloat(totalDeclaradoBS),
        descuadreUSD,
        descuadreBS,
        tasaBCV: parseFloat(tasaBCV),
        observaciones,
        desgloseMetodos: JSON.stringify(desglose)
      }
    });

    return NextResponse.json({ success: true, cierre: nuevoCierre });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al cerrar caja: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clave = searchParams.get("clave");

    if (!id || !clave) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    if (clave !== process.env.CLAVE_MAESTRA) {
      return NextResponse.json({ error: "Clave maestra incorrecta" }, { status: 401 });
    }

    await prisma.cierreCaja.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: `Error al anular cierre: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}