"use client";

import { X, Printer, Download, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";

interface ModalPreviewPDFProps {
  orden: any;
  onClose: () => void;
}

export default function ModalPreviewPDF({ orden, onClose }: ModalPreviewPDFProps) {
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const toastId = toast.loading("Generando documento PDF...");
    try {
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.getElementById('printable-pdf');
      
      // CORRECCIÓN 1: Le decimos a TypeScript "Si no encuentras el div, detente"
      if (!element) {
        toast.update(toastId, { render: "Error: No se encontró el documento para renderizar.", type: "error", isLoading: false, autoClose: 3000 });
        return;
      }

      const opt = {
        // CORRECCIÓN 2: Le decimos a TypeScript explícitamente que esto es una tupla de 4 números
        margin:       [0.5, 0, 0.5, 0] as [number, number, number, number], 
        filename:     `Resultados_${orden.paciente.nombreCompleto.replace(/\s+/g, '_')}_${orden.id}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
      toast.update(toastId, { render: "¡PDF descargado con éxito!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      console.error(error);
      toast.update(toastId, { render: "Error al generar el PDF", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return "";
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) return "58" + cleaned.substring(1);
    if (!cleaned.startsWith("58")) return "58" + cleaned;
    return cleaned;
  };

  const enviarWhatsAppText = () => {
    if (!orden.paciente.telefono) {
      toast.warning("El paciente no tiene número de teléfono registrado.");
      return;
    }
    const numeroWA = formatWhatsAppNumber(orden.paciente.telefono);
    
    let mensaje = `*Laboratorio LEYMA S.A.*\nHola ${orden.paciente.nombreCompleto},\n\n`;
    mensaje += `Tus resultados ya estan listos y procesados.\n\n`;
    mensaje += `Adjuntamos a este chat tu informe oficial en formato PDF para que puedas visualizarlo a detalle.\n\n`;
    mensaje += `Cualquier consulta estamos a tu orden. Feliz dia!`;

    const url = `https://wa.me/${numeroWA}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank"); 
  };

  const calcularEdad = (fechaNac: string, esBebe: boolean) => {
    if (!fechaNac) return "N/A";
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} ${esBebe ? 'Meses/Días' : 'Años'}`;
  };

  const fechaDoc = new Date().toLocaleDateString('es-VE', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-pdf, #printable-pdf * { visibility: visible; }
          #printable-pdf { position: absolute; left: 0; top: 0; width: 100%; margin: 0; box-shadow: none; min-height: 100vh; }
          @page { margin: 1cm; size: auto; }
        }
      `}} />

      <div className="fixed inset-0 z-[200] flex flex-col items-center p-4 sm:p-8 bg-[#1D1D1F]/95 overflow-y-auto print:bg-white print:p-0 print:block">
        
        <div className="w-full max-w-[800px] flex justify-between items-center bg-[#2D2D2F] p-4 rounded-2xl mb-6 print:hidden shrink-0 shadow-lg border border-white/10">
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-white text-[#1D1D1F] hover:bg-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              <Printer size={18} /> Imprimir
            </button>
            <button onClick={handleDownload} className="flex items-center gap-2 bg-[#0071E3] text-white hover:bg-[#0077ED] px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
              <Download size={18} /> Descargar PDF
            </button>
            <button onClick={enviarWhatsAppText} className="flex items-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
              <MessageCircle size={18} /> Enviar WS
            </button>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-full transition-colors">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div id="printable-pdf" className="bg-white w-full max-w-[800px] min-h-[1056px] shadow-2xl shrink-0 px-12 pt-12 pb-6 flex flex-col relative print:shadow-none">
          
          <div className="flex justify-between items-start border-b-2 border-[#0071E3] pb-6 mb-6">
            <div className="flex items-center gap-4">
              <img src="/Logo.png" alt="Logo LEYMA" className="h-16 object-contain" />
              <div>
                <h1 className="text-2xl font-black text-[#1D1D1F] tracking-tight leading-none mb-1">LEYMA S.A.</h1>
                <p className="text-[12px] font-bold text-[#0071E3] tracking-widest uppercase">Laboratorio Clínico</p>
              </div>
            </div>
            <div className="text-right text-sm font-medium text-slate-500">
              <p>Fecha de emisión: <span className="text-[#1D1D1F] font-bold">{fechaDoc}</span></p>
              <p>N° de Orden: <span className="text-[#1D1D1F] font-bold tracking-widest">#{orden.id.toString().padStart(5, '0')}</span></p>
            </div>
          </div>

          <div className="bg-[#F5F5F7] border border-slate-200 rounded-xl p-5 mb-8">
            <h3 className="text-[11px] font-black text-[#0071E3] uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Ficha del Paciente</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Nombre Completo</p>
                <p className="text-sm font-black text-[#1D1D1F]">{orden.paciente.nombreCompleto}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Cédula</p>
                <p className="text-sm font-bold text-[#1D1D1F]">{orden.paciente.cedula || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Edad y Sexo</p>
                <p className="text-sm font-bold text-[#1D1D1F]">
                  {calcularEdad(orden.paciente.fechaNacimiento, orden.paciente.esBebe)} / {orden.paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Teléfono</p>
                <p className="text-sm font-bold text-[#1D1D1F]">{orden.paciente.telefono || 'Sin registrar'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Correo</p>
                <p className="text-sm font-bold text-[#1D1D1F] truncate">{orden.paciente.correo || 'Sin registrar'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Dirección</p>
                <p className="text-sm font-bold text-[#1D1D1F] truncate">{orden.paciente.direccion || 'Sin registrar'}</p>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-black text-[#1D1D1F] mb-4 border-b border-slate-200 pb-2">Resultados de Laboratorio</h2>
          
          <div className="space-y-6">
            {orden.detalles.map((det: any) => (
              <div key={det.id} className="break-inside-avoid">
                <div className="bg-slate-50 border-l-4 border-[#0071E3] py-2 px-4 mb-3">
                  <h3 className="text-[14px] font-black text-[#1D1D1F] uppercase">{det.prueba.nombre}</h3>
                </div>
                
                <div className="pl-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Resultado</p>
                    <div className="text-[13px] font-medium text-[#1D1D1F] whitespace-pre-wrap leading-relaxed">
                      {det.resultado?.valores || 'Sin procesar'}
                    </div>
                  </div>
                  
                  {det.resultado?.observaciones && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Observaciones</p>
                      <div className="text-[13px] font-medium text-slate-600 whitespace-pre-wrap italic">
                        {det.resultado.observaciones}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 min-h-[100px]"></div>

          <div className="mt-auto pt-10 text-center break-inside-avoid">
            <div className="w-64 border-t-[1.5px] border-solid border-slate-800 mx-auto pt-3">
              <p className="text-[13px] font-black text-[#1D1D1F] uppercase tracking-widest">BIOANALISTA</p>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-200">
               <p className="text-[10px] font-medium text-slate-400">
                 Documento generado automáticamente por el Sistema LEYMA S.A. No válido como récife de pago.
               </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}