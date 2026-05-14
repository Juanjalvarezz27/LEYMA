"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Ban, CheckCircle2, Search, TestTubes, DollarSign, ClipboardList, Layers, ChevronDown, ChevronUp, Activity, FlaskConical, Tags, Filter, SlidersHorizontal, Check } from "lucide-react";
import { toast } from "react-toastify";
import ModalPrueba from "../../components/pruebas/ModalPrueba";
import ModalPruebaIndividual from "../../components/pruebas/ModalPruebaIndividual";
import useTasaBCV from "../../hooks/useTasaBcv";

export default function PruebasPage() {
  const [examenes, setExamenes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroEstado, setFiltroEstado] = useState("Todos"); 

  // Estados para controlar si los custom dropdowns están abiertos
  const [openDropdownCategoria, setOpenDropdownCategoria] = useState(false);
  const [openDropdownEstado, setOpenDropdownEstado] = useState(false);

  // Referencias para cerrar al hacer clic afuera
  const dropdownCategoriaRef = useRef<HTMLDivElement>(null);
  const dropdownEstadoRef = useRef<HTMLDivElement>(null);

  const [cargando, setCargando] = useState(true);
  const [examenExpandido, setExamenExpandido] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pruebaEditando, setPruebaEditando] = useState<any>(null);

  const [isModalItemOpen, setIsModalItemOpen] = useState(false);
  const [itemEditando, setItemEditando] = useState<any>(null);

  const { tasa, loading: loadingTasa } = useTasaBCV();
  const tasaBCV = tasa ?? 36.5; 

  const fetchExamenes = async () => {
    try {
      const res = await fetch("/api/pruebas");
      const data = await res.json();
      setExamenes(data);
    } catch (error) {
      toast.error("Error al cargar el catálogo de pruebas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchExamenes();
  }, []);

  // Lógica para cerrar los dropdowns al hacer clic fuera de ellos
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownCategoriaRef.current && !dropdownCategoriaRef.current.contains(event.target as Node)) {
        setOpenDropdownCategoria(false);
      }
      if (dropdownEstadoRef.current && !dropdownEstadoRef.current.contains(event.target as Node)) {
        setOpenDropdownEstado(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSavePrueba = async (formData: any) => {
    const isEdit = !!pruebaEditando;
    const url = isEdit ? `/api/pruebas/${pruebaEditando.id}` : "/api/pruebas";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ocurrió un error inesperado");

      toast.success(isEdit ? "Catálogo actualizado" : "Catálogo registrado exitosamente");
      setIsModalOpen(false);
      fetchExamenes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSavePruebaIndividual = async (formData: any) => {
    try {
      const res = await fetch(`/api/pruebas/item/${itemEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ocurrió un error inesperado");

      toast.success("Prueba individual actualizada");
      setIsModalItemOpen(false);
      fetchExamenes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleEstadoSubcategoria = async (id: string, estadoActual: boolean) => {
    try {
      const res = await fetch(`/api/pruebas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !estadoActual }),
      });
      if (res.ok) {
        toast.info(estadoActual ? "Subcategoría inhabilitada" : "Subcategoría activada");
        fetchExamenes();
      }
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  const toggleEstadoPruebaIndividual = async (id: string, estadoActual: boolean) => {
    try {
      const res = await fetch(`/api/pruebas/item/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !estadoActual }),
      });
      if (res.ok) {
        toast.info(estadoActual ? "Prueba individual inhabilitada" : "Prueba individual activada");
        fetchExamenes();
      }
    } catch (error) {
      toast.error("Error al cambiar estado de la prueba");
    }
  };

  const abrirModalNuevo = () => {
    setPruebaEditando(null);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (examen: any) => {
    setPruebaEditando(examen);
    setIsModalOpen(true);
  };

  const abrirModalEditarItem = (item: any) => {
    setItemEditando(item);
    setIsModalItemOpen(true);
  };

  const toggleExpandir = (id: string) => {
    setExamenExpandido(examenExpandido === id ? null : id);
  };

  const categoriasExistentes = Array.from(new Set(examenes.map(e => e.categoria.nombre)));

  const pruebasFiltradas = examenes.filter((p) => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                          p.categoria.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          p.pruebas.some((prueba: any) => prueba.codigo.toLowerCase().includes(busqueda.toLowerCase()) || prueba.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    
    const matchCategoria = filtroCategoria === "Todas" || p.categoria.nombre === filtroCategoria;
    
    const matchEstado = filtroEstado === "Todos" 
      ? true 
      : filtroEstado === "Activas" 
        ? p.activa === true 
        : p.activa === false;

    return matchBusqueda && matchCategoria && matchEstado;
  });

  const examenesAgrupados = pruebasFiltradas.reduce((acc, examen) => {
    const cat = examen.categoria.nombre;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(examen);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <ClipboardList className="text-[#0071E3]" size={36} strokeWidth={2.5} />
            Catálogo de Pruebas
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <p className="text-[#86868B] font-medium text-[15px]">Gestiona las categorías y subcategorías ({examenes.length} registradas).</p>
            <div className="h-5 w-px bg-slate-300"></div>
            <span className="text-[14px] font-black px-3 py-1.5 bg-[#0071E3]/10 text-[#0071E3] rounded-lg border border-[#0071E3]/20 flex items-center gap-1.5">
              <DollarSign size={16} strokeWidth={3} />
              BCV: {loadingTasa ? "Cargando..." : `Bs ${tasaBCV.toFixed(2)}`}
            </span>
          </div>
        </div>
        <button 
          onClick={abrirModalNuevo}
          className="bg-[#0071E3] text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-[0_4px_12px_rgba(0,113,227,0.25)] hover:bg-[#0077ED] transition-all active:scale-95 shrink-0"
        >
          <Plus size={20} strokeWidth={2.5} />
          Nueva Subcategoría
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="mb-6 flex gap-3 shrink-0 relative z-20">
        
        {/* Buscador */}
        <div className="relative flex-1 min-w-[300px]">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200/80 rounded-2xl text-[#1D1D1F] text-[15px] font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-[#0071E3]/10 focus:border-[#0071E3]/40 transition-all placeholder:text-slate-400"
            placeholder="Buscar por código (Ej. HEM-01)..."
          />
        </div>

        {/* CUSTOM DROPDOWN CATEGORÍA */}
        <div className="relative w-[280px] shrink-0" ref={dropdownCategoriaRef}>
          <button
            onClick={() => setOpenDropdownCategoria(!openDropdownCategoria)}
            className={`w-full flex items-center justify-between pl-4 pr-4 py-4 bg-white border rounded-2xl text-[14px] font-bold shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#0071E3]/10 ${
              openDropdownCategoria ? 'border-[#0071E3]/40' : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 text-[#1D1D1F]">
              <Filter className="h-4 w-4 text-[#0071E3]" />
              <span className="truncate">Categoría: {filtroCategoria}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${openDropdownCategoria ? 'rotate-180' : ''}`} />
          </button>

          {openDropdownCategoria && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 z-50">
              <button 
                onClick={() => { setFiltroCategoria("Todas"); setOpenDropdownCategoria(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${
                  filtroCategoria === "Todas" ? 'bg-[#0071E3]/5 text-[#0071E3]' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Todas las categorías
                {filtroCategoria === "Todas" && <Check className="h-4 w-4" />}
              </button>
              <div className="h-px bg-slate-100 my-1 mx-2"></div>
              {categoriasExistentes.map(cat => (
                <button 
                  key={cat}
                  onClick={() => { setFiltroCategoria(cat); setOpenDropdownCategoria(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${
                    filtroCategoria === cat ? 'bg-[#0071E3]/5 text-[#0071E3]' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {filtroCategoria === cat && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CUSTOM DROPDOWN ESTADO */}
        <div className="relative w-[220px] shrink-0" ref={dropdownEstadoRef}>
          <button
            onClick={() => setOpenDropdownEstado(!openDropdownEstado)}
            className={`w-full flex items-center justify-between pl-4 pr-4 py-4 bg-white border rounded-2xl text-[14px] font-bold shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#0071E3]/10 ${
              openDropdownEstado ? 'border-[#0071E3]/40' : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 text-[#1D1D1F]">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <span className="truncate">Estado: {filtroEstado}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${openDropdownEstado ? 'rotate-180' : ''}`} />
          </button>

          {openDropdownEstado && (
            <div className="absolute top-full right-0 w-full mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 z-50">
              {["Todos", "Activas", "Inhabilitadas"].map((estado) => (
                <button 
                  key={estado}
                  onClick={() => { setFiltroEstado(estado); setOpenDropdownEstado(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${
                    filtroEstado === estado ? 'bg-[#0071E3]/5 text-[#0071E3]' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {estado === "Todos" ? "Todos los estados" : estado}
                  {filtroEstado === estado && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full z-10 relative">
        {cargando ? (
          <div className="h-full flex items-center justify-center text-slate-400 font-bold">Cargando catálogo...</div>
        ) : pruebasFiltradas.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 font-medium opacity-60">
            <TestTubes size={48} strokeWidth={1.5} className="mb-4" />
            <p>No se encontraron registros con esos filtros.</p>
          </div>
        ) : (
          /* FIX TYPESCRIPT: Aseguramos el tipo del array */
          (Object.entries(examenesAgrupados) as [string, any[]][]).map(([nombreCategoria, examenesDeCategoria]) => (
            <div key={nombreCategoria} className="space-y-4">
              
              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100/50 px-4 py-1.5 rounded-full border border-slate-200 flex items-center gap-2 shadow-sm">
                  <Tags size={12} className="text-[#0071E3]" />
                  {nombreCategoria}
                </span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              {examenesDeCategoria.map((examen) => {
                const isExpanded = examenExpandido === examen.id;

                return (
                  <div 
                    key={examen.id} 
                    className={`group flex flex-col p-6 rounded-[24px] border shadow-sm hover:shadow-md transition-all duration-300 ${
                      examen.activa 
                        ? 'bg-white border-slate-200/80 hover:border-[#0071E3]/30' 
                        : 'bg-red-50/50 border-red-200/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col w-[50%]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${
                            examen.activa ? 'bg-[#0071E3]/10 text-[#0071E3]' : 'bg-red-100 text-red-500'
                          }`}>
                            <Tags size={14} strokeWidth={2.5} />
                            Categoría: {examen.categoria.nombre}
                          </span>
                          {!examen.activa && (
                            <span className="text-[11px] font-bold text-red-400 flex items-center gap-1">
                              <Ban size={14} /> Subcategoría Inhabilitada
                            </span>
                          )}
                        </div>
                        
                        <h3 className={`font-black text-2xl tracking-tight flex items-center gap-2.5 ${examen.activa ? 'text-[#1D1D1F]' : 'text-red-900/60 line-through'}`}>
                          <FlaskConical size={26} strokeWidth={2.5} className={examen.activa ? "text-[#0071E3]" : "text-red-400"} />
                          {examen.nombre}
                        </h3>
                      </div>

                      <div className="flex items-center justify-end gap-4 w-[50%]">
                        <button 
                          onClick={() => toggleExpandir(examen.id)}
                          className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all border ${
                            isExpanded 
                              ? 'bg-[#0071E3]/10 border-[#0071E3]/30 text-[#0071E3]' 
                              : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100 hover:text-[#0071E3]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Activity size={18} strokeWidth={2.5} />
                            <span className="text-sm font-bold">Ver {examen.pruebas.length} Pruebas Individuales</span>
                          </div>
                          <div className={isExpanded ? 'text-[#0071E3]' : 'text-slate-400'}>
                            {isExpanded ? <ChevronUp size={18} strokeWidth={3} /> : <ChevronDown size={18} strokeWidth={3} />}
                          </div>
                        </button>

                        <div className="h-8 w-px bg-slate-200"></div>

                        <button 
                          onClick={() => abrirModalEditar(examen)}
                          className={`p-2.5 rounded-xl transition-colors ${
                            examen.activa 
                              ? 'text-slate-400 hover:text-[#0071E3] hover:bg-blue-50 border border-transparent hover:border-blue-100' 
                              : 'text-red-400 hover:text-red-600 hover:bg-red-100 border border-transparent hover:border-red-200'
                          }`}
                          title="Editar subcategoría completa"
                        >
                          <Edit2 size={20} strokeWidth={2.5} />
                        </button>
                        
                        <button 
                          onClick={() => toggleEstadoSubcategoria(examen.id, examen.activa)}
                          className={`p-2.5 rounded-xl transition-colors flex items-center justify-center ${
                            examen.activa 
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100' 
                              : 'text-green-600 bg-green-100 hover:bg-green-200 shadow-sm border border-green-200'
                          }`}
                          title={examen.activa ? "Desactivar subcategoría completa" : "Activar subcategoría"}
                        >
                          {examen.activa ? <Ban size={20} strokeWidth={2.5} /> : <CheckCircle2 size={20} strokeWidth={2.5} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-6 pt-5 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex items-center px-4 py-2 mb-2 text-[10px] font-black text-[#1D1D1F] uppercase tracking-widest">
                          <div className="w-[35%] pl-2">Ítem / Prueba</div>
                          <div className="w-[20%] text-center">Referencia</div> 
                          <div className="w-[15%] text-center">Unidades</div>   
                          <div className="w-[30%] text-right pr-2">Precio y Estado</div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {examen.pruebas.length === 0 ? (
                            <div className="p-6 bg-slate-50 rounded-2xl text-center text-slate-400 text-sm font-medium border border-slate-200/50 border-dashed">
                              No hay pruebas asignadas a esta subcategoría.
                            </div>
                          ) : (
                            examen.pruebas.map((p: any, index: number) => {
                              const isPar = index % 2 === 0;
                              const bgFondoFila = p.activa && examen.activa
                                ? (isPar ? 'bg-[#E8F2FF] border-[#0071E3]/20' : 'bg-[#E8F2FF]/40 border-[#0071E3]/10')
                                : 'bg-slate-50/50 border-slate-200/40 opacity-75';

                              return (
                                <div 
                                  key={p.id} 
                                  className={`flex items-center px-5 py-4 rounded-2xl border transition-all shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] hover:border-[#0071E3]/40 ${bgFondoFila}`}
                                >
                                  <div className="flex items-center gap-4 w-[35%]">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-black tracking-wider shrink-0 ${
                                      p.activa && examen.activa ? 'bg-white text-[#0071E3] shadow-sm' : 'bg-red-100/50 text-red-400'
                                    }`}>
                                      {p.codigo}
                                    </span>
                                    <span className={`font-black text-[14px] uppercase tracking-wide truncate pr-2 ${
                                      p.activa && examen.activa ? 'text-[#1D1D1F]' : 'text-slate-400 line-through'
                                    }`}>
                                      {p.nombre}
                                    </span>
                                  </div>

                                  <div className="w-[20%] flex justify-center">
                                    {p.valoresReferencia ? (
                                      <span className="text-[13px] font-bold text-[#1D1D1F] bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                        {p.valoresReferencia}
                                      </span>
                                    ) : <span className="text-slate-300">-</span>}
                                  </div>

                                  <div className="w-[15%] flex justify-center">
                                    {p.unidades ? (
                                      <span className="text-[13px] font-bold text-[#1D1D1F] bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                        {p.unidades}
                                      </span>
                                    ) : <span className="text-slate-300">-</span>}
                                  </div>

                                  <div className="w-[30%] flex items-center justify-end gap-5">
                                    <span className={`font-black text-[16px] ${p.activa && examen.activa ? 'text-[#1D1D1F]' : 'text-slate-400'}`}>
                                      ${p.precioUSD.toFixed(2)}
                                    </span>
                                    
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => abrirModalEditarItem(p)}
                                        disabled={!examen.activa} 
                                        className={`p-2 rounded-lg transition-colors shadow-sm border ${
                                          !examen.activa 
                                            ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                            : 'bg-blue-50 text-[#0071E3] border-blue-200 hover:bg-[#0071E3] hover:text-white' 
                                        }`}
                                        title="Editar prueba individual"
                                      >
                                        <Edit2 size={16} strokeWidth={2.5}/>
                                      </button>

                                      <button
                                        onClick={() => toggleEstadoPruebaIndividual(p.id, p.activa)}
                                        disabled={!examen.activa} 
                                        className={`p-2 rounded-lg transition-colors shadow-sm border ${
                                          !examen.activa 
                                            ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                            : p.activa 
                                              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white' 
                                              : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-600 hover:text-white'
                                        }`}
                                        title={p.activa ? "Inhabilitar prueba" : "Activar prueba"}
                                      >
                                        {p.activa ? <Ban size={16} strokeWidth={2.5}/> : <CheckCircle2 size={16} strokeWidth={2.5}/>}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <ModalPrueba 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSavePrueba}
        pruebaEditar={pruebaEditando}
        categoriasExistentes={categoriasExistentes}
      />

      <ModalPruebaIndividual 
        isOpen={isModalItemOpen} 
        onClose={() => setIsModalItemOpen(false)} 
        onSave={handleSavePruebaIndividual}
        itemEditar={itemEditando}
      />
    </div>
  );
}