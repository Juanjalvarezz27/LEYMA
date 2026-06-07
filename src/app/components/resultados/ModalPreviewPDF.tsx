"use client";

import { useState, useEffect } from "react";
import { X, Printer, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import QRCodeNode from "qrcode";
import ReporteDocument from "./ReporteDocument";

interface ModalPreviewPDFProps {
  orden: any;
  onClose: () => void;
}

export default function ModalPreviewPDF({ orden, onClose }: ModalPreviewPDFProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [fechaImpresa, setFechaImpresa] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const ahora = new Date();
    setFechaImpresa(
      ahora.toLocaleDateString("es-VE", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Caracas" }) +
      "  |  " +
      ahora.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "America/Caracas" })
    );

    const generarQR = async () => {
      try {
        const urlValidacion = `${window.location.origin}/validar/${orden.id}`;
        const base64Data = await QRCodeNode.toDataURL(urlValidacion, {
          margin: 1,
          width: 200,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        setQrCodeUrl(base64Data);
      } catch (err: any) {
        console.error("Error generando QR", err);
      }
    };

    if (orden?.id) generarQR();
  }, [orden]);

  // Abre el PDF del servidor en nueva pestaña — el navegador lo muestra nativamente
  const handleVerPDF = () => {
    window.open(`/api/resultados/pdf/${orden.id}`, "_blank");
  };

  // Impresión: usa blob local solo para el iframe (solo desktop)
  const handlePrint = async () => {
    const toastId = toast.loading("Preparando impresión...");
    try {
      const blob = await pdf(
        <ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        toast.dismiss(toastId);
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(iframe);
        }, 30_000);
      };
    } catch {
      toast.update(toastId, { render: "Error al preparar impresión", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const enviarWhatsApp = () => {
    if (!orden.paciente.telefono) {
      toast.warning("El paciente no tiene número de teléfono registrado.");
      return;
    }
    let cleaned = orden.paciente.telefono.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "58" + cleaned.substring(1);
    else if (!cleaned.startsWith("58")) cleaned = "58" + cleaned;

    const link = `${window.location.origin}/validar/${orden.id}`;
    const mensaje =
      `*Laboratorio LEYMA C.A.*\nHola ${orden.paciente.nombreCompleto},\n\n` +
      `Tus resultados ya están listos.\n\n` +
      `*Ver tu informe en PDF:*\n${link}\n\n` +
      `¡Cualquier consulta estamos a tu orden. Feliz día!`;

    window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center p-4 sm:p-8 bg-[#1D1D1F]/95">
      {/* BARRA DE HERRAMIENTAS */}
      <div className="w-full max-w-[850px] flex justify-between items-center bg-[#2D2D2F] p-4 rounded-2xl mb-6 shrink-0 shadow-lg border border-white/10">
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white text-[#1D1D1F] hover:bg-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <Printer size={18} /> Imprimir
          </button>
          <button
            onClick={handleVerPDF}
            className="flex items-center gap-2 bg-[#0071E3] text-white hover:bg-[#0077ED] px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <X size={18} className="rotate-45" /> Abrir PDF
          </button>
          <button
            onClick={enviarWhatsApp}
            className="flex items-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <MessageCircle size={18} /> Enviar WS
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-full transition-colors"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* VISOR PDF (solo funciona bien en desktop/Chrome) */}
      <div className="w-full max-w-[850px] flex-1 bg-white rounded-xl overflow-hidden shadow-2xl">
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} />
        </PDFViewer>
      </div>
    </div>
  );
}