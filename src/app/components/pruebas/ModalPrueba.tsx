"use client";
import { X, Plus, Trash2, ChevronDown, Loader2, Package, LayoutList, Search, Edit2, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

export default function ModalPrueba({ isOpen, onClose, onSave, pruebaEditar, categoriasExistentes, subcategoriasExistentes, catalogoExamenes = [] }: any) {
  const [formData, setFormData] = useState({ 
    categoria: "", 
    subcategoria: "", 
    esPaquete: false, 
    precioPaqueteUSD: "" 
  });
  const [pruebas, setPruebas] = useState<any[]>([]);
  
  const [openDropdownCategoria, setOpenDropdownCategoria] = useState(false);
  const [openDropdownSubcategoria, setOpenDropdownSubcategoria] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const dropdownCategoriaRef = useRef<HTMLDivElement>(null);
  const dropdownSubcategoriaRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [editingOption, setEditingOption] = useState<{pruebaIndex: number, optionIndex: number, tempValue: string} | null>(null);

  // Computar listado unificado para el buscador
  const individualTestsMap = new Map();
  catalogoExamenes.forEach((sub: any) => {
    (sub.pruebas || []).forEach((p: any) => {
      if (!individualTestsMap.has(p.codigo)) {
        individualTestsMap.set(p.codigo, {
          tipo: 'prueba',
          categoriaNombre: sub.categoria?.nombre || 'S/C',
          subcategoriaNombre: sub.nombre,
          ...p
        });
      }
    });
  });
  
  const pruebasIndividualesUnicas = Array.from(individualTestsMap.values());
  
  const subcategoriasYPaquetes = catalogoExamenes.map((cat: any) => ({
    tipo: cat.esPaquete ? 'paquete' : 'subcategoria',
    id: cat.id,
    nombre: cat.nombre,
    codigoCategoria: cat.categoria?.nombre || 'S/C',
    pruebas: cat.pruebas || []
  }));

  const busquedaUnificada = [...subcategoriasYPaquetes, ...pruebasIndividualesUnicas];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownCategoriaRef.current && !dropdownCategoriaRef.current.contains(event.target as Node)) {
        setOpenDropdownCategoria(false);
      }
      if (dropdownSubcategoriaRef.current && !dropdownSubcategoriaRef.current.contains(event.target as Node)) {
        setOpenDropdownSubcategoria(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSearchResults && searchRef.current && searchQuery.trim() !== "") {
      setTimeout(() => {
        searchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [showSearchResults, searchQuery]);

  useEffect(() => {
    if (pruebaEditar) {
      setFormData({ 
        categoria: pruebaEditar.categoria.nombre,
        subcategoria: pruebaEditar.nombre,
        esPaquete: pruebaEditar.esPaquete || false,
        precioPaqueteUSD: pruebaEditar.precioUSD ? pruebaEditar.precioUSD.toString() : ""
      });
      setPruebas(pruebaEditar.pruebas.map((p: any) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        precioUSD: p.precioUSD ? p.precioUSD.toString() : "",
        unidades: p.unidades || "",
        valoresReferencia: p.valoresReferencia || "",
        opcionesPredefinidas: p.opcionesPredefinidas ? p.opcionesPredefinidas.split(',').filter(Boolean) : [],
        mostrarOpciones: !!p.opcionesPredefinidas,
        categoriaVisual: p.categoriaVisual || "",
        subcategoriaVisual: p.subcategoriaVisual || ""
      })));
    } else {
      setFormData({ categoria: "", subcategoria: "", esPaquete: false, precioPaqueteUSD: "" });
      setPruebas([{ id: "", codigo: "", nombre: "", precioUSD: "", unidades: "", valoresReferencia: "", opcionesPredefinidas: [], mostrarOpciones: false, categoriaVisual: "", subcategoriaVisual: "" }]);
    }
    setGuardando(false);
  }, [pruebaEditar, isOpen]);

  if (!isOpen) return null;

  const agregarFila = () => {
    setPruebas([...pruebas, { id: "", codigo: "", nombre: "", precioUSD: "", unidades: "", valoresReferencia: "", opcionesPredefinidas: [], mostrarOpciones: false, categoriaVisual: "", subcategoriaVisual: "" }]);
  };

  const eliminarFila = (index: number) => {
    if (pruebas.length === 1) {
      toast.warning("Debe existir al menos una prueba.");
      return;
    }
    const nuevas = [...pruebas];
    nuevas.splice(index, 1);
    setPruebas(nuevas);
  };

  const agregarAlListadoBusqueda = (item: any) => {
    if (item.tipo === 'paquete' || item.tipo === 'subcategoria') {
      // Agregar todas sus pruebas (creando copias desvinculadas)
      const nuevasPruebas = item.pruebas.filter((p: any) => !pruebas.some((pr: any) => pr.codigo === p.codigo)).map((p: any) => ({
        id: "", // Forzamos vacío para que se cree como nueva prueba
        codigo: p.codigo, nombre: p.nombre, precioUSD: p.precioUSD ? p.precioUSD.toString() : "", 
        unidades: p.unidades || "", valoresReferencia: p.valoresReferencia || "", 
        opcionesPredefinidas: p.opcionesPredefinidas ? p.opcionesPredefinidas.split(',').filter(Boolean) : [], 
        mostrarOpciones: !!p.opcionesPredefinidas,
        categoriaVisual: item.codigoCategoria || "", // El nombre de la categoría del paquete original
        subcategoriaVisual: item.nombre // El nombre del paquete original
      }));
      
      if (nuevasPruebas.length > 0) {
        // Limpiamos el primer item si está vacío (cuando se abre el modal y se busca de inmediato)
        setPruebas(prev => {
          const prevLimpio = (prev.length === 1 && !prev[0].codigo && !prev[0].nombre) ? [] : prev;
          return [...prevLimpio, ...nuevasPruebas];
        });
        toast.success(`Se agregaron ${nuevasPruebas.length} pruebas de ${item.nombre}`);
      } else {
        toast.info("Todas las pruebas de este grupo ya estaban agregadas.");
      }
    } else {
      // Es una prueba individual
      if (!pruebas.some(pr => pr.codigo === item.codigo)) {
        setPruebas(prev => {
          const prevLimpio = (prev.length === 1 && !prev[0].codigo && !prev[0].nombre) ? [] : prev;
          return [...prevLimpio, { 
            id: "", // Forzamos vacío para que se cree como copia nueva
            codigo: item.codigo, nombre: item.nombre, precioUSD: item.precioUSD ? item.precioUSD.toString() : "", 
            unidades: item.unidades || "", valoresReferencia: item.valoresReferencia || "", 
            opcionesPredefinidas: item.opcionesPredefinidas ? item.opcionesPredefinidas.split(',').filter(Boolean) : [], 
            mostrarOpciones: !!item.opcionesPredefinidas,
            categoriaVisual: item.categoriaNombre || item.codigoCategoria || "",
            subcategoriaVisual: item.subcategoriaNombre || item.nombre || ""
          }];
        });
      } else {
        toast.info("Esta prueba ya está en la lista.");
      }
    }
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const actualizarPrueba = (index: number, campo: string, valor: any) => {
    const nuevas = [...pruebas];
    nuevas[index][campo] = valor;
    setPruebas(nuevas);
  };

  const toggleMostrar = (index: number, campo: string) => {
    const nuevas = [...pruebas];
    nuevas[index][campo] = !nuevas[index][campo];
    setPruebas(nuevas);
  };

  const addTag = async (index: number, campo: string, valor: string) => {
    const trimmed = valor.trim();
    if (!trimmed) return;
    const nuevas = [...pruebas];
    if (!nuevas[index][campo].includes(trimmed)) {
      nuevas[index][campo] = [...nuevas[index][campo], trimmed];
      setPruebas(nuevas);

      const p = nuevas[index];
      if (p.id && campo === 'opcionesPredefinidas') {
        try {
          await fetch(`/api/pruebas/item/${p.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...p,
              opcionesPredefinidas: p[campo].join(','),
              precioUSD: formData.esPaquete ? 0 : (parseFloat(p.precioUSD) || 0)
            })
          });
          toast.success("Opción añadida a la BD.");
        } catch (e) {
          toast.error("Error al guardar en BD.");
        }
      }
    }
  };

  const removeTag = async (index: number, campo: string, tagIndex: number) => {
    const nuevas = [...pruebas];
    nuevas[index][campo] = nuevas[index][campo].filter((_: any, i: number) => i !== tagIndex);
    setPruebas(nuevas);

    const p = nuevas[index];
    if (p.id && campo === 'opcionesPredefinidas') {
      try {
        await fetch(`/api/pruebas/item/${p.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...p,
            opcionesPredefinidas: p[campo].length > 0 ? p[campo].join(',') : null,
            precioUSD: formData.esPaquete ? 0 : (parseFloat(p.precioUSD) || 0)
          })
        });
        toast.success("Opción removida de la BD.");
      } catch (e) {
        toast.error("Error al guardar en BD.");
      }
    }
  };

  const guardarEdicionOpcion = async (index: number, idx: number) => {
    if (!editingOption || !editingOption.tempValue.trim()) return;
    
    const nuevas = [...pruebas];
    const p = nuevas[index];
    p.opcionesPredefinidas[idx] = editingOption.tempValue;
    setPruebas(nuevas);
    setEditingOption(null);

    if (p.id) {
      try {
        await fetch(`/api/pruebas/item/${p.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...p,
            opcionesPredefinidas: p.opcionesPredefinidas.join(','),
            precioUSD: formData.esPaquete ? 0 : (parseFloat(p.precioUSD) || 0)
          })
        });
        toast.success("Opción guardada correctamente en la BD.");
      } catch (e) {
        toast.error("Error al actualizar la BD.");
      }
    } else {
      toast.success("Opción editada (aún no existe en BD).");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validación UI
    if (formData.esPaquete && !formData.precioPaqueteUSD) {
      toast.error("Debe ingresar el precio total del paquete.");
      return;
    }
    if (pruebas.some(p => !p.nombre.trim() || !p.codigo.trim() || (!formData.esPaquete && !p.precioUSD))) {
      toast.error("Complete los códigos, nombres y precios requeridos.");
      return;
    }
    
    setGuardando(true);
    try {
      // 2. LIMPIEZA DE DATOS (Mapeo estricto para evitar error 500 en Prisma)
      const payloadLimpio = {
        categoria: formData.categoria,
        subcategoria: formData.subcategoria,
        esPaquete: formData.esPaquete,
        // Si es paquete, convertimos a Float, si no, lo enviamos como null
        precioPaqueteUSD: formData.esPaquete ? parseFloat(formData.precioPaqueteUSD) : null, 
        
        pruebas: pruebas.map(p => ({
          // Si el ID viene vacío (""), pasamos undefined para que Prisma sepa que es un registro nuevo
          id: p.id ? p.id : undefined, 
          codigo: p.codigo,
          nombre: p.nombre,
          // Convertimos el precio individual a Float (si aplica)
          precioUSD: !formData.esPaquete ? parseFloat(p.precioUSD) : null,
          unidades: p.unidades,
          valoresReferencia: p.valoresReferencia || null,
          opcionesPredefinidas: p.opcionesPredefinidas.length > 0 ? p.opcionesPredefinidas.join(',') : null,
          categoriaVisual: p.categoriaVisual || null,
          subcategoriaVisual: p.subcategoriaVisual || null
        }))
      };

      // 3. Enviamos los datos formateados a la API
      await onSave(payloadLimpio);
    } finally {
      setGuardando(false);
    }
  };

  const categoriasFiltradas = categoriasExistentes?.filter((c: string) => 
    c.toLowerCase().includes(formData.categoria.toLowerCase())
  ) || [];

  const subcategoriasFiltradas = subcategoriasExistentes?.filter((s: string) => 
    s.toLowerCase().includes(formData.subcategoria.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20">
      <div className="bg-white w-full max-w-[1100px] max-h-[90vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-2xl font-black text-[#1D1D1F]">
              {pruebaEditar ? "Editar Estructura" : "Configurar Catálogo"}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Organiza por Categoría y define si es un Paquete Cerrado o Ítems Individuales.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full relative z-0">
          
          <div className="p-8 pb-4 space-y-8 relative z-50">
            {/* SECTOR DE MODALIDAD */}
            <div className="flex gap-4 mb-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, esPaquete: false })}
              className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                !formData.esPaquete 
                ? 'border-[#0071E3] bg-[#0071E3]/5 text-[#0071E3]' 
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className={`p-2 rounded-xl ${!formData.esPaquete ? 'bg-[#0071E3] text-white' : 'bg-slate-100'}`}>
                <LayoutList size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Ítems Individuales</p>
                <p className="text-xs opacity-70">El paciente paga cada prueba por separado.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, esPaquete: true })}
              className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                formData.esPaquete 
                ? 'border-purple-500 bg-purple-50 text-purple-700' 
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className={`p-2 rounded-xl ${formData.esPaquete ? 'bg-purple-500 text-white' : 'bg-slate-100'}`}>
                <Package size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Paquete / Perfil</p>
                <p className="text-xs opacity-70">Se cobra un único precio por todo el combo.</p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 bg-[#F5F5F7] p-6 rounded-2xl border border-slate-200/60 relative z-50">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0071E3] rounded-l-2xl"></div>
            
            <div className="flex flex-col gap-1.5 pl-2 relative" ref={dropdownCategoriaRef}>
              <label className="text-[11px] font-black text-[#0071E3] uppercase tracking-widest">Categoría</label>
              <div className="relative">
                <input 
                  type="text" required 
                  value={formData.categoria} 
                  onFocus={() => setOpenDropdownCategoria(true)}
                  onChange={(e) => {
                    setFormData({ ...formData, categoria: e.target.value.toUpperCase() });
                    setOpenDropdownCategoria(true);
                  }} 
                  className="w-full px-4 py-3.5 bg-white border border-slate-200/80 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" 
                  placeholder="Ej. HEMATOLOGIA" 
                />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              </div>
              {openDropdownCategoria && (
                <div className="absolute top-[100%] left-2 right-0 mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-y-auto max-h-[220px] py-1.5 z-50">
                  {categoriasFiltradas.length > 0 ? (
                    categoriasFiltradas.map((cat: string) => (
                      <button key={cat} type="button" onClick={() => { setFormData({ ...formData, categoria: cat }); setOpenDropdownCategoria(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-[#0071E3]/5 hover:text-[#0071E3] transition-colors">
                        {cat}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm font-medium text-slate-400 italic">Se creará como nueva categoría</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 relative" ref={dropdownSubcategoriaRef}>
              <label className="text-[11px] font-black text-[#0071E3] uppercase tracking-widest">Subcategoría (Título)</label>
              <div className="relative">
                <input 
                  type="text" required
                  value={formData.subcategoria} 
                  onFocus={() => setOpenDropdownSubcategoria(true)}
                  onChange={(e) => {
                    setFormData({ ...formData, subcategoria: e.target.value });
                    setOpenDropdownSubcategoria(true);
                  }} 
                  className="w-full px-4 py-3.5 bg-white border border-slate-200/80 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" 
                  placeholder="Ej. Hematología Completa" 
                />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              </div>
              {openDropdownSubcategoria && (
                <div className="absolute top-[100%] left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-y-auto max-h-[220px] py-1.5 z-50">
                  {subcategoriasFiltradas.length > 0 ? (
                    subcategoriasFiltradas.map((sub: string) => (
                      <button key={sub} type="button" onClick={() => { setFormData({ ...formData, subcategoria: sub }); setOpenDropdownSubcategoria(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-[#0071E3]/5 hover:text-[#0071E3] transition-colors">
                        {sub}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm font-medium text-slate-400 italic">Se creará como nueva subcategoría</div>
                  )}
                </div>
              )}
            </div>

            {/* PRECIO DEL PAQUETE (Solo se muestra si es paquete) */}
            <div className={`flex flex-col gap-1.5 transition-opacity ${formData.esPaquete ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest">Precio del Paquete ($)</label>
              <input 
                type="number" step="0.01"
                required={formData.esPaquete}
                value={formData.precioPaqueteUSD} 
                onChange={(e) => setFormData({ ...formData, precioPaqueteUSD: e.target.value })} 
                className="w-full px-4 py-3.5 bg-white border border-purple-200 rounded-xl text-sm font-black text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20" 
                placeholder="0.00" 
              />
            </div>
          </div>
          </div>

          <div className="px-8 pb-8 space-y-4 relative z-10">
            <div className="flex justify-between items-center relative z-20">
              <div>
                <h4 className="text-[14px] font-black text-[#1D1D1F] uppercase tracking-widest">
                  {formData.esPaquete ? "Parámetros del Paquete" : "Pruebas e Ítems Individuales"}
                </h4>
              </div>
              <div className="flex items-center gap-3">
                  <div className="relative" ref={searchRef}>
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                        onFocus={() => setShowSearchResults(true)}
                        placeholder="Buscar prueba existente..."
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 w-80"
                      />
                    </div>
                    {showSearchResults && searchQuery.trim() && (
                      <div className="absolute top-[100%] right-0 mt-2 w-[600px] max-w-[85vw] bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-y-auto max-h-[350px] py-1.5 z-50">
                        {busquedaUnificada
                          .filter(item => 
                            item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.codigo && item.codigo.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (item.codigoCategoria && item.codigoCategoria.toLowerCase().includes(searchQuery.toLowerCase()))
                          )
                          .slice(0, 15)
                          .map((item: any) => (
                            <button 
                              key={`${item.tipo}-${item.id}`} 
                              type="button" 
                              onClick={() => agregarAlListadoBusqueda(item)} 
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                            >
                              <div className="flex items-start gap-3">
                                <span className={`mt-0.5 text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 uppercase tracking-widest ${
                                  item.tipo === 'paquete' ? 'bg-purple-100 text-purple-600' :
                                  item.tipo === 'subcategoria' ? 'bg-blue-100 text-[#0071E3]' :
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                  {item.tipo === 'prueba' ? item.codigo : (item.tipo === 'paquete' ? 'Paquete' : 'Subcat.')}
                                </span>
                                <div className="flex flex-col text-left">
                                  <span className="text-sm font-bold text-[#1D1D1F] leading-tight break-words">{item.nombre}</span>
                                  {item.tipo !== 'prueba' ? (
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                      {item.pruebas.length} pruebas • Cat: {item.codigoCategoria}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                      Cat: {item.categoriaNombre} • Sub: {item.subcategoriaNombre}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                        ))}
                        {busquedaUnificada.filter(item => item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || (item.codigo && item.codigo.toLowerCase().includes(searchQuery.toLowerCase())) || (item.codigoCategoria && item.codigoCategoria.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                           <div className="px-4 py-3 text-sm text-slate-400 italic">No se encontraron resultados</div>
                        )}
                      </div>
                    )}
                  </div>
                <button type="button" onClick={agregarFila} className="text-[13px] font-bold bg-[#0071E3] text-white px-5 py-2.5 rounded-xl hover:bg-[#0077ED] transition-all flex items-center gap-2 shadow-sm">
                  <Plus size={18} strokeWidth={3} /> Agregar Prueba
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {pruebas.map((p, index) => {
                const prev = index > 0 ? pruebas[index - 1] : null;
                const cat = p.categoriaVisual || "SIN CATEGORIA";
                const sub = p.subcategoriaVisual || "SIN SUBCATEGORIA";
                const prevCat = prev ? (prev.categoriaVisual || "SIN CATEGORIA") : null;
                const prevSub = prev ? (prev.subcategoriaVisual || "SIN SUBCATEGORIA") : null;
                
                const isNewGroup = cat !== prevCat || sub !== prevSub;
                const showHeader = isNewGroup && (cat !== "SIN CATEGORIA" || sub !== "SIN SUBCATEGORIA");

                return (
                  <div key={index} className="flex flex-col">
                    {showHeader && (
                      <div className="flex items-center gap-3 px-2 mt-4 mb-3">
                        <div className="flex items-center gap-2 shrink-0">
                          {cat !== "SIN CATEGORIA" && (
                            <span className="text-[11px] font-black tracking-widest uppercase text-slate-500">
                              {cat}
                            </span>
                          )}
                          {cat !== "SIN CATEGORIA" && sub !== "SIN SUBCATEGORIA" && (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                          {sub !== "SIN SUBCATEGORIA" && (
                            <span className="text-[11px] font-black tracking-widest uppercase text-[#0071E3]">
                              {sub}
                            </span>
                          )}
                        </div>
                        <div className="h-px bg-slate-200/70 flex-1"></div>
                        <button type="button" onClick={() => {
                          const nuevas = [...pruebas];
                          for (let i = index; i < nuevas.length; i++) {
                            if ((nuevas[i].categoriaVisual || "SIN CATEGORIA") === cat && (nuevas[i].subcategoriaVisual || "SIN SUBCATEGORIA") === sub) {
                              nuevas[i].categoriaVisual = "";
                              nuevas[i].subcategoriaVisual = "";
                            } else {
                              break;
                            }
                          }
                          setPruebas(nuevas);
                        }} className="text-red-400 hover:text-red-600 text-[10px] ml-2 font-bold uppercase tracking-widest bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors">
                          Quitar Grupo
                        </button>
                      </div>
                    )}
                    <div className={`flex flex-col bg-[#F5F5F7]/60 border border-slate-200/80 p-5 shadow-sm hover:border-[#0071E3]/30 transition-colors ${showHeader ? 'rounded-2xl rounded-t-lg' : 'rounded-2xl mt-4'}`}>
                      
                      <div className="grid grid-cols-12 gap-4 items-end w-full">
                        <div className="col-span-2 xl:col-span-1 flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Código</label>
                          <input type="text" required value={p.codigo} onChange={(e) => actualizarPrueba(index, 'codigo', e.target.value.toUpperCase())} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" placeholder="HE-01" />
                        </div>

                        <div className={`${formData.esPaquete ? 'col-span-5' : 'col-span-4'} flex flex-col gap-1.5`}>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                          <textarea rows={1} required value={p.nombre} onChange={(e) => actualizarPrueba(index, 'nombre', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 resize-y min-h-[46px]" placeholder="Ej. GLOBULOS BLANCOS" />
                        </div>

                    <div className="col-span-3 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Valores Referencia</label>
                      <textarea rows={1} value={p.valoresReferencia} onChange={(e) => actualizarPrueba(index, 'valoresReferencia', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 resize-y min-h-[46px]" placeholder="Vacío para manual" />
                    </div>

                    <div className={`${formData.esPaquete ? 'col-span-2' : 'col-span-1'} flex flex-col gap-1.5`}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Unidades</label>
                      <input type="text" value={p.unidades} onChange={(e) => actualizarPrueba(index, 'unidades', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" placeholder="mm3" />
                    </div>

                    {!formData.esPaquete && (
                      <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Precio ($)</label>
                        <input type="number" step="0.01" required value={p.precioUSD} onChange={(e) => actualizarPrueba(index, 'precioUSD', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20" placeholder="0.00" />
                      </div>
                    )}

                    <div className="col-span-1 flex justify-end">
                      <button type="button" onClick={() => eliminarFila(index)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm">
                        <Trash2 size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex gap-3 pt-4 mt-4 border-t border-slate-200/50">
                    <button type="button" onClick={() => toggleMostrar(index, 'mostrarOpciones')} className={`text-[11px] font-bold px-4 py-2 rounded-xl transition-all ${p.mostrarOpciones ? 'bg-purple-100 text-purple-700 shadow-inner' : 'bg-white border border-slate-200 text-slate-500 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200'}`}>
                      {p.opcionesPredefinidas.length > 0 ? `✓ Opciones Cerradas (${p.opcionesPredefinidas.length})` : '+ Opciones Cerradas para Resultados'}
                    </button>
                  </div>

                  {/* Paneles */}
                  {p.mostrarOpciones && (
                    <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest mb-3 block">Configurar Opciones Predefinidas</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {p.opcionesPredefinidas.map((opc: string, idx: number) => {
                          const isEditing = editingOption?.pruebaIndex === index && editingOption?.optionIndex === idx;
                          return (
                            <span key={idx} className="flex items-center gap-1 bg-purple-100 text-purple-700 pl-3 pr-1 py-1 rounded-lg text-sm font-bold border border-purple-200 shadow-sm">
                              {isEditing ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingOption.tempValue}
                                  onChange={(e) => setEditingOption({...editingOption, tempValue: e.target.value})}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      guardarEdicionOpcion(index, idx);
                                    }
                                  }}
                                  className="bg-white px-2 py-0.5 rounded text-sm outline-none border border-purple-300 text-purple-700 min-w-[60px]"
                                  style={{ width: `${Math.max(editingOption.tempValue.length + 2, 8)}ch` }}
                                />
                              ) : (
                                <span>{opc}</span>
                              )}
                              
                              <div className="flex items-center gap-0.5 ml-1">
                                {isEditing ? (
                                  <button type="button" onClick={() => guardarEdicionOpcion(index, idx)} className="p-1 hover:bg-green-200 text-green-700 rounded-md transition-colors" title="Guardar"><Check size={14}/></button>
                                ) : (
                                  <button type="button" onClick={() => setEditingOption({pruebaIndex: index, optionIndex: idx, tempValue: opc})} className="p-1 hover:bg-blue-200 text-blue-700 rounded-md transition-colors" title="Editar"><Edit2 size={14}/></button>
                                )}
                                <button type="button" onClick={() => removeTag(index, 'opcionesPredefinidas', idx)} className="p-1 hover:bg-purple-200 text-purple-700 rounded-md transition-colors" title="Eliminar"><X size={14}/></button>
                              </div>
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Escribe una opción (Ej. Positivo) y presiona Enter..." 
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(index, 'opcionesPredefinidas', e.currentTarget.value); e.currentTarget.value = ''; } }}
                          className="flex-1 px-4 py-2.5 bg-white border border-purple-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-purple-300 shadow-sm"
                        />
                        <button type="button" onClick={(e) => { 
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement; 
                            addTag(index, 'opcionesPredefinidas', input.value); 
                            input.value = ''; 
                          }} 
                          className="px-4 py-2.5 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 shadow-sm transition-colors"
                        >
                          Añadir
                        </button>
                      </div>
                    </div>
                  )}



                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        <div className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0 relative z-40">
          <button type="button" onClick={onClose} disabled={guardando} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors disabled:opacity-50">Cancelar</button>
          <button type="submit" onClick={handleSubmit} disabled={guardando} className="flex-1 py-4 bg-[#0071E3] text-white font-bold rounded-2xl shadow-lg hover:bg-[#0077ED] transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
            {guardando && <Loader2 className="animate-spin" size={20} strokeWidth={3} />}
            {guardando ? "Guardando..." : "Guardar Estructura"}
          </button>
        </div>
      </div>
    </div>
  );
}