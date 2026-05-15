"use client";

import { useState, useEffect } from "react";
import { Microscope, Search, FileEdit, Clock, CheckCircle, FileText, Phone, MessageCircle, User, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import ModalCargarResultados from "../../components/resultados/ModalCargarResultados";
import ModalPreviewPDF from "../../components/resultados/ModalPreviewPDF";

export default function ResultadosPage() {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // ESTADOS DE FILTROS
  const [busqueda, setBusqueda] = useState("");
  const [tabActiva, setTabActiva] = useState<"PENDIENTES" | "COMPLETADOS">("PENDIENTES");
  const [fechaFiltro, setFechaFiltro] = useState<string>(new Date().toISOString().split('T')[0]); // Por defecto HOY

  // ESTADOS DE PAGINACIÓN
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 30;

  // ESTADOS DE MODALES
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<any | null>(null);
  const [ordenPDF, setOrdenPDF] = useState<any | null>(null);

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

  // Reiniciar a la página 1 cada vez que el usuario cambie un filtro
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, tabActiva, fechaFiltro]);

  // LÓGICA DE FILTRADO COMBINADO
  const ordenesFiltradas = ordenes.filter(orden => {
    // 1. Filtro por Pestaña (Pendiente/Completado)
    if (tabActiva === "PENDIENTES" && orden.resultadosCompletados) return false;
    if (tabActiva === "COMPLETADOS" && !orden.resultadosCompletados) return false;

    // 2. Filtro por Fecha (Ignorando la hora)
    if (fechaFiltro) {
      const fechaOrden = new Date(orden.fechaCreacion).toISOString().split('T')[0];
      if (fechaOrden !== fechaFiltro) return false;
    }

    // 3. Filtro por Búsqueda de Texto
    if (busqueda) {
      const b = busqueda.toLowerCase();
      const coincide = 
        orden.paciente.nombreCompleto.toLowerCase().includes(b) ||
        (orden.paciente.cedula && orden.paciente.cedula.includes(b)) ||
        orden.id.toString().includes(b);
      if (!coincide) return false;
    }

    return true;
  });

  // LÓGICA DE PAGINACIÓN
  const totalPaginas = Math.ceil(ordenesFiltradas.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const ordenesPaginadas = ordenesFiltradas.slice(indicePrimerItem, indiceUltimoItem);

  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return "";
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) return "58" + cleaned.substring(1);
    if (!cleaned.startsWith("58")) return "58" + cleaned;
    return cleaned;
  };

  const enviarWhatsAppCobro = (orden: any) => {
    if (!orden.paciente.telefono) {
      toast.warning("El paciente no tiene un número de teléfono registrado.");
      return;
    }
    const numeroWA = formatWhatsAppNumber(orden.paciente.telefono);

    let mensaje = `*Laboratorio LEYMA S.A.*\nHola ${orden.paciente.nombreCompleto},\n\n`;
    mensaje += `Te informamos que tus resultados ya están listos.\n\n`;
    mensaje += `Por favor, acércate a nuestras instalaciones para realizar el pago pendiente y recibir tu informe oficial.\n\n`;
    mensaje += `*Total de la orden:* $${orden.totalUSD.toFixed(2)} / Bs ${orden.totalBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}\n\n`;
    mensaje += `¡Te esperamos!`;

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

      {/* CABECERA */}
      <div className="mb-8">
        <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
          <Microscope className="text-[#0071E3]" size={36} strokeWidth={2.5} />
          Módulo de Resultados
        </h1>
        <p className="text-[#86868B] mt-2 font-medium text-[15px]">
          Gestión, transcripción y auditoría de exámenes de laboratorio.
        </p>
      </div>

      {/* BARRA DE FILTROS SUPERIOR */}
      <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm mb-6 flex flex-col xl:flex-row gap-4 justify-between items-center">
        
        <div className="flex flex-col md:flex-row gap-4 w-full xl:flex-1">
          {/* BUSCADOR */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar paciente o N° de orden..."
              className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
            />
          </div>

          {/* FILTRO DE FECHA */}
          <div className="relative w-full md:w-[220px]">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-[15px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
            />
          </div>
        </div>

        {/* TABS DE ESTADO */}
        <div className="flex bg-[#F5F5F7] p-1.5 rounded-xl w-full xl:w-[400px] shrink-0">
          <button
            onClick={() => setTabActiva("PENDIENTES")}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              tabActiva === "PENDIENTES" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <Clock size={16} /> Pendientes
          </button>
          <button
            onClick={() => setTabActiva("COMPLETADOS")}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              tabActiva === "COMPLETADOS" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <CheckCircle size={16} /> Completados
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {cargando ? (
        <div className="text-center py-20 text-slate-400 font-bold flex flex-col items-center gap-3">
          <Microscope className="animate-pulse text-[#0071E3]" size={40} />
          Cargando bandeja de resultados...
        </div>
      ) : ordenesPaginadas.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-16 flex flex-col items-center justify-center text-center">
          {tabActiva === "PENDIENTES" ? (
            <>
              <CheckCircle size={48} className="text-emerald-400 mb-4" strokeWidth={2} />
              <h3 className="text-xl font-bold text-[#1D1D1F]">¡Bandeja Limpia!</h3>
              <p className="text-slate-500 mt-1 font-medium">
                {fechaFiltro 
                  ? "No hay exámenes pendientes para la fecha seleccionada." 
                  : "No hay exámenes pendientes por transcribir en el sistema."}
              </p>
            </>
          ) : (
            <>
              <FileText size={48} className="text-slate-300 mb-4" strokeWidth={2} />
              <h3 className="text-xl font-bold text-[#1D1D1F]">Sin Historial</h3>
              <p className="text-slate-500 mt-1 font-medium">
                {fechaFiltro 
                  ? "No se completaron resultados en la fecha seleccionada." 
                  : "Aún no se han completado resultados en el sistema."}
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {ordenesPaginadas.map((orden) => {
              const estaPagada = orden.estado.nombre === "CERRADA";

              // LÓGICA DE AGRUPACIÓN DE ETIQUETAS
              const tagsAgrupados: any[] = [];
              orden.detalles.forEach((det: any) => {
                const isPaquete = det.prueba?.subcategoria?.esPaquete;
                if (isPaquete) {
                  const subcatId = det.prueba.subcategoria.id;
                  if (!tagsAgrupados.find(i => i.isPaquete && i.id === subcatId)) {
                    tagsAgrupados.push({ id: subcatId, nombre: det.prueba.subcategoria.nombre, isPaquete: true });
                  }
                } else {
                  tagsAgrupados.push({ id: det.prueba.id, nombre: det.prueba.nombre, isPaquete: false });
                }
              });

              return (
                <div key={orden.id} className="bg-white border border-slate-200/80 rounded-[24px] shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
                  
                  {/* CABECERA DE LA TARJETA */}
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
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-[#0071E3]/10 text-[#0071E3] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#0071E3]/20">
                          <CheckCircle size={10} strokeWidth={3} /> Procesado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CUERPO DE LA TARJETA */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-black text-[#1D1D1F] leading-tight mb-2 uppercase">{orden.paciente.nombreCompleto}</h3>

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
                          {tagsAgrupados.slice(0, 4).map((tag: any) => (
                            <span 
                              key={tag.id} 
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm border ${
                                tag.isPaquete 
                                  ? 'bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20' 
                                  : 'bg-white text-slate-600 border-slate-200/80'
                              }`}
                            >
                              {tag.nombre}
                            </span>
                          ))}
                          {tagsAgrupados.length > 4 && (
                            <span className="text-[11px] font-bold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-md">
                              +{tagsAgrupados.length - 4} más
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACCIONES DE LA TARJETA */}
                  <div className="p-5 pt-0 flex gap-3">
                    <button
                      onClick={() => setOrdenSeleccionada(orden)}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                        tabActiva === "PENDIENTES"
                          ? 'bg-[#0071E3] text-white hover:bg-[#0077ED] shadow-md shadow-[#0071E3]/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <FileEdit size={16} /> {tabActiva === "PENDIENTES" ? 'Ingresar Resultados' : 'Revisar / Editar'}
                    </button>

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
                            className="w-14 bg-slate-100 text-[#0071E3] hover:bg-[#0071E3] hover:text-white rounded-xl transition-all flex items-center justify-center shadow-sm"
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

          {/* CONTROLES DE PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4 bg-white border border-slate-200/80 p-3 rounded-2xl shadow-sm w-fit mx-auto">
              <button
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              
              <span className="text-sm font-bold text-slate-600 px-4">
                Página {paginaActual} de {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}