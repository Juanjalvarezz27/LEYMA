"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Trash2, CheckCircle2, ChevronRight, Calculator, FlaskConical, Beaker, ChevronDown, TrendingUp } from "lucide-react";
import { toast } from "react-toastify";
import ModalConfirmacion from "../../components/ui/ModalConfirmacion";

export default function TabEnsamblador() {
  const [examenes, setExamenes] = useState<any[]>([]);
  const [insumosDisponibles, setInsumosDisponibles] = useState<any[]>([]);
  const [selectedPrueba, setSelectedPrueba] = useState<any>(null);
  
  // Datos del ensamblador
  const [receta, setReceta] = useState<any[]>([]);
  const [costoVariable, setCostoVariable] = useState(0);
  const [costoFijoUnitario, setCostoFijoUnitario] = useState(0);
  const [margenGanancia, setMargenGanancia] = useState(30);

  // Selector
  const [searchTerm, setSearchTerm] = useState("");
  const [insumoIdToAdd, setInsumoIdToAdd] = useState("");
  const [cantidadToAdd, setCantidadToAdd] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchInsumo, setSearchInsumo] = useState("");

  // Modal Eliminar Insumo de Receta
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [insumoToRemove, setInsumoToRemove] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/pruebas").then(r => r.json()),
      fetch("/api/costos/insumos").then(r => r.json())
    ]).then(([examenesData, insumosData]) => {
      setExamenes(Array.isArray(examenesData) ? examenesData : []);
      setInsumosDisponibles(Array.isArray(insumosData) ? insumosData : []);
      setLoading(false);
    }).catch(() => {
      toast.error("Error al cargar datos base");
      setLoading(false);
    });
  }, []);

  const todasLasPruebas = examenes.flatMap(sub => sub.pruebas || []);
  const filteredPruebas = todasLasPruebas.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInsumosDisponibles = insumosDisponibles.filter(i =>
    i.nombre.toLowerCase().includes(searchInsumo.toLowerCase())
  );

  const cargarEnsamblaje = async (pruebaId: string) => {
    try {
      const res = await fetch(`/api/costos/ensamblador/${pruebaId}`);
      if (!res.ok) throw new Error("Error en la solicitud");
      const data = await res.json();
      
      setSelectedPrueba(data.prueba);
      const recetaCargada = data.receta.map((r: any) => ({ ...r.insumo, cantidadUsada: r.cantidadUsada, insumoId: r.insumoId }));
      setReceta(recetaCargada);
      setCostoFijoUnitario(data.costoFijoPorPrueba || 0);
      recalcularTotal(recetaCargada);
    } catch (error) {
      toast.error("Error al cargar la receta del examen");
    }
  };

  const recalcularTotal = (recetaActual: any[]) => {
    const total = recetaActual.reduce((sum, item) => sum + (item.cantidadUsada * item.costoUnitarioUSD), 0);
    setCostoVariable(total);
  };

  const handleAgregarInsumo = () => {
    if (!insumoIdToAdd || !cantidadToAdd) return toast.warning("Seleccione un insumo y su cantidad");
    const insumo = insumosDisponibles.find(i => i.id === parseInt(insumoIdToAdd));
    if (!insumo) return;

    if (receta.find(r => r.insumoId === insumo.id)) {
      return toast.warning("El insumo ya está en la receta");
    }

    const nuevaReceta = [...receta, { ...insumo, insumoId: insumo.id, cantidadUsada: parseFloat(cantidadToAdd) }];
    setReceta(nuevaReceta);
    recalcularTotal(nuevaReceta);
    
    setInsumoIdToAdd("");
    setCantidadToAdd("");
    setSearchInsumo("");
  };

  const handleEliminarRequest = (insumoId: number) => {
    setInsumoToRemove(insumoId);
    setIsDeleteModalOpen(true);
  };

  const confirmarEliminacion = () => {
    if (insumoToRemove === null) return;
    const nuevaReceta = receta.filter(r => r.insumoId !== insumoToRemove);
    setReceta(nuevaReceta);
    recalcularTotal(nuevaReceta);
    setIsDeleteModalOpen(false);
    setInsumoToRemove(null);
  };

  const handleGuardarEnsamble = async () => {
    try {
      const res = await fetch(`/api/costos/ensamblador/${selectedPrueba.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receta: receta.map(r => ({ insumoId: r.insumoId, cantidadUsada: r.cantidadUsada }))
        })
      });
      if (res.ok) {
        toast.success("Estructura guardada con éxito");
        cargarEnsamblaje(selectedPrueba.id);
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Error al guardar la estructura");
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Cargando módulos...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: '750px' }}>
      <ModalConfirmacion
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmarEliminacion}
        titulo="Remover Insumo"
        mensaje="¿Estás seguro de que deseas remover este insumo de la receta? Podrás volver a agregarlo después."
        textoConfirmar="Remover Insumo"
        textoCancelar="Cancelar"
        colorBoton="red"
      />
      
      {/* Sidebar: Catálogo de Exámenes */}
      <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100 shrink-0 h-full">
        <div className="p-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0071E3] flex items-center justify-center">
              <FlaskConical size={20} strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-slate-800 text-xl tracking-tight">Catálogo</h3>
          </div>
          <p className="text-slate-500 text-sm mb-5 font-medium">Selecciona un examen para definir su estructura de reactivos y costos.</p>
          
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar examen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] outline-none text-sm shadow-sm transition-all font-medium"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {filteredPruebas.map(prueba => (
            <button 
              key={prueba.id}
              onClick={() => cargarEnsamblaje(prueba.id)}
              className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group border border-transparent ${
                selectedPrueba?.id === prueba.id 
                  ? "bg-[#0071E3] text-white shadow-md shadow-blue-500/20 translate-x-1" 
                  : "bg-white hover:bg-slate-50 hover:translate-x-1 hover:border-slate-100"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    selectedPrueba?.id === prueba.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {prueba.codigo}
                  </span>
                  {prueba.precioUSD !== undefined && prueba.precioUSD !== null && (
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${
                      selectedPrueba?.id === prueba.id ? "bg-white/10 text-white" : "bg-green-50 text-green-600"
                    }`}>
                      ${prueba.precioUSD.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-2.5 font-bold line-clamp-2 ${
                  selectedPrueba?.id === prueba.id ? "text-white" : "text-slate-700"
                }`}>
                  {prueba.nombre}
                </p>
              </div>
              <ChevronRight size={18} className={selectedPrueba?.id === prueba.id ? "text-white opacity-100" : "text-slate-300 group-hover:text-[#0071E3] opacity-0 group-hover:opacity-100 transition-all"} />
            </button>
          ))}
          {filteredPruebas.length === 0 && (
            <div className="text-center p-8 text-slate-400 font-medium">No se encontraron exámenes</div>
          )}
        </div>
      </div>

      {/* Main Area: Ensamblador */}
      <div className="w-full lg:w-2/3 flex flex-col relative bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden h-full">
        {!selectedPrueba ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
              <Calculator size={40} className="text-slate-300" strokeWidth={1.5} />
            </div>
            <h3 className="font-bold text-xl text-slate-600 mb-2">Ensamblador de Costos</h3>
            <p className="font-medium text-slate-500">Selecciona un examen del panel izquierdo</p>
          </div>
        ) : (
          <div className="flex flex-col h-full min-h-0">
            
            <div className="p-6 bg-gradient-to-br from-[#0071E3] to-blue-600 text-white relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-xl uppercase tracking-widest shadow-sm">
                    Examen Seleccionado • {selectedPrueba.codigo}
                  </div>
                  {selectedPrueba.precioUSD !== undefined && selectedPrueba.precioUSD !== null && (
                    <div className="inline-block px-3 py-1 bg-green-500/80 backdrop-blur-md text-white text-xs font-bold rounded-xl uppercase tracking-widest shadow-sm border border-green-400/50">
                      Precio de Venta: ${selectedPrueba.precioUSD.toFixed(2)}
                    </div>
                  )}
                </div>
                <h2 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight mb-1">
                  {selectedPrueba.nombre}
                </h2>
                <p className="text-blue-100 font-medium text-sm">Define exactamente qué insumos y reactivos se consumen al realizar esta prueba.</p>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col min-h-0">
              {/* Formulario Añadir Insumo */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-4 shrink-0 shadow-inner">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Beaker size={18} className="text-[#0071E3]" />
                  Añadir Insumo a la Receta
                </h4>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1 min-w-0">
                    <div 
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer focus:ring-4 focus:ring-blue-50 transition-all shadow-sm min-w-0"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span className="text-slate-700 font-medium text-sm truncate pr-4">
                        {insumoIdToAdd ? `${insumosDisponibles.find(i => i.id === parseInt(insumoIdToAdd))?.nombre} ($${insumosDisponibles.find(i => i.id === parseInt(insumoIdToAdd))?.costoUnitarioUSD.toFixed(4)} / ${insumosDisponibles.find(i => i.id === parseInt(insumoIdToAdd))?.unidadMedida})` : "Selecciona un insumo del inventario..."}
                      </span>
                      <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 flex flex-col" style={{ maxHeight: "300px" }}>
                        <div className="px-3 pb-2 pt-1 shrink-0 border-b border-slate-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                            <input 
                              type="text"
                              placeholder="Buscar insumo..."
                              value={searchInsumo}
                              onChange={e => setSearchInsumo(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0071E3]"
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {filteredInsumosDisponibles.map(i => (
                            <div 
                              key={i.id}
                              className={`px-5 py-3 text-sm cursor-pointer hover:bg-blue-50 hover:text-[#0071E3] transition-colors ${insumoIdToAdd === i.id.toString() ? 'bg-blue-50 text-[#0071E3] font-bold' : 'text-slate-600 font-medium'}`}
                              onClick={() => {
                                setInsumoIdToAdd(i.id.toString());
                                setIsDropdownOpen(false);
                                setSearchInsumo("");
                              }}
                            >
                              {i.nombre} <span className="text-xs text-slate-400 font-mono ml-2 whitespace-nowrap">(${i.costoUnitarioUSD.toFixed(4)} / {i.unidadMedida})</span>
                            </div>
                          ))}
                          {filteredInsumosDisponibles.length === 0 && (
                            <div className="px-5 py-4 text-sm text-slate-400 font-medium text-center">No se encontraron insumos.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative w-full xl:w-40 shrink-0">
                    <input
                      type="number"
                      placeholder="Cantidad"
                      value={cantidadToAdd}
                      onChange={(e) => setCantidadToAdd(e.target.value)}
                      className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#0071E3] transition-all font-mono shadow-sm"
                      min="0.0001"
                      step="0.0001"
                    />
                    <span className="absolute right-4 top-3.5 text-slate-400 text-xs font-bold bg-white">
                      {insumoIdToAdd ? insumosDisponibles.find(i => i.id === parseInt(insumoIdToAdd))?.unidadMedida : ""}
                    </span>
                  </div>
                  <button 
                    onClick={handleAgregarInsumo}
                    className="bg-[#0071E3] text-white px-8 py-3.5 rounded-2xl hover:bg-blue-600 font-bold text-sm transition-all shadow-md shadow-blue-500/20 shrink-0 flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Agregar
                  </button>
                </div>
              </div>

              {/* Lista de receta actual */}
              <div className="flex-1 flex flex-col min-h-0">
                <h4 className="text-sm font-bold text-slate-800 mb-3 shrink-0">Estructura Actual</h4>
                
                <div className="flex-1 overflow-auto rounded-2xl border border-slate-100 shadow-sm mb-4 bg-white" style={{ minHeight: '180px' }}>
                  <table className="w-full text-left bg-white relative">
                    <thead className="sticky top-0 bg-slate-50 shadow-sm z-10 border-b border-slate-100">
                      <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Insumo / Reactivo</th>
                        <th className="px-6 py-4 text-center">Cantidad Usada</th>
                        <th className="px-6 py-4 text-right">Costo Parcial</th>
                        <th className="px-6 py-4 text-center w-24">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {receta.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-16 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-300 mb-4">
                              <Beaker size={24} />
                            </div>
                            <p className="text-slate-500 font-medium">La receta de este examen está vacía.</p>
                            <p className="text-slate-400 text-sm">Agrega insumos usando el formulario de arriba.</p>
                          </td>
                        </tr>
                      )}
                      {receta.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-700 text-sm">{item.nombre}</p>
                            <p className="text-xs text-slate-400 mt-1 font-mono">${item.costoUnitarioUSD.toFixed(4)} / {item.unidadMedida}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold border border-slate-200 shadow-sm">
                              {item.cantidadUsada} <span className="text-slate-400 text-xs ml-1">{item.unidadMedida}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-mono font-black text-[#0071E3] text-base">
                              ${(item.cantidadUsada * item.costoUnitarioUSD).toFixed(4)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <button 
                                onClick={() => handleEliminarRequest(item.insumoId)} 
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 bg-slate-50 transition-all border border-slate-100 shadow-sm hover:shadow"
                                title="Remover insumo de la receta"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer / Resumen */}
                <div className="mt-auto bg-slate-900 rounded-2xl shadow-xl relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  
                  {/* Fila de costos */}
                  <div className="relative z-10 flex items-stretch border-b border-slate-700/40">
                    <div className="flex-1 p-4 text-center border-r border-slate-700/40">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Fijo (Absorbido)</p>
                      <p className="text-xl font-black text-white">${costoFijoUnitario.toFixed(2)}</p>
                    </div>
                    <div className="flex-1 p-4 text-center border-r border-slate-700/40">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Variable (Reactivos)</p>
                      <p className="text-xl font-black text-white">${costoVariable.toFixed(2)}</p>
                    </div>
                    <div className="flex-1 p-4 text-center bg-blue-950/40">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Costo Total</p>
                      <p className="text-2xl font-black text-white">${(costoFijoUnitario + costoVariable).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Fila de margen y precio sugerido */}
                  <div className="relative z-10 flex items-stretch border-b border-slate-700/40">
                    <div className="flex-1 p-4 flex items-center justify-center gap-3 border-r border-slate-700/40">
                      <TrendingUp size={16} className="text-emerald-400 shrink-0" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Margen</p>
                      <div className="relative w-20">
                        <input
                          type="number"
                          value={margenGanancia}
                          onChange={(e) => setMargenGanancia(Math.min(99, Math.max(0, Number(e.target.value))))}
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono font-bold text-center text-sm outline-none focus:border-emerald-400 transition-colors"
                          min="0"
                          max="99"
                          step="1"
                        />
                        <span className="absolute right-2 top-1.5 text-slate-400 font-bold text-sm">%</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4 text-center bg-emerald-950/30">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Precio Sugerido</p>
                      <p className="text-2xl font-black text-emerald-300">
                        {margenGanancia > 0 && margenGanancia < 100
                          ? `$${((costoFijoUnitario + costoVariable) / (1 - margenGanancia / 100)).toFixed(2)}`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Fila del botón */}
                  <div className="relative z-10 p-3">
                    <button 
                      onClick={handleGuardarEnsamble}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/30"
                    >
                      <CheckCircle2 size={18} strokeWidth={2.5} /> GUARDAR RECETA
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

