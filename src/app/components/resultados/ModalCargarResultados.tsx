"use client";

import { useState, useEffect } from "react";
import { X, Microscope, CheckCircle, Save, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

interface ModalCargarResultadosProps {
  orden: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalCargarResultados({ orden, onClose, onSuccess }: ModalCargarResultadosProps) {
  const [guardando, setGuardando] = useState(false);
  const [inputs, setInputs] = useState<Record<string, { valores: string, observaciones: string }>>({});

  // Precargar resultados si ya existen (Modo Edición)
  useEffect(() => {
    if (orden && orden.resultadosCompletados) {
      const estadoInicial: Record<string, { valores: string, observaciones: string }> = {};
      orden.detalles.forEach((d: any) => {
        if (d.resultado) {
          estadoInicial[d.id] = {
            valores: d.resultado.valores || "",
            observaciones: d.resultado.observaciones || ""
          };
        }
      });
      setInputs(estadoInicial);
    }
  }, [orden]);

  const handleChange = (detalleId: string, campo: "valores" | "observaciones", valor: string) => {
    setInputs(prev => ({
      ...prev,
      [detalleId]: {
        ...prev[detalleId],
        [campo]: valor
      }
    }));
  };

  const guardarResultados = async () => {
    const faltantes = orden.detalles.some((d: any) => !inputs[d.id]?.valores?.trim());
    if (faltantes) {
      toast.error("Debe llenar los valores de todas las pruebas antes de guardar.");
      return;
    }

    const resultadosArray = orden.detalles.map((d: any) => ({
      detalleOrdenId: d.id,
      valores: inputs[d.id]?.valores,
      observaciones: inputs[d.id]?.observaciones
    }));

    setGuardando(true);
    try {
      // Usamos el mismo POST. Nuestro backend Prisma.$transaction hará un upsert implícito o lo modificamos para soportar updates.
      const res = await fetch("/api/resultados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordenId: orden.id, resultados: resultadosArray })
      });

      if (!res.ok) throw new Error();

      toast.success(orden.resultadosCompletados ? "Resultados actualizados." : "Resultados guardados y orden completada.");
      onSuccess();
    } catch (error) {
      toast.error("Error al guardar los resultados.");
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-[#1D1D1F]/60" onClick={!guardando ? onClose : undefined}></div>

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${orden.resultadosCompletados ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
              {orden.resultadosCompletados ? <CheckCircle size={24} strokeWidth={2} /> : <Microscope size={24} strokeWidth={2} />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                 <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight">
                   {orden.resultadosCompletados ? 'Revisión de Resultados' : 'Carga de Resultados'}
                 </h2>
                 <span className="text-sm font-bold text-slate-400">#{orden.id.toString().padStart(5, '0')}</span>
              </div>
              <p className="text-sm font-medium text-slate-500 mt-0.5">Paciente: <span className="font-bold text-[#1D1D1F]">{orden.paciente.nombreCompleto}</span></p>
            </div>
          </div>
          <button onClick={onClose} disabled={guardando} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-full transition-all shadow-sm">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {!orden.resultadosCompletados && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-slate-700 font-medium">
                Asegúrese de transcribir los valores correctamente. Una vez guardados, la orden pasará a estar lista para generar el PDF.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {orden.detalles.map((detalle: any) => (
              <div key={detalle.id} className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
                <h3 className="text-lg font-black text-[#1D1D1F] flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <CheckCircle size={18} className="text-[#0071E3]" />
                  {detalle.prueba.nombre} <span className="text-xs font-bold text-slate-400 uppercase ml-2 bg-slate-100 px-2 py-0.5 rounded">{detalle.prueba.codigo}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Valores / Resultado *</label>
                    <textarea 
                      rows={5}
                      placeholder="Ej: Leucocitos: 5.4&#10;Hematíes: 4.5..."
                      value={inputs[detalle.id]?.valores || ""}
                      onChange={(e) => handleChange(detalle.id, "valores", e.target.value)}
                      className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200 rounded-xl text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#0071E3]/20 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Observaciones (Opcional)</label>
                    <textarea 
                      rows={5}
                      placeholder="Notas adicionales del bioanalista..."
                      value={inputs[detalle.id]?.observaciones || ""}
                      onChange={(e) => handleChange(detalle.id, "observaciones", e.target.value)}
                      className="w-full px-4 py-3 bg-[#F5F5F7] border border-slate-200 rounded-xl text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#0071E3]/20 resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-4">
          <button onClick={onClose} disabled={guardando} className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            Cancelar
          </button>
          <button 
            onClick={guardarResultados} 
            disabled={guardando} 
            className="px-8 py-3 text-sm font-bold text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-xl transition-all shadow-[0_4px_12px_rgba(0,113,227,0.3)] flex items-center gap-2"
          >
            {guardando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {guardando ? 'Guardando...' : (orden.resultadosCompletados ? 'Actualizar Resultados' : 'Certificar Resultados')}
          </button>
        </div>

      </div>
    </div>
  );
}