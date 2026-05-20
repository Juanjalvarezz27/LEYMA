"use client";

import { useState, useEffect } from "react";
import { X, Printer, Download, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";
import { PDFViewer, pdf } from '@react-pdf/renderer';
import QRCodeNode from "qrcode";
import ReporteDocument from "./ReporteDocument";

interface ModalPreviewPDFProps {
  orden: any;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL (MODAL VISOR)
// ---------------------------------------------------------------------------
export default function ModalPreviewPDF({ orden, onClose }: ModalPreviewPDFProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [fechaImpresa, setFechaImpresa] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const ahora = new Date();
    setFechaImpresa(ahora.toLocaleDateString('es-VE', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + ahora.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }));

    const generarQR = async () => {
      try {
        const urlValidacion = `${window.location.origin}/validar/${orden.id}`;
        const base64Data = await QRCodeNode.toDataURL(urlValidacion, {
          margin: 1,
          width: 200,
          color: { dark: "#000000", light: "#FFFFFF" }
        });
        setQrCodeUrl(base64Data);
      } catch (err) {
        console.error("Error generando QR", err);
      }
    };

    if (orden?.id) generarQR();
  }, [orden]);

  const handleDownloadBlob = async () => {
    const toastId = toast.loading("Generando PDF en alta calidad...");
    try {
      const blob = await pdf(<ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Resultados_${orden.paciente.nombreCompleto.replace(/\s+/g, '_')}_#${orden.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.update(toastId, { render: "¡PDF descargado exitosamente!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      toast.update(toastId, { render: "Error al generar el PDF", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const handlePrintBlob = async () => {
    const toastId = toast.loading("Preparando impresión...");
    try {
      const blob = await pdf(<ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} />).toBlob();
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        toast.dismiss(toastId);
      };
    } catch (error) {
      toast.update(toastId, { render: "Error al preparar impresión", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const enviarWhatsAppConLink = () => {
    if (!orden.paciente.telefono) {
      toast.warning("El paciente no tiene número de teléfono registrado.");
      return;
    }
    let cleaned = orden.paciente.telefono.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "58" + cleaned.substring(1);
    else if (!cleaned.startsWith("58")) cleaned = "58" + cleaned;

    const linkValidacion = `${window.location.origin}/validar/${orden.id}`;
    
    let mensaje = `*Laboratorio LEYMA C.A.*\nHola ${orden.paciente.nombreCompleto},\n\n`;
    mensaje += `Tus resultados ya están listos y procesados.\n\n`;
    mensaje += `📄 *Descarga tu informe oficial en PDF aquí:*\n${linkValidacion}\n\n`;
    mensaje += `¡Cualquier consulta estamos a tu orden. Feliz día!`;

    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank"); 
  };

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center p-4 sm:p-8 bg-[#1D1D1F]/95">
      
      <div className="w-full max-w-[850px] flex justify-between items-center bg-[#2D2D2F] p-4 rounded-2xl mb-6 shrink-0 shadow-lg border border-white/10">
        <div className="flex gap-3">
          <button onClick={handlePrintBlob} className="flex items-center gap-2 bg-white text-[#1D1D1F] hover:bg-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
            <Printer size={18} /> Imprimir
          </button>
          <button onClick={handleDownloadBlob} className="flex items-center gap-2 bg-[#0071E3] text-white hover:bg-[#0077ED] px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
            <Download size={18} /> Descargar
          </button>
          <button onClick={enviarWhatsAppConLink} className="flex items-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
            <MessageCircle size={18} /> Enviar WS
          </button>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-full transition-colors">
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="w-full max-w-[850px] flex-1 bg-white rounded-xl overflow-hidden shadow-2xl">
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <ReporteDocument orden={orden} fechaImpresa={fechaImpresa} qrCodeUrl={qrCodeUrl} />
        </PDFViewer>
      </div>

    </div>
  );
}