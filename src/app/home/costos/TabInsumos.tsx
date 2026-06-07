"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, Box, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { toast } from "react-toastify";
import ModalConfirmacion from "../../components/ui/ModalConfirmacion";

export default function TabInsumos() {
  const [insumos, setInsumos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [showForm, setShowForm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaUnidad, setNuevaUnidad] = useState("und");
  const [nuevaCantidad, setNuevaCantidad] = useState("");
  const [nuevoCostoTotal, setNuevoCostoTotal] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const unidadesOptions = [
    { value: "und", label: "Unidades (und)" },
    { value: "ml", label: "Mililitros (ml)" },
    { value: "mg", label: "Miligramos (mg)" },
    { value: "kit", label: "Kit Completo" }
  ];

  // Edit Mode
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editCosto, setEditCosto] = useState("");

  // Modal Eliminar
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [insumoToDelete, setInsumoToDelete] = useState<number | null>(null);

  const fetchInsumos = async () => {
    try {
      const res = await fetch("/api/costos/insumos");
      const data = res.ok ? await res.json() : [];
      setInsumos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error?.message || "Error al cargar insumos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoCostoTotal || !nuevaCantidad) return toast.warning("Completa los campos");

    const cantidad = parseFloat(nuevaCantidad);
    const costoTotal = parseFloat(nuevoCostoTotal);
    if (cantidad <= 0) return toast.warning("La cantidad debe ser mayor a 0");

    const costoUnitarioCalculado = costoTotal / cantidad;
 
    try {
      const res = await fetch("/api/costos/insumos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombre, unidadMedida: nuevaUnidad, costoUnitarioUSD: costoUnitarioCalculado })
      });
      if (res.ok) {
        toast.success("Insumo registrado");
        setNuevoNombre("");
        setNuevaCantidad("");
        setNuevoCostoTotal("");
        setShowForm(false);
        fetchInsumos();
        setCurrentPage(1); // Go back to first page
      }
    } catch (error: any) {
      toast.error(error?.message || "Error al agregar");
    }
  };

  const handleEliminarRequest = (id: number) => {
    setInsumoToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmarEliminacion = async () => {
    if (!insumoToDelete) return;
    try {
      const res = await fetch(`/api/costos/insumos/${insumoToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Insumo eliminado");
        fetchInsumos();
      }
    } catch (error: any) {
      toast.error(error?.message || "Error al eliminar");
    } finally {
      setIsDeleteModalOpen(false);
      setInsumoToDelete(null);
    }
  };

  const handleGuardarEdicion = async (id: number) => {
    if (!editNombre.trim() || !editCosto) return toast.warning("Nombre y costo requeridos");
    try {
      const res = await fetch(`/api/costos/insumos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: editNombre, costoUnitarioUSD: parseFloat(editCosto) })
      });
      if (res.ok) {
        toast.success("Insumo actualizado");
        setEditId(null);
        fetchInsumos();
      }
    } catch (error: any) {
      toast.error(error?.message || "Error al actualizar");
    }
  };

  // Search logic
  const filteredInsumos = insumos.filter(i => i.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInsumos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInsumos.length / itemsPerPage);

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Cargando inventario...</div>;

  return (
    <div className="w-full relative">
      <ModalConfirmacion
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmarEliminacion}
        titulo="Eliminar Insumo"
        mensaje="¿Estás seguro de que deseas eliminar este insumo del inventario? Si lo eliminas, los exámenes que lo usan en su receta podrían quedar incompletos."
        textoConfirmar="Eliminar Insumo"
        textoCancelar="Cancelar"
        colorBoton="red"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Inventario de Insumos
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Registra los reactivos y materiales descartables que consumes por prueba.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar insumo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] outline-none text-sm transition-all font-medium"
            />
          </div>
          <div className="text-left md:text-right bg-blue-50/50 px-5 py-3 rounded-2xl border border-blue-100/50 hidden md:block">
            <p className="text-[11px] font-black text-[#0071E3]/70 uppercase tracking-widest mb-1">Total en Inventario</p>
            <p className="text-2xl font-black text-[#0071E3] leading-none">{insumos.length}</p>
          </div>
        </div>
      </div>

      {!showForm ? (
        <div className="flex justify-end mb-6">
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:border-[#0071E3] hover:text-[#0071E3] hover:shadow-md transition-all shadow-sm"
          >
            <Plus size={20} strokeWidth={2.5} /> Agregar Nuevo Insumo
          </button>
        </div>
      ) : (
        <form onSubmit={handleAgregar} className="bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-8 mb-8 transform transition-all relative z-20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0071E3] to-blue-400 rounded-t-3xl"></div>
          <h3 className="font-black text-slate-800 mb-6 text-lg">Registrar Nuevo Material</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Nombre</label>
              <input
                type="text"
                placeholder="Ej. Tubo Tapa Roja"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] outline-none transition-all font-medium"
                autoFocus
                required
              />
            </div>
            
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Unidad</label>
              <div 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer focus:ring-4 focus:ring-blue-50 transition-all"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="text-slate-700 font-medium">{unidadesOptions.find(o => o.value === nuevaUnidad)?.label}</span>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl py-2">
                  {unidadesOptions.map(option => (
                    <div 
                      key={option.value}
                      className={`px-5 py-3 text-sm cursor-pointer hover:bg-blue-50 hover:text-[#0071E3] transition-colors ${nuevaUnidad === option.value ? 'bg-blue-50 text-[#0071E3] font-bold' : 'text-slate-600 font-medium'}`}
                      onClick={() => {
                        setNuevaUnidad(option.value);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Cantidad Comprada</label>
              <input
                type="number"
                placeholder="Ej. 100"
                value={nuevaCantidad}
                onChange={(e) => setNuevaCantidad(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] outline-none transition-all font-mono font-medium"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Costo Total (USD)</label>
              <div className="relative">
                <span className="absolute left-5 top-3.5 text-slate-400 font-black">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={nuevoCostoTotal}
                  onChange={(e) => setNuevoCostoTotal(e.target.value)}
                  className="w-full pl-10 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] outline-none transition-all font-mono font-medium"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>
          
          {nuevaCantidad && nuevoCostoTotal && parseFloat(nuevaCantidad) > 0 && (
            <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50/30 rounded-2xl border border-blue-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white text-[#0071E3] flex items-center justify-center font-black shadow-sm">
                $
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Costo Unitario Calculado</p>
                <p className="font-mono font-black text-[#0071E3] text-2xl leading-none">
                  ${(parseFloat(nuevoCostoTotal) / parseFloat(nuevaCantidad)).toFixed(4)} <span className="text-sm font-bold text-slate-400 ml-1">/ {nuevaUnidad}</span>
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">
              Cancelar
            </button>
            <button type="submit" className="px-8 py-3 bg-[#0071E3] text-white font-bold rounded-xl hover:bg-blue-600 transition shadow-md shadow-blue-500/20">
              Guardar en Inventario
            </button>
          </div>
        </form>
      )}

      {filteredInsumos.length === 0 && !showForm ? (
         <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
             <Box size={32} />
           </div>
           <p className="text-slate-500 font-medium">{searchTerm ? "No se encontraron insumos con esa búsqueda." : "No tienes insumos registrados."}</p>
         </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                  <th className="px-6 py-5">Nombre del Insumo</th>
                  <th className="px-6 py-5 text-center">Unidad</th>
                  <th className="px-6 py-5 text-right">Costo Unitario (USD)</th>
                  <th className="px-6 py-5 text-center w-32">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentItems.map(insumo => (
                  <tr key={insumo.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                          <Box size={18} />
                        </div>
                        {editId === insumo.id ? (
                          <input 
                            type="text" 
                            value={editNombre}
                            onChange={e => setEditNombre(e.target.value)}
                            className="w-full px-3 py-2 bg-white border-2 border-[#0071E3] rounded-xl outline-none font-medium text-sm shadow-sm"
                          />
                        ) : (
                          <span className="font-bold text-slate-700 text-[15px]">{insumo.nombre}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-black rounded-lg uppercase tracking-wider border border-slate-200">
                        {insumo.unidadMedida}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editId === insumo.id ? (
                        <div className="flex items-center justify-end">
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                            <input 
                              type="number" 
                              value={editCosto}
                              onChange={e => setEditCosto(e.target.value)}
                              className="w-28 pl-7 pr-3 py-2 bg-white border-2 border-[#0071E3] rounded-xl outline-none font-mono text-sm shadow-sm"
                              step="0.0001"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono text-lg font-black text-slate-700 group-hover:text-[#0071E3] transition-colors">
                          ${insumo.costoUnitarioUSD.toFixed(4)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {editId === insumo.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleGuardarEdicion(insumo.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#0071E3] text-white hover:bg-blue-600 transition shadow-sm" title="Guardar cambios">
                            <Check size={18} strokeWidth={3} />
                          </button>
                          <button onClick={() => setEditId(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition" title="Descartar cambios">
                            <X size={18} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => { 
                              setEditId(insumo.id); 
                              setEditNombre(insumo.nombre);
                              setEditCosto(insumo.costoUnitarioUSD.toString()); 
                            }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-[#0071E3] hover:bg-blue-50 bg-slate-50 transition-all border border-slate-100 shadow-sm hover:shadow"
                            title="Editar insumo"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleEliminarRequest(insumo.id)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 bg-slate-50 transition-all border border-slate-100 shadow-sm hover:shadow"
                            title="Eliminar insumo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-6 bg-slate-50 border-t border-slate-100">
              <span className="text-sm font-medium text-slate-500">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredInsumos.length)} de {filteredInsumos.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors bg-white shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-4 py-2 rounded-xl bg-blue-50 text-[#0071E3] font-bold text-sm">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors bg-white shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
