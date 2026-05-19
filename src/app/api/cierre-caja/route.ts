import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tasaParam = searchParams.get("tasa");
    const tasaBCV = tasaParam ? parseFloat(tasaParam) : 1;

    // Rango estricto de HOY
    const fechaInicio = new Date();
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date();
    fechaFin.setHours(23, 59, 59, 999);

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

    // 3. OBTENER ÓRDENES Y SUS PAGOS (DEL DÍA ACTUAL)
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

    // 4. OBTENER GASTOS DEL DÍA
    const gastos = await prisma.gasto.findMany({
      where: { fechaGasto: { gte: fechaInicio, lte: fechaFin } },
      include: { metodo: true }
    });

    // --- LÓGICA DE ARQUEO ESTRICTA ---
    const metodosMap: Record<string, { ingresosUSD: number; gastosUSD: number }> = {};
    let totalCuentasPorCobrarUSD = 0;

    ordenes.forEach(o => {
      const montoOrden = Number(o.totalUSD) || 0;
      
      // REGLA: Si la orden TIENE pagos registrados, va al Líquido Real
      if (o.pagos && o.pagos.length > 0) {
        o.pagos.forEach(p => {
          const m = p.metodo.nombre;
          if (!metodosMap[m]) metodosMap[m] = { ingresosUSD: 0, gastosUSD: 0 };
          metodosMap[m].ingresosUSD += Number(p.montoUSD) || 0;
        });
      } else {
        // REGLA: Si NO hay pagos, es dinero que NO ESTÁ EN LA CAJA, va a Por Cobrar
        totalCuentasPorCobrarUSD += montoOrden;
      }
    });

    gastos.forEach(g => {
      const m = g.metodo.nombre;
      if (!metodosMap[m]) metodosMap[m] = { ingresosUSD: 0, gastosUSD: 0 };
      metodosMap[m].gastosUSD += Number(g.montoUSD) || 0;
    });

    let totalCajaUSD = 0;
    const desglosesCaja = Object.entries(metodosMap).map(([nombre, valores]) => {
      const neto = valores.ingresosUSD - valores.gastosUSD;
      totalCajaUSD += neto;
      return { nombre, ...valores, netoUSD: neto };
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
        // Evitamos el NaN calculando los Bs si la BD los trae vacíos
        totalBS: Number(o.totalBS) || ((Number(o.totalUSD) || 0) * tasaBCV),
        // Si no tiene pagos, forzamos estado a PENDIENTE
        estadoPago: (o.pagos && o.pagos.length > 0) ? "PAGADO" : "PENDIENTE",
        registradoPor: o.creadoPor.nombre,
        metodoUsado: (o.pagos && o.pagos.length > 0) ? o.pagos[0].metodo.nombre : "NINGUNO"
      }))
    });

  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { totalCalculadoUSD, totalCalculadoBS, totalDeclaradoUSD, totalDeclaradoBS, observaciones, tasaBCV, desglose } = body;

    const fechaInicio = new Date();
    fechaInicio.setHours(0, 0, 0, 0);
    const cierreExistente = await prisma.cierreCaja.findFirst({
      where: { fechaCierre: { gte: fechaInicio } }
    });

    if (cierreExistente) {
      return NextResponse.json({ error: "El turno de hoy ya fue cerrado." }, { status: 400 });
    }

    const admin = await prisma.usuario.findFirst({ where: { rol: { nombre: "ADMIN" } } });
    if (!admin) return NextResponse.json({ error: "No hay admin" }, { status: 400 });

    const ultimoCierre = await prisma.cierreCaja.findFirst({ orderBy: { fechaCierre: 'desc' } });
    const fechaApertura = ultimoCierre ? ultimoCierre.fechaCierre : new Date(new Date().setHours(0,0,0,0));

    const descuadreUSD = parseFloat(totalDeclaradoUSD) - parseFloat(totalCalculadoUSD);
    const descuadreBS = parseFloat(totalDeclaradoBS) - parseFloat(totalCalculadoBS);

    const nuevoCierre = await prisma.cierreCaja.create({
      data: {
        usuarioId: admin.id,
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
  } catch (error) {
    return NextResponse.json({ error: "Error al cerrar caja" }, { status: 500 });
  }
}