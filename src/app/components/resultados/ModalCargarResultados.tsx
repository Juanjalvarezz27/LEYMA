"use client";

import { useState, useEffect } from "react";
import { X, Microscope, CheckCircle, Save, Loader2, AlertCircle, FileSignature } from "lucide-react";
import { toast } from "react-toastify";

interface ModalCargarResultadosProps {
  orden: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalCargarResultados({ orden, onClose, onSuccess }: ModalCargarResultadosProps) {
  const [guardando, setGuardando] = useState(false);
  
  // Ahora "valores" guarda un Record donde la clave es el detalleId y el valor es un array de strings indexados [index]: valor
  const [valores, setValores] = useState<Record<string, string[]>>({});
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [obsExpandidas, setObsExpandidas] = useState<Record<string, boolean>>({});

  // Precargar resultados si ya existen (Modo Edición)
  useEffect(() => {
    if (orden && orden.detalles) {
      const initialValores: Record<string, string[]> = {};
      const initialObs: Record<string, string> = {};
      const initialExp: Record<string, boolean> = {};

      orden.detalles.forEach((d: any) => {
        // Inicializar el array según la cantidad comprada, llenándolo con strings vacíos por defecto
        initialValores[d.id] = Array(d.cantidad).fill("");

        if (d.resultado) {
          initialObs[d.id] = d.resultado.observaciones || "";
          if (d.resultado.observaciones) initialExp[d.id] = true;

          if (d.resultado.valores && d.resultado.valores.length > 0) {
            // Mapeamos los valores guardados respetando el orden en que vengan posicionados
            d.resultado.valores.forEach((valObj: any, index: number) => {
              if (index < d.cantidad) {
                initialValores[d.id][index] = valObj.valorIngresado || "";
              }
            });
          }
        }
      });
      setValores(initialValores);
      setObservaciones(initialObs);
      setObsExpandidas(initialExp);
    }
  }, [orden]);

  // Manejador para actualizar un índice específico de un examen
  const handleValorChange = (detalleId: string, index: number, valorInput: string) => {
    setValores(prev => {
      const nuevosValores = prev[detalleId] ? [...prev[detalleId]] : [];
      nuevosValores[index] = valorInput;
      return {
        ...prev,
        [detalleId]: nuevosValores
      };
    });
  };

  // AGRUPACIÓN COMO EN EL PAPEL (Categoría > Subcategoría > Pruebas)
  const groupedDetalles = orden.detalles.reduce((acc: any, det: any) => {
    const catNombre = det.prueba?.subcategoria?.categoria?.nombre || "OTROS";
    const subcatNombre = det.prueba?.subcategoria?.nombre || "PRUEBAS INDIVIDUALES";

    if (!acc[catNombre]) acc[catNombre] = {};
    if (!acc[catNombre][subcatNombre]) acc[catNombre][subcatNombre] = [];

    acc[catNombre][subcatNombre].push(det);
    return acc;
  }, {});

  const guardarResultados = async () => {
    // Validación: Verificar que absolutamente todos los índices de cantidad de cada prueba tengan un valor
    let faltantes = false;
    
    for (const d of orden.detalles) {
      const valoresDeDetalle = valores[d.id];
      for (let i = 0; i < d.cantidad; i++) {
        if (!valoresDeDetalle?.[i]?.trim()) {
          faltantes = true;
          break;
        }
      }
      if (faltantes) break;
    }

    if (faltantes) {
      toast.error("Debe llenar todos los campos de resultados requeridos según la cantidad solicitada.");
      return;
    }

    // Formatear para el backend (Estructurando el array multi-valor)
    const resultadosArray = orden.detalles.map((d: any) => ({
      detalleOrdenId: d.id,
      observaciones: observaciones[d.id] || "",
      valores: (valores[d.id] || Array(d.cantidad).fill("")).map((valText: string) => ({
        pruebaId: d.prueba.id,
        valorIngresado: valText
      }))
    }));

    setGuardando(true);
    try {
      const res = await fetch("/api/resultados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordenId: orden.id, resultados: resultadosArray })
      });

      if (!res.ok) throw new Error();

      toast.success(orden.resultadosCompletados ? "Resultados actualizados correctamente." : "Resultados certificados y orden completada.");
      onSuccess();
    } catch (error) {
      toast.error("Error al guardar los resultados.");
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-[#1D1D1F]/60" onClick={!guardando ? onClose : undefined}></div>

      <div className="relative w-full max-w-5xl max-h-[95vh] bg-[#F5F5F7] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border ${orden.resultadosCompletados ? 'bg-green-50 border-green-100 text-green-600' : 'bg-purple-50 border-purple-100 text-purple-600'}`}>
              {orden.resultadosCompletados ? <CheckCircle size={28} strokeWidth={2.5} /> : <Microscope size={28} strokeWidth={2.5} />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">
                  {orden.resultadosCompletados ? 'Edición de Resultados' : 'Transcripción de Resultados'}
                </h2>
                <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                  Orden #{orden.id.toString().padStart(6, '0')}
                </span>
              </div>
              <p className="text-[15px] font-medium text-slate-500 mt-1">
                Paciente: <span className="font-black text-[#1D1D1F]">{orden.paciente.nombreCompleto}</span>
                <span className="mx-2 opacity-50">|</span>
                C.I: <span className="font-bold text-slate-700">{orden.paciente.cedula || 'S/N'}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={guardando} className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-200 text-slate-500 rounded-full transition-all shadow-sm">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">

          {!orden.resultadosCompletados && (
            <div className="bg-white border-l-4 border-l-orange-500 border-y border-r border-slate-200 rounded-r-2xl p-5 flex gap-4 mb-8 shadow-sm">
              <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="text-[#1D1D1F] font-bold text-[15px]">Atención Bioanalista</h4>
                <p className="text-sm text-slate-600 font-medium mt-1">
                  Transcriba los valores de la máquina al sistema cuidadosamente. Para exámenes con cantidades mayores a 1, se habilitará un casillero por cada muestra registrada.
                </p>
              </div>
            </div>
          )}

          {/* LA HOJA DE RESULTADOS ESTILO PAPEL */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {Object.entries(groupedDetalles).map(([catNombre, subcategorias]) => (
              <div key={catNombre} className="mb-2">

                <div className="bg-slate-100/80 px-8 py-3.5 border-y border-slate-200">
                  <h3 className="text-[17px] font-black text-[#1D1D1F] tracking-widest uppercase">
                    {catNombre}
                  </h3>
                </div>

                {Object.entries(subcategorias as any).map(([subCatNombre, detalles]: [string, any]) => (
                  <div key={subCatNombre} className="px-8 py-5">

                    <div className="mb-4 border-b-2 border-[#1D1D1F] pb-2">
                      <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest">
                        {subCatNombre}
                      </h4>
                    </div>

                    <div className="flex items-center text-xs font-black text-slate-800 uppercase tracking-wider mb-2 px-2">
                      <div className="w-[40%]">Descripción del Examen</div>
                      <div className="w-[20%] text-center">Resultados ({`Cant.`})</div>
                      <div className="w-[20%] text-center">Unidades</div>
                      <div className="w-[20%] text-right">Valores de Referencia</div>
                    </div>

                    <div className="space-y-1">
                      {detalles.map((det: any) => (
                        <div key={det.id} className="flex flex-col group rounded-xl hover:bg-slate-50 transition-colors p-2 border border-transparent hover:border-slate-200">

                          <div className="flex items-center">
                            {/* 1. Descripción */}
                            <div className="w-[40%] flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="text-[15px] font-semibold text-[#1D1D1F]">
                                  {det.prueba.nombre}
                                </span>
                                {det.cantidad > 1 && (
                                  <span className="text-[10px] text-[#0071E3] font-black mt-0.5 uppercase tracking-wide">
                                    Requiere {det.cantidad} Muestras
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => setObsExpandidas(prev => ({ ...prev, [det.id]: !prev[det.id] }))}
                                className={`p-1.5 rounded-lg transition-colors ${obsExpandidas[det.id] || observaciones[det.id] ? 'bg-blue-100 text-[#0071E3]' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-600 opacity-0 group-hover:opacity-100'}`}
                                title="Añadir Observación"
                              >
                                <FileSignature size={14} strokeWidth={2.5} />
                              </button>
                            </div>

                            {/* 2. Inputs de los Resultados (Bucle dinámico según cantidad) */}
                            <div className="w-[20%] px-2 flex flex-col gap-1.5">
                              {Array(det.cantidad).fill(0).map((_, i) => (
                                <input
                                  key={i}
                                  type="text"
                                  value={valores[det.id]?.[i] || ""}
                                  onChange={(e) => handleValorChange(det.id, i, e.target.value)}
                                  className={`w-full text-center text-[14px] font-black bg-white border rounded-lg py-1.5 outline-none transition-all shadow-sm focus:ring-2 focus:ring-[#0071E3]/20 ${
                                    valores[det.id]?.[i]?.trim() ? 'border-[#0071E3] text-[#0071E3]' : 'border-slate-300 text-[#1D1D1F] focus:border-[#0071E3]'
                                  }`}
                                  placeholder={det.cantidad > 1 ? `Resultado ${i + 1}` : "-"}
                                />
                              ))}
                            </div>

                            {/* 3. Unidades */}
                            <div className="w-[20%] text-sm text-slate-600 font-medium text-center">
                              {det.prueba.unidades || "-"}
                            </div>

                            {/* 4. Valores de Referencia */}
                            <div className="w-[20%] text-[13px] text-slate-500 font-medium text-right whitespace-pre-wrap leading-tight">
                              {det.prueba.valoresReferencia || "-"}
                            </div>
                          </div>

                          {/* TEXTAREA DE OBSERVACIÓN (Colapsable) */}
                          {obsExpandidas[det.id] && (
                            <div className="mt-3 w-full pl-6 pr-2">
                              <textarea
                                value={observaciones[det.id] || ""}
                                onChange={(e) => setObservaciones({ ...observaciones, [det.id]: e.target.value })}
                                placeholder={`Observación específica para ${det.prueba.nombre}...`}
                                rows={2}
                                className="w-full bg-yellow-50/50 border border-yellow-200/60 rounded-xl p-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-yellow-400/20 placeholder:text-slate-400 resize-none"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-200 bg-white shrink-0 flex justify-end gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10">
          <button onClick={onClose} disabled={guardando} className="px-6 py-3.5 text-[15px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors">
            Cancelar Transcripción
          </button>
          <button onClick={guardarResultados} disabled={guardando} className="px-8 py-3.5 text-[15px] font-black text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-2xl transition-all shadow-[0_8px_20px_rgba(0,113,227,0.3)] flex items-center gap-2">
            {guardando ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} strokeWidth={2.5} />}
            {guardando ? 'Procesando...' : (orden.resultadosCompletados ? 'Actualizar Resultados' : 'Certificar Resultados')}
          </button>
        </div>

      </div>
    </div>
  );
}