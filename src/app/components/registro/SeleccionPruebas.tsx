"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Trash2, FlaskConical, Package } from "lucide-react";

interface SeleccionPruebasProps {
  pruebasCatalogo: any[];
  pruebasSeleccionadas: any[];
  setPruebasSeleccionadas: (pruebas: any[]) => void;
  tasaBCV: number;
}

export default function SeleccionPruebas({
  pruebasCatalogo,
  pruebasSeleccionadas,
  setPruebasSeleccionadas,
  tasaBCV
}: SeleccionPruebasProps) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);

  useEffect(() => {
    if (busqueda.trim() === "") {
      setResultados([]);
      return;
    }
    const searchLower = busqueda.toLowerCase();
    const filtered = pruebasCatalogo.filter(p =>
      p.nombre.toLowerCase().startsWith(searchLower) ||
      p.codigo.toLowerCase().startsWith(searchLower)
    ).slice(0, 5); 

    setResultados(filtered);
  }, [busqueda, pruebasCatalogo]);

  const agregarPrueba = (prueba: any) => {
    const existe = pruebasSeleccionadas.find(p => p.id === prueba.id);
    if (existe) {
      setPruebasSeleccionadas(
        pruebasSeleccionadas.map(p =>
          p.id === prueba.id ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      );
    } else {
      setPruebasSeleccionadas([...pruebasSeleccionadas, { ...prueba, cantidad: 1 }]);
    }
    setBusqueda("");
  };

  const eliminarPrueba = (id: string) => {
    setPruebasSeleccionadas(pruebasSeleccionadas.filter(p => p.id !== id));
  };

  const actualizarCantidad = (id: string, nuevaCant: number) => {
    if (nuevaCant < 1) return;
    setPruebasSeleccionadas(
      pruebasSeleccionadas.map(p => p.id === id ? { ...p, cantidad: nuevaCant } : p)
    );
  };

  return (
    <section className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 lg:p-8 mb-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] font-bold">2</div>
          <h2 className="text-xl font-bold text-[#1D1D1F]">Selección de Pruebas</h2>
        </div>
        <div className="text-xs font-bold px-3 py-1.5 bg-primario/20 text-black rounded-xl border border-slate-200 shadow-sm">
          Tasa Aplicada: Bs {tasaBCV.toFixed(2)}
        </div>
      </div>

      <div className="relative mb-6 max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar examen por nombre o código..."
          className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] text-[15px] font-semibold focus:outline-none focus:ring-4 focus:ring-[#0071E3]/15 focus:border-[#0071E3]/50 transition-all placeholder:text-slate-400"
        />

        {resultados.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-top-2">
            {resultados.map((p) => (
              <button
                key={p.id}
                onClick={() => agregarPrueba(p)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3 text-left">
                  {p.tipo === "PAQUETE" ? (
                    <span className="bg-purple-100 text-purple-600 text-[10px] font-black px-2 py-1 rounded-md border border-purple-200 uppercase tracking-widest flex items-center gap-1 shrink-0">
                      <Package size={12} strokeWidth={3} /> PAQUETE
                    </span>
                  ) : (
                    <span className="bg-blue-50 text-[#0071E3] text-[10px] font-black px-2 py-1 rounded-md border border-blue-100 uppercase tracking-widest shrink-0">
                      {p.codigo}
                    </span>
                  )}
                  <div className="flex flex-col">
                    <span className="font-bold text-[#1D1D1F] text-sm">{p.nombre}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{p.categoriaNombre}</span>
                  </div>
                </div>
                <span className="font-black text-[#1D1D1F] text-sm">${p.precioUSD?.toFixed(2) || "0.00"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {pruebasSeleccionadas.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-slate-200 rounded-[20px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <FlaskConical size={36} strokeWidth={1.5} className="mb-2 opacity-50" />
            <p className="font-medium text-[15px]">No hay pruebas seleccionadas aún</p>
          </div>
        ) : (
          pruebasSeleccionadas.map((p) => (
            <div key={p.id} className={`flex flex-col lg:flex-row lg:items-center justify-between bg-white shadow-sm border rounded-[20px] p-5 transition-all ${p.tipo === 'PAQUETE' ? 'border-purple-200/80 hover:border-purple-300' : 'border-slate-200/80 hover:border-[#0071E3]/30'}`}>
              
              <div className="flex items-start gap-4 flex-1 w-full">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border mt-1 ${p.tipo === "PAQUETE" ? "bg-purple-50 border-purple-100 text-purple-500" : "bg-blue-50 border-blue-100 text-[#0071E3]"}`}>
                  {p.tipo === "PAQUETE" ? (
                    <Package size={22} strokeWidth={2.5} />
                  ) : (
                    <FlaskConical size={22} strokeWidth={2.5} />
                  )}
                </div>
                
                <div className="flex flex-col w-full">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                     <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{p.categoriaNombre}</span>
                     <span className="text-[11px] text-slate-500">&gt;</span>
                     <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{p.subcategoriaNombre}</span>
                  </div>

                  <h4 className="font-black text-[#1D1D1F] text-base leading-tight flex items-center gap-2">
                    {p.nombre}
                    {p.tipo === "PAQUETE" && (
                      <span className="text-[9px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Paquete</span>
                    )}
                  </h4>
                  <p className="text-[10px] font-black text-[#0071E3] uppercase tracking-widest mt-1">{p.codigo}</p>

                  {p.tipo === "PAQUETE" && p.pruebasHijas && (
                    <div className="mt-3 bg-[#F5F5F7]/80 border border-slate-200/60 rounded-xl p-3 w-full lg:max-w-xl">
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        <span className="font-bold text-slate-700">Incluye:</span> {p.pruebasHijas.map((ph: any) => ph.nombre).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-5 lg:gap-8 w-full lg:w-auto mt-4 lg:mt-0 border-t lg:border-0 border-slate-100 pt-4 lg:pt-0">
                <div className="flex items-center gap-3 bg-[#F5F5F7] border border-slate-200 rounded-xl px-2 py-1.5 shadow-inner">
                  <button
                    onClick={() => actualizarCantidad(p.id, p.cantidad - 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0071E3] hover:bg-white rounded-lg transition-colors font-bold text-lg shadow-sm"
                  >
                    -
                  </button>
                  <span className="text-sm font-black text-[#1D1D1F] w-6 text-center">{p.cantidad}</span>
                  <button
                    onClick={() => actualizarCantidad(p.id, p.cantidad + 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0071E3] hover:bg-white rounded-lg transition-colors font-bold text-lg shadow-sm"
                  >
                    +
                  </button>
                </div>

                <div className="text-right flex flex-col min-w-[90px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Item</span>
                  <span className="text-xl font-black text-[#1D1D1F] leading-none">
                    ${(p.precioUSD * p.cantidad).toFixed(2)}
                  </span>
                  <span className="text-[13px] font-medium text-slate-500 mt-1">
                    Bs {((p.precioUSD * p.cantidad) * tasaBCV).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => eliminarPrueba(p.id)}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all"
                  title="Eliminar ítem"
                >
                  <Trash2 size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}