import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCaracasTodayBounds, subtractDaysCaracas, getCaracasThisMonthBounds, getCaracasBoundsForDate, formatToCaracasDateString } from "../../../lib/dateUtils";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get("periodo") || "7DIAS";
    const inicioStr = searchParams.get("inicio");
    const finStr = searchParams.get("fin");

    const ahora = new Date(); // Utilizado abajo para la edad, se deja
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
    }

    const ordenes = await prisma.orden.findMany({
      where: {
        fechaCreacion: { 
          gte: fechaInicio,
          lte: fechaFin
        },
        estado: { nombre: { not: "ANULADA" } }
      },
      include: {
        paciente: true,
        estado: true,
        detalles: {
          include: {
            resultado: true,
            prueba: {
              include: {
                subcategoria: {
                  include: {
                    categoria: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { fechaCreacion: "asc" }
    });

    let totalOrdenes = ordenes.length;
    let ordenesCompletadas = 0;
    let totalPruebasProcesadas = 0;
    const pacientesUnicosSet = new Set<string>();

    let pruebasValidadas = 0;
    let pruebasEnRevision = 0;
    let pruebasPendientes = 0;

    const distribucionSexo = { M: 0, F: 0 };
    const distribucionEdad = {
      "Bebés (0-2)": 0,
      "Niños (3-12)": 0,
      "Adultos (13-59)": 0,
      "Mayor (60+)": 0
    };

    const conteoCategorias: Record<string, number> = {};
    const conteoPruebas: Record<string, number> = {};
    const conteoTendencia: Record<string, { ordenes: number; pruebas: number }> = {};
    
    const conteoEstados: Record<string, number> = {};

    const diasDelPeriodo: string[] = [];
    let temporalDate = new Date(fechaInicio);
    
    // Si el rango es de menos de 60 días, agrupamos por días para la gráfica
    const diferenciaDias = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24));
    
    if (diferenciaDias <= 60) {
      while (temporalDate <= fechaFin) {
        const key = formatToCaracasDateString(temporalDate);
        if (!diasDelPeriodo.includes(key)) diasDelPeriodo.push(key);
        if (!conteoTendencia[key]) conteoTendencia[key] = { ordenes: 0, pruebas: 0 };
        temporalDate.setUTCHours(temporalDate.getUTCHours() + 24);
      }
    }

    ordenes.forEach((orden) => {
      if (orden.resultadosCompletados) ordenesCompletadas++;
      
      const fechaKey = formatToCaracasDateString(orden.fechaCreacion);
      pacientesUnicosSet.add(orden.pacienteId);

      if (conteoTendencia[fechaKey]) {
        conteoTendencia[fechaKey].ordenes += 1;
      }

      const estadoNombre = orden.estado?.nombre || "Desconocido";
      conteoEstados[estadoNombre] = (conteoEstados[estadoNombre] || 0) + 1;

      if (orden.paciente.sexo === "M" || orden.paciente.sexo === "F") {
        distribucionSexo[orden.paciente.sexo] += 1;
      }

      const nacimiento = new Date(orden.paciente.fechaNacimiento);
      let edad = ahora.getFullYear() - nacimiento.getFullYear();
      const m = ahora.getMonth() - nacimiento.getMonth();
      if (m < 0 || (m === 0 && ahora.getDate() < nacimiento.getDate())) {
        edad--;
      }

      if (orden.paciente.esBebe || edad <= 2) {
        distribucionEdad["Bebés (0-2)"] += 1;
      } else if (edad <= 12) {
        distribucionEdad["Niños (3-12)"] += 1;
      } else if (edad <= 59) {
        distribucionEdad["Adultos (13-59)"] += 1;
      } else {
        distribucionEdad["Mayor (60+)"] += 1;
      }

      orden.detalles.forEach((detalle) => {
        totalPruebasProcesadas += detalle.cantidad;

        if (!detalle.resultado) {
          pruebasPendientes += detalle.cantidad;
        } else if (detalle.resultado.firmado) {
          pruebasValidadas += detalle.cantidad;
        } else {
          pruebasEnRevision += detalle.cantidad;
        }

        if (conteoTendencia[fechaKey]) {
          conteoTendencia[fechaKey].pruebas += detalle.cantidad;
        }

        const catNombre = detalle.prueba?.subcategoria?.categoria?.nombre || "OTROS";
        conteoCategorias[catNombre] = (conteoCategorias[catNombre] || 0) + detalle.cantidad;

        const pruebaNombre = detalle.prueba?.nombre || "DESCONOCIDO";
        conteoPruebas[pruebaNombre] = (conteoPruebas[pruebaNombre] || 0) + detalle.cantidad;
      });
    });

    const graficoTendencia = diasDelPeriodo.map((fecha) => {
      const [year, month, day] = fecha.split("-");
      return {
        label: `${day}/${month}`,
        Pacientes: conteoTendencia[fecha]?.ordenes || 0,
        Pruebas: conteoTendencia[fecha]?.pruebas || 0
      };
    });

    const graficoSexo = [
      { name: "Masculino", value: distribucionSexo.M },
      { name: "Femenino", value: distribucionSexo.F }
    ];

    const graficoEdad = Object.entries(distribucionEdad).map(([name, value]) => ({ name, value }));
    const graficoCategorias = Object.entries(conteoCategorias).map(([name, value]) => ({ name, value }));
    const graficoEstados = Object.entries(conteoEstados).map(([name, value]) => ({ name, value }));

    const topPruebas = Object.entries(conteoPruebas)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    const topCategorias = Object.entries(conteoCategorias)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // NUEVO KPI: Tasa de Procesamiento (Órdenes Completadas / Total)
    const tasaProcesamiento = totalOrdenes > 0 ? Math.round((ordenesCompletadas / totalOrdenes) * 100) : 0;
    
    const graficoControlCalidad = [
      { name: "Validadas (QC)", value: pruebasValidadas },
      { name: "En Revisión", value: pruebasEnRevision },
      { name: "Pendientes", value: pruebasPendientes }
    ];

    return NextResponse.json({
      kpis: {
        totalOrdenes,
        pacientesUnicos: pacientesUnicosSet.size,
        totalPruebas: totalPruebasProcesadas,
        tasaProcesamiento
      },
      graficoTendencia,
      graficoSexo,
      graficoEdad,
      graficoCategorias,
      topPruebas,
      topCategorias,
      graficoEstados,
      graficoControlCalidad
    });

  } catch (error) {
    console.error("Error al generar estadísticas:", error);
    return NextResponse.json({ error: "Error interno en el servidor analítico" }, { status: 500 });
  }
}