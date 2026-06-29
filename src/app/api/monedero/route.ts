import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCaracasTodayBounds, subtractDaysCaracas, getCaracasThisMonthBounds, getCaracasBoundsForDate, formatToCaracasDateString } from "../../../lib/dateUtils";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get("periodo") || "7DIAS";
    const inicioStr = searchParams.get("inicio");
    const finStr = searchParams.get("fin");
    
    const tasaParam = searchParams.get("tasa");
    const tasaBCV = tasaParam ? parseFloat(tasaParam) : 1; 

    let fechaInicio = new Date();
    let fechaFin = new Date();

    if (periodo === "HOY") {
      const bounds = getCaracasTodayBounds();
      fechaInicio = bounds.inicio;
      fechaFin = bounds.fin;
    } else if (periodo === "7DIAS") {
      const bounds = getCaracasBoundsForDate(subtractDaysCaracas(7));
      fechaInicio = bounds.inicio;
      fechaFin = getCaracasTodayBounds().fin;
    } else if (periodo === "30DIAS") {
      const bounds = getCaracasBoundsForDate(subtractDaysCaracas(30));
      fechaInicio = bounds.inicio;
      fechaFin = getCaracasTodayBounds().fin;
    } else if (periodo === "MES_ACTUAL") {
      const bounds = getCaracasThisMonthBounds();
      fechaInicio = bounds.inicio;
      fechaFin = bounds.fin;
    } else if (periodo === "CUSTOM" && inicioStr && finStr) {
      const boundInicio = getCaracasBoundsForDate(inicioStr);
      const boundFin = getCaracasBoundsForDate(finStr);
      fechaInicio = boundInicio.inicio;
      fechaFin = boundFin.fin;
    } else if (periodo === "HISTORICO") {
      fechaInicio = new Date("2000-01-01T00:00:00Z");
      fechaFin = new Date("2100-01-01T00:00:00Z");
    }

    // 1. OBTENER INGRESOS
    const ingresos = await prisma.orden.findMany({
      where: {
        fechaCreacion: { gte: fechaInicio, lte: fechaFin },
        estado: { nombre: "CERRADA" } 
      },
      include: { 
        paciente: { select: { nombreCompleto: true } },
        pagos: {
          include: { metodo: true }
        },
        tipoDescuento: true,
        detalles: {
          include: {
            tipoDescuento: true,
            prueba: { select: { nombre: true } }
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    // 2. OBTENER GASTOS
    const gastos = await prisma.gasto.findMany({
      where: { fechaGasto: { gte: fechaInicio, lte: fechaFin } },
      include: { registradoPor: { select: { nombre: true } }, metodo: true },
      orderBy: { fechaGasto: 'desc' }
    });

    // 3. MÉTODOS DE PAGO GENERALES
    const metodosPago = await prisma.metodoPago.findMany();

    // TOTALES USD Y BS
    let totalIngresosUSD = 0; let totalIngresosBS = 0;
    ingresos.forEach(i => {
      const usd = Number(i.totalUSD) || 0;
      totalIngresosUSD += usd;
      totalIngresosBS += Number(i.totalBS) || (usd * tasaBCV);
    });

    let totalGastosUSD = 0; let totalGastosBS = 0;
    gastos.forEach(g => {
      const usd = Number(g.montoUSD) || 0;
      totalGastosUSD += usd;
      totalGastosBS += Number(g.montoBS) || (usd * tasaBCV);
    });

    const balanceNetoUSD = totalIngresosUSD - totalGastosUSD;
    const balanceNetoBS = totalIngresosBS - totalGastosBS;

    // TENDENCIA DIARIA
    const conteoTendencia: Record<string, { ingresos: number; gastos: number }> = {};
    const diasDelPeriodo: string[] = [];
    let temporalDate = new Date(fechaInicio);
    
    const diferenciaDias = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24));
    
    if (diferenciaDias <= 60) {
      while (temporalDate <= fechaFin) {
        const key = formatToCaracasDateString(temporalDate);
        if (!diasDelPeriodo.includes(key)) diasDelPeriodo.push(key);
        if (!conteoTendencia[key]) conteoTendencia[key] = { ingresos: 0, gastos: 0 };
        temporalDate.setUTCHours(temporalDate.getUTCHours() + 24);
      }
    }

    ingresos.forEach(i => {
      const key = formatToCaracasDateString(i.fechaCreacion);
      if (conteoTendencia[key]) conteoTendencia[key].ingresos += (Number(i.totalUSD) || 0);
    });

    gastos.forEach(g => {
      const key = formatToCaracasDateString(g.fechaGasto);
      if (conteoTendencia[key]) conteoTendencia[key].gastos += (Number(g.montoUSD) || 0);
    });

    const graficoTendencia = diasDelPeriodo.map((fecha) => {
      const [year, month, day] = fecha.split("-");
      return {
        label: `${day}/${month}`,
        Ingresos: parseFloat(conteoTendencia[fecha]?.ingresos.toFixed(2) || "0"),
        Gastos: parseFloat(conteoTendencia[fecha]?.gastos.toFixed(2) || "0")
      };
    });

    // DISTRIBUCIÓN POR MÉTODO (GASTOS)
    const gastosPorMetodo: Record<string, number> = {};
    gastos.forEach(g => {
      const nombre = g.metodo.nombre;
      gastosPorMetodo[nombre] = (gastosPorMetodo[nombre] || 0) + (Number(g.montoUSD) || 0);
    });
    const graficoGastos = Object.entries(gastosPorMetodo).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // DISTRIBUCIÓN POR MÉTODO (INGRESOS)
    const ingresosPorMetodo: Record<string, number> = {};
    ingresos.forEach(i => {
      const nombreMetodo = i.pagos && i.pagos.length > 0 ? i.pagos[0].metodo.nombre : "EFECTIVO_USD";
      ingresosPorMetodo[nombreMetodo] = (ingresosPorMetodo[nombreMetodo] || 0) + (Number(i.totalUSD) || 0);
    });
    const graficoIngresos = Object.entries(ingresosPorMetodo).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // HISTORIAL (Solo mandamos los gastos para la tabla que pediste)
    const historialRaw = gastos.map(g => ({
      id: `gas-${g.id}`,
      tipo: 'GASTO',
      concepto: g.concepto,
      montoUSD: Number(g.montoUSD) || 0,
      montoBS: Number(g.montoBS) || 0,
      fecha: g.fechaGasto,
      metodo: g.metodo.nombre,
      responsable: g.registradoPor.nombre
    }));

    const historial = historialRaw.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    // HISTORIAL DESCUENTOS
    const historialDescuentosRaw: any[] = [];
    ingresos.forEach(orden => {
      // Descuento general
      if (orden.descuentoGeneral > 0) {
        let montoDescuentoUSD = Number(orden.descuentoGeneral) || 0;
        const motivo = orden.tipoDescuento?.nombre || 'Descuento General';
        if (motivo.toUpperCase().includes('PORCENTAJE') || motivo.toUpperCase() === '%') {
          const subtotal = Number(orden.subtotalUSD) || 0;
          montoDescuentoUSD = (subtotal * montoDescuentoUSD) / 100;
        }

        historialDescuentosRaw.push({
          id: `desc-gen-${orden.id}`,
          ordenId: orden.id,
          fecha: orden.fechaCreacion,
          paciente: orden.paciente.nombreCompleto,
          tipo: 'GENERAL',
          motivo: motivo,
          valorOriginal: orden.descuentoGeneral,
          montoUSD: montoDescuentoUSD,
          montoBS: montoDescuentoUSD * tasaBCV,
        });
      }
      
      // Descuentos por detalle
      if (orden.detalles) {
        orden.detalles.forEach(detalle => {
          if (detalle.descuento > 0) {
            let montoDescuentoUSD = Number(detalle.descuento) || 0;
            const motivo = detalle.tipoDescuento?.nombre || `Descuento en Prueba`;
            if (motivo.toUpperCase().includes('PORCENTAJE') || motivo.toUpperCase() === '%') {
              const precioTotal = (Number(detalle.precioCongeladoUSD) || 0) * (Number(detalle.cantidad) || 1);
              montoDescuentoUSD = (precioTotal * montoDescuentoUSD) / 100;
            }

            historialDescuentosRaw.push({
              id: `desc-det-${detalle.id}`,
              ordenId: orden.id,
              fecha: orden.fechaCreacion,
              paciente: orden.paciente.nombreCompleto,
              tipo: 'PRUEBA',
              motivo: motivo,
              detalleNombre: detalle.prueba?.nombre || 'Prueba',
              valorOriginal: detalle.descuento,
              montoUSD: montoDescuentoUSD,
              montoBS: montoDescuentoUSD * tasaBCV,
            });
          }
        });
      }
    });

    const historialDescuentos = historialDescuentosRaw.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    return NextResponse.json({
      tasaBCV,
      kpis: { totalIngresosUSD, totalIngresosBS, totalGastosUSD, totalGastosBS, balanceNetoUSD, balanceNetoBS },
      graficoTendencia,
      graficoGastos,
      graficoIngresos, 
      historial, // <-- Ahora es exclusivamente el histórico de los gastos del período
      historialDescuentos, // <-- Historial de descuentos
      metodosPago 
    });

  } catch (error: any) {
    console.error("Error al generar monedero:", error);
    return NextResponse.json({ error: `Error interno: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}