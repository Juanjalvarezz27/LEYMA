"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Trash2, FlaskConical } from "lucide-react";

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

  // Filtrar catálogo según búsqueda (Ahora estricto desde la primera letra)
  useEffect(() => {
    if (busqueda.trim() === "") {
      setResultados([]);
      return;
    }
    
    const searchLower = busqueda.toLowerCase();
    
    const filtered = pruebasCatalogo.filter(p => 
      p.activa && (
        // Usamos startsWith en lugar de includes para que busque desde el principio
        p.nombre.toLowerCase().startsWith(searchLower) || 
        p.codigo.toLowerCase().startsWith(searchLower)
      )
    ).slice(0, 5); // Mostramos solo los primeros 5 para mantener la UI limpia
    
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
    <section className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-8 mb-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] font-bold">2</div>
          <h2 className="text-xl font-bold text-[#1D1D1F]">Selección de Pruebas</h2>
        </div>
        <div className="text-[12px] font-bold px-3 py-1 bg-slate-100 text-slate-500 rounded-lg border border-slate-200">
          Tasa Aplicada: Bs {tasaBCV.toFixed(2)}
        </div>
      </div>

      {/* Buscador de Pruebas */}
      <div className="relative mb-8 max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar examen por nombre o código..."
          className="w-full pl-12 pr-4 py-4 bg-[#F5F5F7] border border-slate-200/60 rounded-2xl text-[#1D1D1F] font-semibold focus:outline-none focus:ring-4 focus:ring-[#0071E3]/15 focus:border-[#0071E3]/50 transition-all"
        />

        {/* Resultados flotantes */}
        {resultados.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-top-2">
            {resultados.map((p) => (
              <button
                key={p.id}
                onClick={() => agregarPrueba(p)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-blue-50 text-[#0071E3] text-[10px] font-black px-2 py-1 rounded-md border border-blue-100 uppercase tracking-tighter">
                    {p.codigo}
                  </span>
                  <span className="font-bold text-[#1D1D1F] text-sm">{p.nombre}</span>
                </div>
                <span className="font-black text-[#1D1D1F] text-sm">${p.precioUSD.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabla de Pruebas Agregadas */}
      <div className="space-y-3">
        {pruebasSeleccionadas.length === 0 ? (
          <div className="py-10 border-2 border-dashed border-slate-100 rounded-[20px] flex flex-col items-center justify-center text-slate-400">
            <FlaskConical size={40} strokeWidth={1.5} className="mb-2 opacity-50" />
            <p className="font-medium">No hay pruebas seleccionadas aún</p>
          </div>
        ) : (
          pruebasSeleccionadas.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-[#F5F5F7]/50 border border-slate-200/60 rounded-2xl p-4 animate-in slide-in-from-left-2 transition-all hover:border-[#0071E3]/20">
              <div className="flex items-center gap-4 w-1/2">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                  <FlaskConical className="text-[#0071E3]" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-[#1D1D1F] text-sm leading-tight">{p.nombre}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.codigo}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-8 w-1/2">
                {/* Control de Cantidad */}
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
                  <button 
                    onClick={() => actualizarCantidad(p.id, p.cantidad - 1)}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#0071E3] hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    -
                  </button>
                  <span className="text-sm font-black text-[#1D1D1F] w-6 text-center">{p.cantidad}</span>
                  <button 
                    onClick={() => actualizarCantidad(p.id, p.cantidad + 1)}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#0071E3] hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Precio Unitario y Total */}
                <div className="text-right flex flex-col min-w-[100px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Item</span>
                  <span className="text-lg font-black text-[#1D1D1F] leading-none">
                    ${(p.precioUSD * p.cantidad).toFixed(2)}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 mt-1">
                    Bs {((p.precioUSD * p.cantidad) * tasaBCV).toFixed(2)}
                  </span>
                </div>

                <button 
                  onClick={() => eliminarPrueba(p.id)}
                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}