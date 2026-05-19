import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get("periodo") || "HOY";
    const inicioStr = searchParams.get("inicio");
    const finStr = searchParams.get("fin");
    const tasaParam = searchParams.get("tasa");
    const tasaBCV = tasaParam ? parseFloat(tasaParam) : 1;

    const ahora = new Date();
    let fechaInicio = new Date();
    let fechaFin = new Date();

    if (periodo === "HOY") {
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin.setHours(23, 59, 59, 999);
    } else if (periodo === "CUSTOM" && inicioStr && finStr) {
      fechaInicio = new Date(`${inicioStr}T00:00:00`);
      fechaFin = new Date(`${finStr}T23:59:59`);
    } else {
      // Por defecto para cierres, forzamos a HOY si seleccionan otra cosa, ya que un cierre es diario
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin.setHours(23, 59, 59, 999);
    }

    // 1. TODAS LAS ÓRDENES (Para ver pacientes y cuentas por cobrar)
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

    // 2. TODOS LOS GASTOS (Para restarlos del efectivo en caja)
    const gastos = await prisma.gasto.findMany({
      where: { fechaGasto: { gte: fechaInicio, lte: fechaFin } },
      include: { metodo: true }
    });

    // 3. OBTENER ÚLTIMO CIERRE
    const ultimoCierre = await prisma.cierreCaja.findFirst({
      orderBy: { fechaCierre: 'desc' },
      include: { realizadoPor: { select: { nombre: true } } }
    });

    // --- CÁLCULO ESTRICTO DE ARQUEO ---
    const arqueoPorMetodo: Record<string, { nombre: string, ingresosUSD: number, ingresosBS: number, gastosUSD: number, gastosBS: number, netoUSD: number, netoBS: number }> = {};
    let totalCuentasPorCobrarUSD = 0;
    let totalCuentasPorCobrarBS = 0;

    // A. Sumar Pagos Reales
    ordenes.forEach(orden => {
      // Si la orden NO está cerrada, el dinero aún no ha entrado, es cuenta por cobrar
      if (orden.estado.nombre !== "CERRADA") {
        totalCuentasPorCobrarUSD += Number(orden.totalUSD) || 0;
        totalCuentasPorCobrarBS += Number(orden.totalBS) || 0;
      } 
      
      // Si tiene pagos registrados, los sumamos al arqueo de ese método
      if (orden.pagos && orden.pagos.length > 0) {
        orden.pagos.forEach(pago => {
          const m = pago.metodo.nombre;
          if (!arqueoPorMetodo[m]) arqueoPorMetodo[m] = { nombre: m, ingresosUSD: 0, ingresosBS: 0, gastosUSD: 0, gastosBS: 0, netoUSD: 0, netoBS: 0 };
          
          arqueoPorMetodo[m].ingresosUSD += Number(pago.montoUSD) || 0;
          arqueoPorMetodo[m].ingresosBS += Number(pago.montoBS) || 0;
        });
      }
    });

    // B. Restar Gastos Reales
    gastos.forEach(gasto => {
      const m = gasto.metodo.nombre;
      if (!arqueoPorMetodo[m]) arqueoPorMetodo[m] = { nombre: m, ingresosUSD: 0, ingresosBS: 0, gastosUSD: 0, gastosBS: 0, netoUSD: 0, netoBS: 0 };
      
      arqueoPorMetodo[m].gastosUSD += Number(gasto.montoUSD) || 0;
      arqueoPorMetodo[m].gastosBS += Number(gasto.montoBS) || 0;
    });

    // C. Calcular Netos Totales y por Método
    let totalCajaFisicaUSD = 0;
    let totalCajaFisicaBS = 0;
    
    const desglosesCaja = Object.values(arqueoPorMetodo).map(metodo => {
      metodo.netoUSD = parseFloat((metodo.ingresosUSD - metodo.gastosUSD).toFixed(2));
      metodo.netoBS = parseFloat((metodo.ingresosBS - metodo.gastosBS).toFixed(2));
      
      totalCajaFisicaUSD += metodo.netoUSD;
      totalCajaFisicaBS += metodo.netoBS;
      
      return metodo;
    }).sort((a, b) => b.netoUSD - a.netoUSD);

    // --- FLUJO DE PACIENTES ---
    const flujoPacientes = ordenes.map(o => {
      let estadoPago = o.estado.nombre === "CERRADA" ? "PAGADO" : "PENDIENTE";
      return {
        ordenId: o.id,
        cedula: o.paciente.cedula || "N/P",
        paciente: o.paciente.nombreCompleto,
        totalUSD: Number(o.totalUSD) || 0,
        totalBS: Number(o.totalBS) || 0,
        estadoPago,
        registradoPor: o.creadoPor.nombre,
        metodoUsado: o.pagos && o.pagos.length > 0 ? o.pagos[0].metodo.nombre : "NINGUNO"
      };
    });

    return NextResponse.json({
      tasaBCV,
      resumen: {
        totalEnCajaUSD: totalCajaFisicaUSD,
        totalEnCajaBS: totalCajaFisicaBS,
        cuentasPorCobrarUSD: totalCuentasPorCobrarUSD,
        cuentasPorCobrarBS: totalCuentasPorCobrarBS,
        pacientesAtendidos: ordenes.length
      },
      ultimoCierre: ultimoCierre ? {
        fecha: ultimoCierre.fechaCierre,
        por: ultimoCierre.realizadoPor.nombre,
        monto: ultimoCierre.totalCalculadoUSD
      } : null,
      desglosesCaja,
      flujoPacientes
    });

  } catch (error) {
    console.error("Error en Cierre:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ENDPOINT PARA EJECUTAR EL CIERRE
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { totalCalculadoUSD, totalCalculadoBS, totalDeclaradoUSD, totalDeclaradoBS, observaciones, tasaBCV, desglose } = body;

    // Asignar al admin principal (sustituir por sesión real si la tienes)
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