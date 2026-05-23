"use client";

import { useState, useEffect } from "react";
import { X, Printer, Download } from "lucide-react";
import { toast } from "react-toastify";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import PresupuestoDocument from "./PresupuestoDocument";

interface ModalPreviewPresupuestoProps {
  paciente: { nombre: string, cedula: string };
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
