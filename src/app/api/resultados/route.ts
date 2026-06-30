import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarioSesion = await prisma.usuario.findUnique({ where: { correo: session.user.email } });
    if (!usuarioSesion) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();
    const { ordenId, resultados, accion, pin, bioanalistaId, notasSubcategoria } = body; 

    if (!ordenId || !resultados || resultados.length === 0) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    let validadorId = usuarioSesion.id;
    let validacionActiva = false;

    if (accion === "EDITAR") {
      if (!pin) return NextResponse.json({ error: "Falta la clave maestra." }, { status: 400 });
      if (pin !== process.env.CLAVE_MAESTRA) {
        return NextResponse.json({ error: "Clave maestra incorrecta." }, { status: 403 });
      }
      validacionActiva = true;
    } else if (accion === "FIRMAR") {
      if (!pin || !bioanalistaId) return NextResponse.json({ error: "Faltan credenciales de validación." }, { status: 400 });
      
      const bioanalista = await prisma.usuario.findFirst({ 
        where: { id: bioanalistaId, pinFirma: pin, activo: true } 
      });
      
      if (!bioanalista) return NextResponse.json({ error: "PIN incorrecto para la bioanalista seleccionada." }, { status: 403 });
      
      validadorId = bioanalista.id;
      validacionActiva = true;
    }

    await prisma.$transaction(async (tx) => {
      // Optimizacion: buscar todos los resultados actuales de una sola vez
      const detalleIds = resultados.map((r: any) => r.detalleOrdenId);
      const existingResultsList = await tx.resultadoPrueba.findMany({
        where: { detalleOrdenId: { in: detalleIds } }
      });
      const existingResultsMap = new Map(existingResultsList.map(r => [r.detalleOrdenId, r]));

      for (const res of resultados) {
        const currentRes = existingResultsMap.get(res.detalleOrdenId);
        
        // Si ya está firmado por completo y no es edición, NO LO TOCAMOS
        if (currentRes?.firmado && accion !== "EDITAR") continue;

        // Determinamos si ESTE examen específico debe ser firmado en esta pasada
        // Si es edición, permitiremos que todos los enviados se guarden sin cambiar las firmas originales
        const debeFirmarEste = validacionActiva && (res.marcadoParaFirma || accion === "EDITAR");

        const nextUsuarioId = accion === "EDITAR" ? (currentRes?.usuarioId || usuarioSesion.id) : (debeFirmarEste ? validadorId : (currentRes?.usuarioId || usuarioSesion.id));
        const nextFirmado = accion === "EDITAR" ? (currentRes?.firmado ?? true) : (debeFirmarEste ? true : (currentRes?.firmado || false));
        const nextFecha = accion === "EDITAR" ? (currentRes?.fechaProcesado || new Date()) : (debeFirmarEste ? new Date() : (currentRes?.fechaProcesado || new Date()));

        await tx.resultadoPrueba.upsert({
          where: { detalleOrdenId: res.detalleOrdenId },
          update: {
            observaciones: res.observaciones || null,
            valoresReferencia: res.valoresReferencia || null,
            usuarioId: nextUsuarioId,
            firmado: nextFirmado,
            fechaProcesado: nextFecha,
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
            usuarioId: nextUsuarioId,
            firmado: nextFirmado,
            observaciones: res.observaciones || null,
            valoresReferencia: res.valoresReferencia || null,
            fechaProcesado: nextFecha,
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

      // Procesar notas por subcategoría si vienen en el payload
      if (notasSubcategoria && notasSubcategoria.length > 0) {
        for (const ns of notasSubcategoria) {
          if (!ns.nota || ns.nota.trim() === '') {
            // Si la nota está vacía, la eliminamos si existe
            await tx.notaSubcategoriaOrden.deleteMany({
              where: { ordenId: ordenId, subcategoria: ns.subcategoria }
            });
          } else {
            // Si tiene texto, hacemos upsert
            await tx.notaSubcategoriaOrden.upsert({
              where: { 
                ordenId_subcategoria: { ordenId: ordenId, subcategoria: ns.subcategoria } 
              },
              update: { nota: ns.nota },
              create: { ordenId: ordenId, subcategoria: ns.subcategoria, nota: ns.nota }
            });
          }
        }
      }
    }, {
      maxWait: 15000,
      timeout: 60000
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al guardar resultados:", error);
    return NextResponse.json({ error: `Error interno al procesar los resultados: ${error?.message || 'Desconocido'}` }, { status: 500 });
  }
}