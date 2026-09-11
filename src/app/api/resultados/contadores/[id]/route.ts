import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ordenId = parseInt(id, 10);
    if (isNaN(ordenId)) {
      return NextResponse.json({ error: "ID de orden inválido." }, { status: 400 });
    }

    const { tipo } = await req.json();
    if (tipo !== "IMPRESION" && tipo !== "WHATSAPP") {
      return NextResponse.json({ error: "Tipo inválido. Use IMPRESION o WHATSAPP." }, { status: 400 });
    }

    const campo = tipo === "IMPRESION" ? "contadorImpresiones" : "contadorWhatsApp";

    const orden = await prisma.orden.update({
      where: { id: ordenId },
      data: { [campo]: { increment: 1 } },
      select: { contadorImpresiones: true, contadorWhatsApp: true }
    });

    return NextResponse.json(orden);
  } catch (error: any) {
    return NextResponse.json({ error: `Error al actualizar contador: ${error?.message || "Desconocido"}` }, { status: 500 });
  }
}
