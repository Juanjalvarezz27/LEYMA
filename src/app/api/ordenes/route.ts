import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// Función de utilidad para obtener la hora exacta de Venezuela (UTC-4)
const getHoraCaracas = (): Date => {
  const ahora = new Date();
  // Formateamos la fecha a la zona horaria de Caracas
  const caracasString = ahora.toLocaleString('en-US', { timeZone: 'America/Caracas' });
  return new Date(caracasString);
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "No autorizado. Inicie sesión." }, { status: 401 });
    }

    const usuarioId = (session.user as any).id;
    const body = await req.json();

    if (!body.pacienteId) {
      return NextResponse.json({ error: "El ID del paciente es obligatorio" }, { status: 400 });
    }
    if (!body.pruebas || body.pruebas.length === 0) {
      return NextResponse.json({ error: "La orden debe tener al menos una prueba" }, { status: 400 });
    }

    const estado = await prisma.estadoOrden.findUnique({ where: { nombre: body.estado } });
    if (!estado) return NextResponse.json({ error: `El estado ${body.estado} no está en la BD` }, { status: 400 });

    const tiposDescuento = await prisma.tipoDescuento.findMany();
    const getIdDescuento = (nombreStr: string) => tiposDescuento.find(t => t.nombre === nombreStr)?.id || null;

    const detallesData = body.pruebas.map((p: any) => ({
      pruebaId: p.pruebaId,
      cantidad: p.cantidad,
      precioCongeladoUSD: p.precioCongelado, 
      descuento: p.descuentoInd || 0,        
      tipoDescuentoId: p.descuentoInd > 0 ? getIdDescuento(p.tipoDescuentoInd) : null,
    }));

    const tasa = body.tasaBCV;
    const pagosData = body.pagos && body.pagos.length > 0 ? body.pagos.map((p: any) => {
      const montoEnUSD = p.moneda === "USD" ? p.monto : (p.monto / tasa);
      const montoEnBS = p.moneda === "BS" ? p.monto : (p.monto * tasa);
      
      return {
        metodoId: parseInt(p.metodoId, 10), 
        montoUSD: parseFloat(montoEnUSD.toFixed(2)),
        montoBS: parseFloat(montoEnBS.toFixed(2)),
        referencia: p.referencia || null,
        fechaPago: getHoraCaracas() // <-- Obligamos a que el pago tenga la hora de VZLA
      };
    }) : [];

    const horaVenezuela = getHoraCaracas(); // Obtenemos la hora local

    const nuevaOrden = await prisma.orden.create({
      data: {
        pacienteId: body.pacienteId,
        usuarioId: usuarioId, 
        estadoId: estado.id,
        subtotalUSD: body.subtotalUSD,
        descuentoGeneral: body.descuentoGeneral || 0,
        tipoDescuentoId: body.descuentoGeneral > 0 ? getIdDescuento(body.tipoDescuentoGral) : null,
        totalUSD: body.totalUSD,
        totalBS: body.totalBS,
        tasaBCV: body.tasaBCV,
        fechaCreacion: horaVenezuela, 
        detalles: {
          create: detallesData
        },
        pagos: pagosData.length > 0 ? {
          create: pagosData
        } : undefined
      }
    });

    return NextResponse.json(nuevaOrden, { status: 201 });
  } catch (error) {
    console.error("Error al crear la orden:", error);
    return NextResponse.json({ error: "Error interno al guardar la orden" }, { status: 500 });
  }
}