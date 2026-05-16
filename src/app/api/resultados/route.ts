import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarioSesion = await prisma.usuario.findUnique({ where: { correo: session.user.email } });
    if (!usuarioSesion) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();
    const { ordenId, resultados, accion, pin, bioanalistaId } = body; 

    if (!ordenId || !resultados || resultados.length === 0) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    let validadorId = usuarioSesion.id;
    let validacionActiva = false;

    // Si la acción es FIRMAR, verificamos quién es la bioanalista y si su PIN es correcto
    if (accion === "FIRMAR") {
      if (!pin || !bioanalistaId) return NextResponse.json({ error: "Faltan credenciales de validación." }, { status: 400 });
      
      const bioanalista = await prisma.usuario.findFirst({ 
        where: { id: bioanalistaId, pinFirma: pin, activo: true } 
      });
      
      if (!bioanalista) return NextResponse.json({ error: "PIN incorrecto para la bioanalista seleccionada." }, { status: 403 });
      
      validadorId = bioanalista.id;
      validacionActiva = true;
    }

    await prisma.$transaction(async (tx) => {
      for (const res of resultados) {
        const currentRes = await tx.resultadoPrueba.findUnique({ where: { detalleOrdenId: res.detalleOrdenId } });
        
        // Si ya está firmado por completo, NO LO TOCAMOS
        if (currentRes?.firmado) continue;

        // Determinamos si ESTE examen específico debe ser firmado en esta pasada
        const debeFirmarEste = validacionActiva && res.marcadoParaFirma;

        await tx.resultadoPrueba.upsert({
          where: { detalleOrdenId: res.detalleOrdenId },
          update: {
            observaciones: res.observaciones || null,
            usuarioId: debeFirmarEste ? validadorId : (currentRes?.usuarioId || usuarioSesion.id),
            firmado: debeFirmarEste ? true : (currentRes?.firmado || false),
            fechaProcesado: debeFirmarEste ? new Date() : (currentRes?.fechaProcesado || new Date()),
            valores: {
              deleteMany: {}, 
              create: res.valores.map((v: any) => ({
                pruebaId: v.pruebaId,
                valorIngresado: v.valorIngresado
              }))
            }
          },
          create: {
            detalleOrdenId: res.detalleOrdenId,
            usuarioId: debeFirmarEste ? validadorId : usuarioSesion.id,
            firmado: debeFirmarEste,
            observaciones: res.observaciones || null,
            fechaProcesado: new Date(),
            valores: {
              create: res.valores.map((v: any) => ({
                pruebaId: v.pruebaId,
                valorIngresado: v.valorIngresado
              }))
            }
          }
        });
      }

      // Verificamos si absolutamente TODOS los detalles de la orden ya están FIRMADOS
      const allDetalles = await tx.detalleOrden.findMany({
        where: { ordenId },
        include: { resultado: true }
      });
      
      const allSigned = allDetalles.length > 0 && allDetalles.every(d => d.resultado?.firmado === true);

      // Actualizar estado de la orden
      await tx.orden.update({
        where: { id: ordenId },
        data: { resultadosCompletados: allSigned }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al guardar resultados:", error);
    return NextResponse.json({ error: "Error interno al procesar los resultados" }, { status: 500 });
  }
}