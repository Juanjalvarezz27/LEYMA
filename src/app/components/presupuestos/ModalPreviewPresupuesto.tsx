"use client";

import { useState, useEffect } from "react";
import { X, Printer, Download } from "lucide-react";
import { toast } from "react-toastify";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { MessageCircle } from "lucide-react";
import PresupuestoDocument from "./PresupuestoDocument";

interface ModalPreviewPresupuestoProps {
  paciente: { nombre: string, cedula: string, telefono?: string };
  pruebas: any[];
  tasaBCV: number;
  descuento: number;
  subtotal: number;
  total: number;
  onClose: () => void;
}

export default function ModalPreviewPresupuesto({ 
  paciente, 
  pruebas, 
  tasaBCV, 
  descuento, 
  subtotal, 
  total, 
  onClose 
}: ModalPreviewPresupuestoProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDownload = async () => {
    try {
      const blob = await pdf(
        <PresupuestoDocument 
          paciente={paciente} 
          pruebas={pruebas} 
          tasaBCV={tasaBCV} 
          descuento={descuento} 
          subtotal={subtotal} 
          total={total} 
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Presupuesto_${paciente.nombre ? paciente.nombre.replace(/\s+/g, "_") : "LEYMA"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al descargar el presupuesto");
    }
  };

  const handlePrint = async () => {
    const toastId = toast.loading("Preparando impresión...");
    try {
      const blob = await pdf(
        <PresupuestoDocument 
          paciente={paciente} 
          pruebas={pruebas} 
          tasaBCV={tasaBCV} 
          descuento={descuento} 
          subtotal={subtotal} 
          total={total} 
        />
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
    let numeroStr = paciente.telefono || "";
    
    // Si no ingresó número en el formulario, se lo pedimos por un prompt
    if (!numeroStr || numeroStr.trim() === "") {
      const inputTelefono = window.prompt("Ingrese el número de teléfono del paciente (Ej. 04121234567):");
      if (!inputTelefono) {
        toast.warning("Envío cancelado: Se requiere un número de teléfono.");
        return;
      }
      numeroStr = inputTelefono;
    }

    // Limpiamos todo lo que no sea número
    let cleaned = numeroStr.replace(/\D/g, "");
    
    // Si empieza con 0 (ej. 0412), lo cambiamos a 58 (ej. 58412)
    if (cleaned.startsWith("0")) {
      cleaned = "58" + cleaned.substring(1);
    } 
    // Si no empieza con 58 (y no era 0), le agregamos el 58 al principio
    else if (!cleaned.startsWith("58")) {
      cleaned = "58" + cleaned;
    }

    // Agrupamos la info en una estructura minimizada para que el Base64 sea muy corto
    const data = {
      p: { n: paciente.nombre, c: paciente.cedula, t: paciente.telefono },
      e: pruebas.map(pr => [pr.nombre, pr.precioUSD, pr.cantidad || 1]),
      b: tasaBCV,
      d: descuento,
      s: subtotal,
      t: total
    };
    
    // Convertimos a base64 manejando acentos correctamente
    const jsonStr = JSON.stringify(data);
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    
    const url = `${window.location.origin}/cotizacion?d=${base64}`;
    
    let text = `*Laboratorio LEYMA C.A.*\nHola ${paciente.nombre || 'estimado paciente'},\n\n`;
    text += `Adjunto le enviamos el presupuesto solicitado.\n\n`;
    text += `*Total a pagar:* $${total.toFixed(2)} / Bs ${(total * tasaBCV).toFixed(2)}\n\n`;
    text += `📄 *Ver cotización y descargar PDF aquí:*\n${url}\n\n`;
    text += `¡Cualquier consulta estamos a su orden!`;
    
    // Abrimos wa.me apuntando DIRECTO al número formateado
    window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center p-4 sm:p-8 bg-[#1D1D1F]/95">
      <div className="w-full max-w-[850px] flex justify-between items-center bg-[#2D2D2F] p-4 rounded-2xl mb-6 shrink-0 shadow-lg border border-white/10">
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white text-[#1D1D1F] hover:bg-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Printer size={18} /> Imprimir Presupuesto
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-[#0071E3] text-white hover:bg-[#0077ED] px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Download size={18} /> Descargar
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

      <div className="w-full max-w-[850px] flex-1 bg-white rounded-xl overflow-hidden shadow-2xl">
        <PDFViewer width="100%" height="100%" showToolbar={true}>
          <PresupuestoDocument 
            paciente={paciente} 
            pruebas={pruebas} 
            tasaBCV={tasaBCV} 
            descuento={descuento} 
            subtotal={subtotal} 
            total={total} 
          />
        </PDFViewer>
      </div>
    </div>
  );
}
