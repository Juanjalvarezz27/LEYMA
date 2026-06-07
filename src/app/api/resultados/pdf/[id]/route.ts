import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import React from "react";
import ReporteDocumentServer from "../../../../components/resultados/ReporteDocumentServer";

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const ordenId = parseInt(resolvedParams.id, 10);

    if (isNaN(ordenId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: {
        paciente: true,
        estado: { select: { nombre: true } },
        creadoPor: { select: { nombre: true } },
        detalles: {
          include: {
            resultado: {
              include: {
                valores: true,
                procesadoPor: {
                  select: {
                    id: true,
                    nombre: true,
                    firmaUrl: true,
                  },
                },
              },
            },
            prueba: {
              include: {
                subcategoria: {
                  include: {
                    categoria: true,
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

    // Generar QR como Data URL base64
    const origin = new URL(request.url).origin;
    const urlValidacion = `${origin}/validar/${ordenId}`;
    const qrCodeUrl = await QRCode.toDataURL(urlValidacion, {
      margin: 1,
      width: 200,
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    // Logo: leer del filesystem como base64 (react-pdf en servidor necesita ruta absoluta o buffer)
    const logoPath = path.join(process.cwd(), "public", "Logo2.png");
    const logoBase64 = fs.existsSync(logoPath)
      ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
      : null;

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
        logoBase64: logoBase64 ?? undefined,
      }) as React.ReactElement<any>
    );

    const nombreArchivo = `Resultados_${orden.paciente.nombreCompleto.replace(/\s+/g, "_")}_#${ordenId}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nombreArchivo}"`,
        "Content-Length": buffer.length.toString(),
        // Evitar que browsers intermediarios cacheen PDFs personales
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Error generando PDF en servidor:", error);
    return NextResponse.json(
      { error: "Error interno al generar el PDF" },
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
