"use client";

import { useState, useEffect, useRef } from "react";
import { X, Microscope, CheckCircle, Save, Loader2, AlertCircle, FileSignature, Lock, Check, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

interface ModalCargarResultadosProps {
  orden: any;
  onClose: () => void;
  onSuccess: (cerrar?: boolean) => void; 
}

export default function ModalCargarResultados({ orden, onClose, onSuccess }: ModalCargarResultadosProps) {
  const [guardando, setGuardando] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  
  // Estados para Firmas
  const [bioanalistas, setBioanalistas] = useState<any[]>([]);
  const [selectedBioanalista, setSelectedBioanalista] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pinFirma, setPinFirma] = useState("");
  const [seleccionados, setSeleccionados] = useState<Record<string, boolean>>({});
  
  const [valores, setValores] = useState<Record<string, string[]>>({});
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [obsExpandidas, setObsExpandidas] = useState<Record<string, boolean>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch("/api/bioanalistas")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBioanalistas(data);
      })
      .catch(() => console.log("Error cargando bioanalistas"));

    if (orden && orden.detalles) {
      const initialValores: Record<string, string[]> = {};
      const initialObs: Record<string, string> = {};
      const initialExp: Record<string, boolean> = {};
      const initialSel: Record<string, boolean> = {};

      orden.detalles.forEach((d: any) => {
        initialValores[d.id] = Array(d.cantidad).fill("");

        if (d.resultado) {
          initialObs[d.id] = d.resultado.observaciones || "";
          if (d.resultado.observaciones) initialExp[d.id] = true;

          if (d.resultado.valores && d.resultado.valores.length > 0) {
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
      setSeleccionados(initialSel);
    }
  }, [orden]);

  const handleValorChange = (detalleId: string, index: number, valorInput: string) => {
    setValores(prev => {
      const nuevosValores = prev[detalleId] ? [...prev[detalleId]] : [];
      nuevosValores[index] = valorInput;
      return { ...prev, [detalleId]: nuevosValores };
    });
  };

  const toggleSeleccionTodos = () => {
    const examenesLibres = orden.detalles.filter((d:any) => !d.resultado?.firmado);
    const todosSeleccionados = examenesLibres.every((d:any) => seleccionados[d.id]);
    const nuevoEstado = !todosSeleccionados;
    
    setSeleccionados(prev => {
      const nuevos = { ...prev };
      examenesLibres.forEach((d: any) => {
        nuevos[d.id] = nuevoEstado;
      });
      return nuevos;
    });
  };

  const groupedDetalles = orden.detalles.reduce((acc: any, det: any) => {
    const catNombre = det.prueba?.subcategoria?.categoria?.nombre || "OTROS";
    const subcatNombre = det.prueba?.subcategoria?.nombre || "PRUEBAS INDIVIDUALES";
    if (!acc[catNombre]) acc[catNombre] = {};
    if (!acc[catNombre][subcatNombre]) acc[catNombre][subcatNombre] = [];
    acc[catNombre][subcatNombre].push(det);
    return acc;
  }, {});

  const abrirModalFirma = () => {
    const initialSel: Record<string, boolean> = {};
    orden.detalles.forEach((d: any) => {
      if (!d.resultado?.firmado) {
        initialSel[d.id] = true;
      }
    });
    setSeleccionados(initialSel);
    setPinFirma("");
    setSelectedBioanalista("");
    setShowPinModal(true);
  };

  const procesarResultados = async (accion: "GUARDAR" | "FIRMAR", pin = "") => {
    let faltantes = false;
    
    const examenesPendientes = orden.detalles.filter((d: any) => !d.resultado?.firmado);
    
    const examenesAValidar = accion === "FIRMAR" 
      ? examenesPendientes.filter((d: any) => seleccionados[d.id]) 
      : examenesPendientes;

    if (accion === "FIRMAR" && examenesAValidar.length === 0) {
      toast.warning("Debe seleccionar al menos un examen para firmar.");
      return;
    }

    for (const d of examenesAValidar) {
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
      toast.error(accion === "FIRMAR" ? "Asegúrese de haber transcrito primero los resultados de los exámenes seleccionados." : "Debe llenar todos los campos pendientes antes de guardar.");
      return;
    }

    const resultadosArray = examenesPendientes.map((d: any) => ({
      detalleOrdenId: d.id,
      observaciones: observaciones[d.id] || "",
      marcadoParaFirma: accion === "FIRMAR" ? !!seleccionados[d.id] : false, 
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
        body: JSON.stringify({ 
          ordenId: orden.id, 
          resultados: resultadosArray, 
          accion, 
          pin, 
          bioanalistaId: selectedBioanalista 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar");

      setGuardando(false);

      if (accion === "FIRMAR") {
        const pendientesRestantes = examenesPendientes.length - examenesAValidar.length;
        if (pendientesRestantes > 0) {
          toast.success("Resultados validados. Faltan pruebas por firmar.");
          setShowPinModal(false);
          setPinFirma("");
          setSelectedBioanalista("");
          onSuccess(false); 
        } else {
          toast.success("Todos los resultados han sido validados y firmados.");
          setShowPinModal(false);
          onSuccess(true); 
        }
      } else {
        toast.success("Transcripción guardada exitosamente.");
        onSuccess(true);
      }

    } catch (error: any) {
      toast.error(error.message);
      setGuardando(false); 
    }
  };

  const confirmarFirma = () => {
    if (!selectedBioanalista) return toast.error("Debe seleccionar una bioanalista.");
    if (pinFirma.length !== 4) return toast.error("El PIN debe tener 4 dígitos.");
    procesarResultados("FIRMAR", pinFirma);
  };

  const examenesPendientes = orden.detalles.filter((d: any) => !d.resultado?.firmado);

  // Agrupamos los pendientes por categoría para el modal de firma
  const pendientesAgrupados = examenesPendientes.reduce((acc: any, det: any) => {
    const catNombre = det.prueba?.subcategoria?.categoria?.nombre || "OTROS";
    if (!acc[catNombre]) acc[catNombre] = [];
    acc[catNombre].push(det);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      
      {/* Fondo estático */}
      <div className="absolute inset-0 bg-[#1D1D1F]/80" onClick={!guardando && !showPinModal ? onClose : undefined}></div>

      {/* MODAL PRINCIPAL */}
      {/* OJO: Quité la opacidad condicional para evitar el bug visual del fondo transparente */}
      <div className={`relative w-full max-w-5xl max-h-[95vh] bg-[#F5F5F7] rounded-[32px] shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${showPinModal ? 'pointer-events-none' : ''}`}>
        
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
          <button onClick={onClose} disabled={guardando || showPinModal} className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-200 text-slate-500 rounded-full transition-all shadow-sm">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">

          {!orden.resultadosCompletados && (
            <div className="bg-white border-l-4 border-l-orange-500 border-y border-r border-slate-200 rounded-r-2xl p-5 flex gap-4 mb-8 shadow-sm">
              <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="text-[#1D1D1F] font-bold text-[15px]">Atención Asistente</h4>
                <p className="text-sm text-slate-600 font-medium mt-1">
                  Transcriba los valores cuidadosamente. Presione <strong>Guardar Transcripción</strong> al terminar. Las bioanalistas usarán el botón de <strong>Validar y Firmar</strong> para certificar los resultados.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {Object.entries(groupedDetalles).map(([catNombre, subcategorias]) => (
              <div key={catNombre} className="mb-2">

                <div className="bg-slate-100/80 px-8 py-3.5 border-y border-slate-200 flex justify-between items-center">
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
                      {detalles.map((det: any) => {
                        const estaFirmado = det.resultado?.firmado;
                        
                        return (
                        <div key={det.id} className={`flex flex-col group rounded-xl p-2 border transition-colors ${estaFirmado ? 'bg-green-50/30 border-green-100' : 'hover:bg-slate-50 border-transparent hover:border-slate-200'}`}>

                          <div className="flex items-center">
                            
                            <div className="w-[40%] flex items-center gap-3 pl-2">
                              <div className="flex flex-col">
                                <span className={`text-[15px] font-semibold ${estaFirmado ? 'text-green-800' : 'text-[#1D1D1F]'}`}>
                                  {det.prueba.nombre}
                                </span>
                                {estaFirmado ? (
                                  <span className="text-[10px] text-emerald-600 font-black mt-0.5 flex items-center gap-1 uppercase">
                                    <Check size={12} strokeWidth={3} /> Firmado por: {det.resultado.procesadoPor?.nombre}
                                  </span>
                                ) : det.cantidad > 1 && (
                                  <span className="text-[10px] text-[#0071E3] font-black mt-0.5 uppercase tracking-wide">
                                    Requiere {det.cantidad} Muestras
                                  </span>
                                )}
                              </div>
                              {!estaFirmado && (
                                <button
                                  onClick={() => setObsExpandidas(prev => ({ ...prev, [det.id]: !prev[det.id] }))}
                                  className={`p-1.5 rounded-lg transition-colors ${obsExpandidas[det.id] || observaciones[det.id] ? 'bg-blue-100 text-[#0071E3]' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-600 opacity-0 group-hover:opacity-100'}`}
                                  title="Añadir Observación"
                                >
                                  <FileSignature size={14} strokeWidth={2.5} />
                                </button>
                              )}
                            </div>

                            <div className="w-[20%] px-2 flex flex-col gap-1.5">
                              {Array(det.cantidad).fill(0).map((_, i) => (
                                <input
                                  key={i}
                                  type="text"
                                  disabled={estaFirmado}
                                  value={valores[det.id]?.[i] || ""}
                                  onChange={(e) => handleValorChange(det.id, i, e.target.value)}
                                  className={`w-full text-center text-[14px] font-black bg-white border rounded-lg py-1.5 outline-none transition-all shadow-sm focus:ring-2 focus:ring-[#0071E3]/20 ${
                                    estaFirmado ? 'border-green-200 text-green-700 bg-green-50/50 cursor-not-allowed' : valores[det.id]?.[i]?.trim() ? 'border-[#0071E3] text-[#0071E3]' : 'border-slate-300 text-[#1D1D1F] focus:border-[#0071E3]'
                                  }`}
                                  placeholder={det.cantidad > 1 ? `Resultado ${i + 1}` : "-"}
                                />
                              ))}
                            </div>

                            <div className="w-[20%] text-sm text-slate-600 font-medium text-center">
                              {det.prueba.unidades || "-"}
                            </div>

                            <div className="w-[20%] text-[13px] text-slate-500 font-medium text-right whitespace-pre-wrap leading-tight">
                              {det.prueba.valoresReferencia || "-"}
                            </div>
                          </div>

                          {(obsExpandidas[det.id] || (estaFirmado && observaciones[det.id])) && (
                            <div className="mt-3 w-full pl-6 pr-2">
                              <textarea
                                value={observaciones[det.id] || ""}
                                disabled={estaFirmado}
                                onChange={(e) => setObservaciones({ ...observaciones, [det.id]: e.target.value })}
                                placeholder={`Observación específica para ${det.prueba.nombre}...`}
                                rows={2}
                                className={`w-full border rounded-xl p-3 text-sm font-medium outline-none resize-none ${estaFirmado ? 'bg-green-50 border-green-200 text-green-800 cursor-not-allowed' : 'bg-yellow-50/50 border-yellow-200/60 text-slate-700 focus:ring-2 focus:ring-yellow-400/20'}`}
                              />
                            </div>
                          )}
                        </div>
                      )})}
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
            Cerrar
          </button>
          
          {!orden.resultadosCompletados && (
            <button onClick={() => procesarResultados("GUARDAR")} disabled={guardando} className="px-6 py-3.5 text-[15px] font-bold text-[#0071E3] bg-[#0071E3]/10 border border-[#0071E3]/20 hover:bg-[#0071E3]/20 rounded-2xl transition-colors flex items-center gap-2">
              <Save size={18} strokeWidth={2.5} /> Guardar Transcripción
            </button>
          )}

          {!orden.resultadosCompletados && examenesPendientes.length > 0 && (
            <button onClick={abrirModalFirma} disabled={guardando} className="px-8 py-3.5 text-[15px] font-black text-white bg-emerald-500 hover:bg-emerald-600 rounded-2xl transition-colors shadow-sm flex items-center gap-2">
              <Lock size={20} strokeWidth={2.5} /> Validar y Firmar
            </button>
          )}
        </div>
      </div>

      {/* --- MINI-MODAL SUPERPUESTO (CAPA NEGRA SÓLIDA PARA OSCURECER EL MODAL PRINCIPAL) --- */}
      {showPinModal && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center bg-[#1D1D1F]/80">
          <div className="bg-white rounded-[24px] shadow-2xl p-8 border border-slate-100 flex flex-col w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-200">
            
            <div className="flex flex-col items-center border-b border-slate-100 pb-5 mb-5">
              <div className="w-14 h-14 bg-blue-50 text-[#0071E3] rounded-full flex items-center justify-center mb-3">
                <Lock size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black text-[#1D1D1F]">Autorización Médica</h3>
              <p className="text-[13px] font-medium text-slate-500 text-center mt-1">
                Seleccione los exámenes que le corresponden y valide su identidad.
              </p>
            </div>
            
            {/* Lista de Exámenes Agrupados */}
            <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-5 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300">
              <div className="flex justify-between items-center mb-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Exámenes a Firmar</label>
                <button onClick={toggleSeleccionTodos} className="text-xs font-bold text-[#0071E3] hover:underline">
                  Seleccionar Todos
                </button>
              </div>
              
              <div className="space-y-5">
                {Object.entries(pendientesAgrupados).map(([cat, dets]: [string, any]) => (
                  <div key={cat} className="space-y-2">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">
                      {cat}
                    </h4>
                    {dets.map((d: any) => (
                      <label key={d.id} className="flex items-center gap-3 cursor-pointer group p-3 bg-white hover:bg-[#F5F5F7] border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={seleccionados[d.id] || false} 
                          onChange={(e) => setSeleccionados({...seleccionados, [d.id]: e.target.checked})}
                          className="w-4 h-4 rounded text-[#0071E3] border-slate-300 focus:ring-[#0071E3] cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#1D1D1F]">{d.prueba.nombre}</span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {d.prueba.subcategoria?.nombre}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="w-full relative" ref={dropdownRef}>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Bioanalista</label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-[#F5F5F7] border border-slate-200 rounded-xl text-[14px] font-bold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 text-left"
                >
                  <span className="truncate">
                    {selectedBioanalista ? bioanalistas.find(b => b.id === selectedBioanalista)?.nombre : "-- Seleccionar --"}
                  </span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
                    <div className="max-h-40 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200">
                      {bioanalistas.map(bio => (
                        <button
                          key={bio.id}
                          type="button"
                          onClick={() => { setSelectedBioanalista(bio.id); setDropdownOpen(false); }}
                          className={`w-full text-left px-5 py-3 text-[14px] font-bold transition-colors ${selectedBioanalista === bio.id ? "bg-[#0071E3]/10 text-[#0071E3]" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                          {bio.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block text-center">PIN de Firma</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinFirma}
                  onChange={(e) => setPinFirma(e.target.value.replace(/\D/g, ""))}
                  placeholder="****"
                  className="w-full text-center tracking-[0.5em] placeholder:tracking-normal px-4 py-3.5 bg-[#F5F5F7] border border-slate-200 rounded-xl text-xl font-black text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20"
                />
              </div>
            </div>

            <div className="flex gap-4 w-full border-t border-slate-100 pt-6 mt-auto">
              <button onClick={() => setShowPinModal(false)} className="flex-1 py-3.5 text-[15px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
              <button onClick={confirmarFirma} disabled={guardando} className="flex-1 py-3.5 text-[15px] font-bold text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-xl transition-colors shadow-[0_4px_12px_rgba(0,113,227,0.25)] flex justify-center items-center gap-2 hover:-translate-y-0.5 active:translate-y-0">
                {guardando ? <Loader2 size={20} className="animate-spin" /> : <FileSignature size={20} strokeWidth={2.5}/>}
                Firmar Seleccionados
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}