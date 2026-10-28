import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import React from "react";
import ReporteDocumentServer from "../../../../components/resultados/ReporteDocumentServer";

// Caché en memoria de buffers para responder en 1ms en peticiones repetidas a la misma instancia
const pdfBufferCache = new Map<string, { buffer: Uint8Array; nombreArchivo: string }>();

// Cache de assets estáticos a nivel de módulo (se cargan una sola vez en el contenedor)
let cachedWsQrCodeUrl: string | null = null;
let cachedLogoBase64: string | null = null;

async function obtenerWsQrCode(): Promise<string> {
  if (cachedWsQrCodeUrl) return cachedWsQrCodeUrl;
  const wsUrl = "https://wa.me/584129164371?text=Hola%2C+necesito+un+sistema+para+laboratorio%2C+me+puedes+contactar%3F";
  cachedWsQrCodeUrl = await QRCode.toDataURL(wsUrl, {
    margin: 1,
    width: 120,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  return cachedWsQrCodeUrl;
}

function obtenerLogoBase64(): string | null {
  if (cachedLogoBase64 !== null) return cachedLogoBase64 || null;
  const logoPdfPath = path.join(process.cwd(), "public", "Logo2_pdf.png");
  const logoFallbackPath = path.join(process.cwd(), "public", "Logo2.png");
  const logoPathToUse = fs.existsSync(logoPdfPath) ? logoPdfPath : logoFallbackPath;
  cachedLogoBase64 = fs.existsSync(logoPathToUse)
    ? `data:image/png;base64,${fs.readFileSync(logoPathToUse).toString("base64")}`
    : "";
  return cachedLogoBase64 || null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const ordenId = parseInt(resolvedParams.id, 10);

    if (isNaN(ordenId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      select: {
        id: true,
        fechaCreacion: true,
        resultadosCompletados: true,
        notasSubcategoria: {
          select: {
            subcategoria: true,
            nota: true
          }
        },
        paciente: {
          select: {
            nombreCompleto: true,
            cedula: true,
            fechaNacimiento: true,
            esBebe: true,
            sexo: true,
            telefono: true,
            direccion: true,
            observaciones: true
          }
        },
        estado: { select: { nombre: true } },
        creadoPor: { select: { nombre: true } },
        detalles: {
          select: {
            id: true,
            cantidad: true,
            resultado: {
              select: {
                valoresReferencia: true,
                observaciones: true,
                firmado: true,
                valores: {
                  select: {
                    valorIngresado: true
                  }
                },
                procesadoPor: {
                  select: {
                    id: true,
                    nombre: true,
                    firmaUrl: true,
                    mpps: true,
                    col: true,
                  },
                },
              },
            },
            prueba: {
              select: {
                nombre: true,
                unidades: true,
                valoresReferencia: true,
                categoriaVisual: true,
                subcategoriaVisual: true,
                codigo: true,
                subcategoria: {
                  select: {
                    nombre: true,
                    esPaquete: true,
                    categoria: {
                      select: {
                        nombre: true
                      }
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (!orden.resultadosCompletados) {
      return NextResponse.json(
        { error: "Los resultados aún no están listos" },
        { status: 403 }
      );
    }

    // Fecha impresa
    const ahora = new Date();
    const fechaImpresa =
      ahora.toLocaleDateString("es-VE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "America/Caracas"
      }) +
      "  |  " +
      ahora.toLocaleTimeString("es-VE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Caracas"
      });

    const cacheKey = `${ordenId}-${orden.detalles.length}-${orden.fechaCreacion.getTime()}`;

    // ETag para evitar retransferencia si el cliente ya lo tiene en caché (304 Not Modified)
    const etag = `W/"pdf-orden-${cacheKey}"`;
    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304 });
    }

    // Servir desde la memoria de la instancia serverless caliente (responde en 1ms sin tocar la CPU)
    if (pdfBufferCache.has(cacheKey)) {
      const cached = pdfBufferCache.get(cacheKey)!;
      return new NextResponse(Buffer.from(cached.buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${cached.nombreArchivo}"`,
          "Content-Length": cached.buffer.length.toString(),
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          "ETag": etag,
        },
      });
    }

    // Generar QR de verificación (120px es ideal para 35x35pt a 300DPI y procesa el doble de rápido)
    const origin = new URL(request.url).origin;
    const urlValidacion = `${origin}/validar/${ordenId}`;
    const qrCodeUrl = await QRCode.toDataURL(urlValidacion, {
      margin: 1,
      width: 120,
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    // QR de WhatsApp y logo pre-cacheados en memoria
    const [wsQrCodeUrl, logoBase64] = await Promise.all([
      obtenerWsQrCode(),
      Promise.resolve(obtenerLogoBase64()),
    ]);

    // Firmas: convertir URLs relativas a base64 si existen en el filesystem público
    const ordenConFirmas = {
      ...orden,
      detalles: orden.detalles.map((det: any) => ({
        ...det,
        resultado: det.resultado
          ? {
              ...det.resultado,
              procesadoPor: det.resultado.procesadoPor
                ? {
                    ...det.resultado.procesadoPor,
                    firmaUrl: resolverFirmaUrl(det.resultado.procesadoPor.firmaUrl),
                  }
                : null,
            }
          : null,
      })),
    };

    // Renderizar PDF en el servidor
    const buffer = await renderToBuffer(
      React.createElement(ReporteDocumentServer, {
        orden: ordenConFirmas,
        fechaImpresa,
        qrCodeUrl,
        wsQrCodeUrl,
        logoBase64: logoBase64 ?? undefined,
      }) as React.ReactElement<any>
    );

    const nombreArchivo = `Resultados_${orden.paciente.nombreCompleto.replace(/\s+/g, "_")}_#${ordenId}.pdf`;
    const uint8Buffer = new Uint8Array(buffer);

    // Guardar en la caché en memoria (límite de 50 entradas para mantener la RAM limpia)
    if (pdfBufferCache.size > 50) {
      const primerClave = pdfBufferCache.keys().next().value;
      if (primerClave) pdfBufferCache.delete(primerClave);
    }
    pdfBufferCache.set(cacheKey, { buffer: uint8Buffer, nombreArchivo });

    return new NextResponse(Buffer.from(uint8Buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nombreArchivo}"`,
        "Content-Length": uint8Buffer.length.toString(),
        // Permitir caché pública en CDN/Edge de Vercel por 7 días (evita invocar la función serverless y ahorra Fast Data Transfer)
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "ETag": etag,
      },
    });
  } catch (error: any) {
    console.error("Error generando PDF en servidor:", error);
    return NextResponse.json(
      { error: `Error interno al generar el PDF: ${error?.message || 'Desconocido'}` },
      { status: 500 }
    );
  }
}

/**
 * Convierte una firmaUrl (que puede ser una URL pública relativa /uploads/...
 * o una URL completa https://...) a una Data URL base64 para react-pdf en servidor.
 */
function resolverFirmaUrl(firmaUrl: string | null): string | null {
  if (!firmaUrl) return null;

  try {
    // Si ya es una Data URL, devolverla tal cual
    if (firmaUrl.startsWith("data:")) return firmaUrl;

    // Si es una ruta relativa al servidor (ej: /uploads/firma.png)
    if (firmaUrl.startsWith("/")) {
      const filePath = path.join(process.cwd(), "public", firmaUrl);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(firmaUrl).toLowerCase().replace(".", "");
        const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
        const base64 = fs.readFileSync(filePath).toString("base64");
        return `data:${mimeType};base64,${base64}`;
      }
    }

    // Si es una URL externa (https://...), devolverla para que react-pdf la resuelva
    if (firmaUrl.startsWith("http")) return firmaUrl;

    return null;
  } catch {
    return null;
  }
}
