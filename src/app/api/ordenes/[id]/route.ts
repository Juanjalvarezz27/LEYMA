import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../app/api/auth/[...nextauth]/route";

// GET: Traer una sola orden para editarla
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const ordenId = parseInt(resolvedParams.id, 10);

    if (isNaN(ordenId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: {
        paciente: true,
        estado: { select: { nombre: true } },
        tipoDescuento: { select: { nombre: true } },
        detalles: {
          include: {
            prueba: {
              include: {
                subcategoria: {
                  include: {
                    categoria: true
                  }
                }
              }
            },
            tipoDescuento: { select: { nombre: true } }
          }
        },
        serviciosExtra: {
          include: {
            servicio: true
          }
        },
        notasSubcategoria: true
      }
    });

    if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    return NextResponse.json(orden);
  } catch (error: any) {
    return NextResponse.json({ error: `Error al cargar la orden: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}

// PUT: Actualizar la orden editada
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const ordenId = parseInt(resolvedParams.id, 10);
    const body = await req.json();

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
        metodoId: p.metodoId,
        montoUSD: parseFloat(montoEnUSD.toFixed(2)),
        montoBS: parseFloat(montoEnBS.toFixed(2)),
        referencia: p.referencia || null,
        fechaPago: new Date()
      };
    }) : [];

    // Uso de Transacción: Borramos los detalles viejos y metemos los nuevos
    const ordenActualizada = await prisma.$transaction(async (tx) => {
      // 1. Limpiar pruebas, servicios y PAGOS anteriores (para evitar pagos fantasmas si el monto bajó)
      await tx.detalleOrden.deleteMany({ where: { ordenId } });
      await tx.servicioEnOrden.deleteMany({ where: { ordenId } });
      await tx.pago.deleteMany({ where: { ordenId } });

      // 2. Actualizar totales, crear nuevas pruebas, servicios y los nuevos pagos
      return await tx.orden.update({
        where: { id: ordenId },
        data: {
          subtotalUSD: body.subtotalUSD,
          descuentoGeneral: body.descuentoGeneral || 0,
          tipoDescuentoId: body.descuentoGeneral > 0 ? getIdDescuento(body.tipoDescuentoGral) : null,
          totalUSD: body.totalUSD,
          totalBS: body.totalBS,
          tasaBCV: body.tasaBCV,
          detalles: {
            create: detallesData
          },
          serviciosExtra: body.serviciosExtra && body.serviciosExtra.length > 0 ? {
            create: body.serviciosExtra.map((s: any) => ({
              servicioId: s.servicioId,
              cantidad: s.cantidad || 1,
              precioCongeladoUSD: s.precioCongelado,
            }))
          } : undefined,
          pagos: pagosData.length > 0 ? {
            create: pagosData
          } : undefined
        }
      });
    });

    return NextResponse.json(ordenActualizada);
  } catch (error: any) {
    console.error("Error al actualizar la orden:", error);
    return NextResponse.json({ error: `Error interno al actualizar: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}