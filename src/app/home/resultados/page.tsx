"use client";

import { useState, useEffect } from "react";
import { Microscope, Search, FileEdit, Clock, CheckCircle, FileText, Phone, MessageCircle, User } from "lucide-react";
import { toast } from "react-toastify";
import ModalCargarResultados from "../../components/resultados/ModalCargarResultados";
import ModalPreviewPDF from "../../components/resultados/ModalPreviewPDF";

export default function ResultadosPage() {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<any | null>(null);
  const [ordenPDF, setOrdenPDF] = useState<any | null>(null);
  
  const [tabActiva, setTabActiva] = useState<"PENDIENTES" | "COMPLETADOS">("PENDIENTES");

  const fetchOrdenes = async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/resultados/lista");
      if (!res.ok) throw new Error("Error de red");
      const data = await res.json();
      setOrdenes(data);
    } catch (error) {
      toast.error("Error al cargar las órdenes.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const ordenesPorTab = ordenes.filter(orden => {
    if (tabActiva === "PENDIENTES") return !orden.resultadosCompletados;
    if (tabActiva === "COMPLETADOS") return orden.resultadosCompletados;
    return true;
  });

  const ordenesFiltradas = ordenesPorTab.filter(orden => {
    const busquedaLower = busqueda.toLowerCase();
    return (
      orden.paciente.nombreCompleto.toLowerCase().includes(busquedaLower) ||
      (orden.paciente.cedula && orden.paciente.cedula.includes(busquedaLower)) ||
      orden.id.toString().includes(busquedaLower)
    );
  });

  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return "";
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) return "58" + cleaned.substring(1);
    if (!cleaned.startsWith("58")) return "58" + cleaned;
    return cleaned;
  };

  // Esta función ahora SOLO se usa para cobrar a los que tienen Deuda
  const enviarWhatsAppCobro = (orden: any) => {
    if (!orden.paciente.telefono) {
      toast.warning("El paciente no tiene un numero de telefono registrado.");
      return;
    }
    const numeroWA = formatWhatsAppNumber(orden.paciente.telefono);
    
    let mensaje = `*Laboratorio LEYMA S.A.*\nHola ${orden.paciente.nombreCompleto},\n\n`;
    mensaje += `Te informamos que tus resultados ya estan listos.\n\n`;
    mensaje += `Por favor, acercate a nuestras instalaciones para realizar el pago pendiente y recibir tu informe oficial.\n\n`;
    mensaje += `*Total de la orden:* $${orden.totalUSD.toFixed(2)} / Bs ${orden.totalBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}\n\n`;
    mensaje += `Te esperamos!`;
    
    const url = `https://wa.me/${numeroWA}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank"); 
  };

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      
      {ordenSeleccionada && (
        <ModalCargarResultados 
          orden={ordenSeleccionada} 
          onClose={() => setOrdenSeleccionada(null)}
          onSuccess={() => {
            setOrdenSeleccionada(null);
            fetchOrdenes();
          }}
        />
      )}

      {ordenPDF && (
        <ModalPreviewPDF 
          orden={ordenPDF} 
          onClose={() => setOrdenPDF(null)} 
        />
      )}

      <div className="mb-8">
        <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
          <Microscope className="text-purple-600" size={36} strokeWidth={2.5} />
          Módulo de Resultados
        </h1>
        <p className="text-[#86868B] mt-2 font-medium text-[15px]">Gestión, transcripción y auditoría de exámenes de laboratorio.</p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm mb-6 flex flex-col lg:flex-row gap-6 justify-between items-center">
        <div className="relative w-full lg:flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar paciente o N°..."
            className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all"
          />
        </div>

        <div className="flex bg-[#F5F5F7] p-1.5 rounded-xl w-full lg:w-[450px] shrink-0">
          <button
            onClick={() => setTabActiva("PENDIENTES")}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              tabActiva === "PENDIENTES" ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <Clock size={16} /> Pendientes
          </button>
          <button
            onClick={() => setTabActiva("COMPLETADOS")}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              tabActiva === "COMPLETADOS" ? "bg-white text-green-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <CheckCircle size={16} /> Completados
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400 font-bold">Cargando bandeja...</div>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-16 flex flex-col items-center justify-center text-center">
          {tabActiva === "PENDIENTES" ? (
            <>
              <CheckCircle size={48} className="text-green-400 mb-4" strokeWidth={2} />
              <h3 className="text-xl font-bold text-[#1D1D1F]">¡Bandeja Limpia!</h3>
              <p className="text-slate-500 mt-1 font-medium">No hay exámenes pendientes por transcribir.</p>
            </>
          ) : (
            <>
              <FileText size={48} className="text-slate-300 mb-4" strokeWidth={2} />
              <h3 className="text-xl font-bold text-[#1D1D1F]">Sin Historial</h3>
              <p className="text-slate-500 mt-1 font-medium">Aún no se han completado resultados en el sistema.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {ordenesFiltradas.map((orden) => {
            const estaPagada = orden.estado.nombre === "CERRADA";

            return (
              <div key={orden.id} className="bg-white border border-slate-200/80 rounded-[24px] shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
                
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                  <span className="text-[14px] font-bold text-slate-500 tracking-tight">
                    #{orden.id.toString().padStart(5, '0')}
                  </span>
                  
                  <div className="flex gap-2">
                    {estaPagada ? (
                      <span className="px-2.5 py-1 bg-emerald-100/80 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-200">
                        Pagada
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-red-100/80 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-red-200">
                        Deuda
                      </span>
                    )}

                    {tabActiva === "PENDIENTES" ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-100/80 text-orange-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-orange-200">
                        <Clock size={10} strokeWidth={3} /> Esperando
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-100/80 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-purple-200">
                        <CheckCircle size={10} strokeWidth={3} /> Procesado
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-black text-[#1D1D1F] leading-tight mb-2">{orden.paciente.nombreCompleto}</h3>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                      <User size={14} className="text-[#0071E3]" strokeWidth={2.5} />
                      <span>{orden.paciente.cedula || 'N/A'}</span>
                    </div>
                    <span className="text-slate-300 font-black">•</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                      <Phone size={14} className="text-[#0071E3]" strokeWidth={2.5} />
                      <span>{orden.paciente.telefono || 'Sin teléfono'}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-5">
                    <hr className="border-t-2 border-dashed border-slate-200 mb-5" />
                    
                    <div className="bg-[#F5F5F7] rounded-[16px] p-4 border border-slate-200/60">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Exámenes Solicitados</p>
                      <div className="flex flex-wrap gap-2">
                        {orden.detalles.slice(0, 4).map((det: any) => (
                          <span key={det.id} className="text-[12px] font-bold text-slate-600 bg-white border border-slate-200/80 px-2.5 py-1 rounded-md shadow-sm">
                            {det.prueba.nombre}
                          </span>
                        ))}
                        {orden.detalles.length > 4 && (
                          <span className="text-[12px] font-bold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-md">
                            +{orden.detalles.length - 4} más
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex gap-3">
                  <button 
                    onClick={() => setOrdenSeleccionada(orden)}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      tabActiva === "PENDIENTES" 
                        ? 'bg-[#0071E3]/10 text-[#0071E3] hover:bg-[#0071E3] hover:text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <FileEdit size={16} /> {tabActiva === "PENDIENTES" ? 'Ingresar Resultados' : 'Revisar / Editar'}
                  </button>
                  
                  {/* LÓGICA DE BOTONES MUTUAMENTE EXCLUYENTES */}
                  {tabActiva === "COMPLETADOS" && (
                    <>
                      {!estaPagada ? (
                        <button 
                          onClick={() => enviarWhatsAppCobro(orden)}
                          title="Enviar Recordatorio de Cobro"
                          className="w-14 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center justify-center shadow-sm"
                        >
                          <MessageCircle size={20} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => setOrdenPDF(orden)}
                          title="Ver y Generar PDF"
                          className="w-14 bg-blue-50 text-[#0071E3] hover:bg-[#0071E3] hover:text-white rounded-xl transition-all flex items-center justify-center shadow-sm"
                        >
                          <FileText size={20} />
                        </button>
                      )}
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}