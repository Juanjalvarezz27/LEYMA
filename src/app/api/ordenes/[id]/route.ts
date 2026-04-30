import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

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
            prueba: true,
            tipoDescuento: { select: { nombre: true } }
          }
        }
      }
    });

    if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    return NextResponse.json(orden);
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar la orden" }, { status: 500 });
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

    // Uso de Transacción: Borramos los detalles viejos y metemos los nuevos
    const ordenActualizada = await prisma.$transaction(async (tx) => {
      // 1. Limpiar pruebas anteriores
      await tx.detalleOrden.deleteMany({ where: { ordenId } });

      // 2. Actualizar totales y crear nuevas pruebas
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
          }
        }
      });
    });

    return NextResponse.json(ordenActualizada);
  } catch (error) {
    console.error("Error al actualizar la orden:", error);
    return NextResponse.json({ error: "Error interno al actualizar" }, { status: 500 });
  }
}