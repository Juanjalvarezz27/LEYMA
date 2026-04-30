"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Ban, CheckCircle2, Search, TestTubes, DollarSign, ClipboardList } from "lucide-react";
import { toast } from "react-toastify";
import ModalPrueba from "../../components/pruebas/ModalPrueba";

import useTasaBCV from "../../hooks/useTasaBcv";

export default function PruebasPage() {
  const [pruebas, setPruebas] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pruebaEditando, setPruebaEditando] = useState<any>(null);

  const { tasa, loading: loadingTasa } = useTasaBCV();
  const tasaBCV = tasa ?? 36.5; 

  const fetchPruebas = async () => {
    try {
      const res = await fetch("/api/pruebas");
      const data = await res.json();
      setPruebas(data);
    } catch (error) {
      toast.error("Error al cargar el catálogo de pruebas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchPruebas();
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
      
      // Aquí atrapamos el error del backend y lo lanzamos para que el catch lo agarre
      if (!res.ok) throw new Error(data.error || "Ocurrió un error inesperado");

      toast.success(isEdit ? "Prueba actualizada" : "Prueba registrada exitosamente");
      setIsModalOpen(false);
      fetchPruebas();
    } catch (error: any) {
      // Toastify mostrará exactamente el mensaje que le mandamos desde la API
      toast.error(error.message);
    }
  };

  const toggleEstadoPrueba = async (id: string, estadoActual: boolean) => {
    try {
      const res = await fetch(`/api/pruebas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !estadoActual }),
      });
      if (res.ok) {
        toast.info(estadoActual ? "La prueba ha sido desactivada" : "La prueba está activa nuevamente");
        fetchPruebas();
      }
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  const abrirModalNuevo = () => {
    setPruebaEditando(null);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (prueba: any) => {
    setPruebaEditando(prueba);
    setIsModalOpen(true);
  };

  const pruebasFiltradas = pruebas.filter((p) => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Cabecera y Tasa BCV */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <ClipboardList className="text-[#0071E3]" size={36} strokeWidth={2.5} />
            Catálogo de Pruebas
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <p className="text-[#86868B] font-medium text-[15px]">Gestiona los exámenes disponibles ({pruebas.length} en total).</p>
            <div className="h-5 w-px bg-slate-300"></div>
            <span className="text-[14px] font-black px-3 py-1.5 bg-[#0071E3]/10 text-[#0071E3] rounded-lg border border-[#0071E3]/20 flex items-center gap-1.5">
              <DollarSign size={16} strokeWidth={3} />
              BCV: {loadingTasa ? "Cargando..." : `Bs ${tasaBCV.toFixed(2)}`}
            </span>
          </div>
        </div>
        <button 
          onClick={abrirModalNuevo}
          className="bg-[#0071E3] text-white px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(0,113,227,0.25)] hover:bg-[#0077ED] transition-all active:scale-95 shrink-0"
        >
          <Plus size={20} strokeWidth={2.5} />
          Nueva Prueba
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6 relative shrink-0">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200/80 rounded-2xl text-[#1D1D1F] text-[15px] font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-[#0071E3]/10 focus:border-[#0071E3]/40 transition-all placeholder:text-slate-400"
          placeholder="Buscar prueba por nombre o código (Ej. EX-01 o Glucosa)..."
        />
      </div>

      {/* Lista de Tarjetas Horizontales (Row Cards) */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {cargando ? (
          <div className="h-full flex items-center justify-center text-slate-400 font-medium">Cargando catálogo...</div>
        ) : pruebasFiltradas.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 font-medium opacity-60">
            <TestTubes size={48} strokeWidth={1.5} className="mb-4" />
            <p>No se encontraron pruebas con esa búsqueda.</p>
          </div>
        ) : (
          pruebasFiltradas.map((prueba) => (
            <div 
              key={prueba.id} 
              // Estilos dinámicos: Blanco si está activa, Rojo claro si está desactivada
              className={`group flex items-center justify-between px-6 py-4 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 ${
                prueba.activa 
                  ? 'bg-white border-slate-200/60 hover:border-[#0071E3]/30' 
                  : 'bg-red-50 border-red-200/60'
              }`}
            >
              {/* Lado Izquierdo: Código y Nombre */}
              <div className="flex items-center gap-5 w-1/2">
                <span className={`w-16 text-center py-1.5 rounded-lg text-[11px] font-mono font-bold tracking-wider shrink-0 border ${
                  prueba.activa 
                    ? 'bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20' 
                    : 'bg-red-100/50 text-red-500 border-red-200/50'
                }`}>
                  {prueba.codigo}
                </span>
                <h3 className={`font-semibold text-[15px] truncate pr-4 ${prueba.activa ? 'text-[#1D1D1F]' : 'text-red-900/60 line-through'}`}>
                  {prueba.nombre}
                </h3>
              </div>

              {/* Lado Derecho: Precios y Acciones */}
              <div className="flex items-center justify-end gap-10 w-1/2">
                
                <div className={`flex flex-col items-end shrink-0 ${!prueba.activa && 'opacity-60'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Bolívares (BCV)</span>
                  <span className="text-sm font-medium text-slate-500">
                    Bs {(prueba.precioUSD * tasaBCV).toFixed(2)}
                  </span>
                </div>

                <div className={`flex flex-col items-end shrink-0 w-24 ${!prueba.activa && 'opacity-60'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Dólares</span>
                  <span className="text-xl font-black text-[#1D1D1F] leading-none">
                    ${prueba.precioUSD.toFixed(2)}
                  </span>
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-1 shrink-0 border-l border-slate-200/60 pl-4">
                  <button 
                    onClick={() => abrirModalEditar(prueba)}
                    className={`p-2 rounded-xl transition-colors ${
                      prueba.activa 
                        ? 'text-slate-400 hover:text-[#0071E3] hover:bg-blue-50' 
                        : 'text-red-400 hover:text-red-600 hover:bg-red-100'
                    }`}
                    title="Editar prueba"
                  >
                    <Edit2 size={18} strokeWidth={2.5} />
                  </button>
                  
                  {/* Botón de Desactivar / Activar (Con colores vibrantes para que destaque) */}
                  <button 
                    onClick={() => toggleEstadoPrueba(prueba.id, prueba.activa)}
                    className={`p-2 rounded-xl transition-colors flex items-center justify-center ${
                      prueba.activa 
                        ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' 
                        : 'text-green-600 bg-green-100 hover:bg-green-200 hover:text-green-700 shadow-sm'
                    }`}
                    title={prueba.activa ? "Desactivar prueba" : "Activar prueba"}
                  >
                    {prueba.activa ? <Ban size={18} strokeWidth={2.5} /> : <CheckCircle2 size={18} strokeWidth={2.5} />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ModalPrueba 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSavePrueba}
        pruebaEditar={pruebaEditando}
      />
    </div>
  );
}