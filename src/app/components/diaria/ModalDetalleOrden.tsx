"use client";

import { X, FileText, User, Activity, Wallet, Calendar, MapPin, Phone, Mail, Stethoscope, Hash } from "lucide-react";

interface ModalDetalleOrdenProps {
  orden: any;
  onClose: () => void;
}

const calcularEdad = (fechaString: string) => {
  if (!fechaString) return "N/A";
  const hoy = new Date();
  const fechaNac = new Date(fechaString);
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const m = hoy.getMonth() - fechaNac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }
  return edad;
};

export default function ModalDetalleOrden({ orden, onClose }: ModalDetalleOrdenProps) {
  if (!orden) return null;

  const fechaOrden = new Date(orden.fechaCreacion).toLocaleString('es-VE', { 
    timeZone: 'America/Caracas',
    dateStyle: 'long', 
    timeStyle: 'short' 
  });

  const paciente = orden.paciente;

  // Lógica para el Descuento General
  const tipoDescGral = orden.tipoDescuento?.nombre || "MONTO";
  const valorDescGral = orden.descuentoGeneral || 0;
  const montoDescGralUSD = tipoDescGral === "PORCENTAJE" 
    ? (orden.subtotalUSD * (valorDescGral / 100)) 
    : valorDescGral;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      
      {/* Fondo borroso oscuro */}
      <div 
        className="absolute inset-0 bg-[#1D1D1F]/60"
        onClick={onClose}
      ></div>

      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* HEADER PRINCIPAL */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-[#0071E3] rounded-2xl flex items-center justify-center">
              <FileText size={24} strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">
                  Orden #{orden.id.toString().padStart(5, '0')}
                </h2>
                {orden.estado.nombre === "CERRADA" && <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black tracking-widest rounded-md border border-green-200">CERRADA</span>}
                {orden.estado.nombre === "BORRADOR" && <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-black tracking-widest rounded-md border border-orange-200">PENDIENTE</span>}
                {orden.estado.nombre === "ANULADA" && <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black tracking-widest rounded-md border border-red-200">ANULADA</span>}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mt-1">
                <Calendar size={14} /> {fechaOrden} <span className="text-slate-300">|</span> Bioanalista: <span className="text-[#1D1D1F] font-semibold">{orden.creadoPor?.nombre || 'N/A'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full transition-all shadow-sm"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {/* 1. FICHA DEL PACIENTE */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={18} className="text-[#0071E3]" /> Datos del Paciente
            </h3>
            
            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 p-6 bg-slate-50/50 border-b border-slate-100">
                <div className="col-span-2 md:col-span-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</p>
                  <p className="font-bold text-[#1D1D1F] text-sm">{paciente.nombreCompleto}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cédula</p>
                  <p className="font-semibold text-slate-700 text-sm">{paciente.esBebe ? 'Bebé (S/N)' : paciente.cedula}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Edad</p>
                  <p className="font-semibold text-slate-700 text-sm">{calcularEdad(paciente.fechaNacimiento)} años</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sexo</p>
                  <p className="font-semibold text-slate-700 text-sm">{paciente.sexo === "M" ? "Masculino" : "Femenino"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teléfono</p>
                  <p className="font-semibold text-slate-700 text-sm">{paciente.telefono || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Mail size={12}/> Correo</p>
                  <p className="font-medium text-slate-700 text-sm">{paciente.correo || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin size={12}/> Dirección</p>
                  <p className="font-medium text-slate-700 text-sm">{paciente.direccion || 'N/A'}</p>
                </div>
              </div>

              {paciente.observaciones && (
                <div className="p-6 pt-0">
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3">
                    <Stethoscope className="text-orange-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Observaciones Médicas</p>
                      <p className="text-sm text-slate-700 font-medium">{paciente.observaciones}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <hr className="my-8 border-t-2 border-dashed border-slate-200" />

          {/* 2. EXÁMENES SOLICITADOS */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={18} className="text-[#0071E3]" /> Exámenes Solicitados
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {orden.detalles.map((det: any) => {
                // LÓGICA CORREGIDA DE DESCUENTO INDIVIDUAL
                const tipoDesc = det.tipoDescuento?.nombre || "MONTO";
                const valorDesc = det.descuento || 0;
                const subtotalBaseUSD = det.precioCongeladoUSD * det.cantidad;
                
                const montoDescuentoUSD = tipoDesc === "PORCENTAJE" 
                  ? (subtotalBaseUSD * (valorDesc / 100)) 
                  : valorDesc;
                  
                const subtotalItemUSD = subtotalBaseUSD - montoDescuentoUSD;

                const precioBS = det.precioCongeladoUSD * orden.tasaBCV;
                const subtotalItemBS = subtotalItemUSD * orden.tasaBCV;

                return (
                  <div key={det.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-[#0071E3] rounded-xl flex items-center justify-center shrink-0">
                        <Activity size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1D1D1F] text-sm leading-tight truncate max-w-[200px]">{det.prueba.nombre}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                            {det.prueba.codigo}
                          </span>
                          {valorDesc > 0 && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                              Desc: {tipoDesc === "PORCENTAJE" ? `-${valorDesc}%` : `-$${valorDesc.toFixed(2)}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-5">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Cant.</p>
                        <p className="font-bold text-slate-700 text-sm mt-1">{det.cantidad}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Precio</p>
                        <p className="font-bold text-slate-700 text-sm leading-none mt-1">${det.precioCongeladoUSD.toFixed(2)}</p>
                        <p className="text-[9px] font-medium text-slate-500 mt-1">Bs {precioBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Subtotal</p>
                        <p className="font-black text-[#1D1D1F] text-base leading-none mt-1">${subtotalItemUSD.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1">Bs {subtotalItemBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="my-8 border-t-2 border-dashed border-slate-200" />

          {/* 3. FINANZAS (Resumen y Pagos) */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* IZQUIERDA: Resumen de Cobro */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Hash size={18} className="text-[#0071E3]" /> Resumen de Cobro
              </h3>
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#0071E3]"></div>

                <div className="space-y-3 mb-5 border-b border-dashed border-slate-200 pb-5 mt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-500">Subtotal de Exámenes</span>
                    <span className="font-bold text-slate-700">${orden.subtotalUSD.toFixed(2)}</span>
                  </div>
                  {valorDescGral > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-red-500">
                        Desc. General {tipoDescGral === "PORCENTAJE" && `(${valorDescGral}%)`}
                      </span>
                      <span className="font-bold text-red-500">-${montoDescGralUSD.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total a Pagar</p>
                    <p className="font-bold text-[#0071E3] text-sm">Bs {orden.totalBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-[#1D1D1F] tracking-tighter leading-none">${orden.totalUSD.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* DERECHA: Registro de Pagos */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Wallet size={18} className="text-green-600" /> Registro de Pagos
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-6 h-[185px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                {orden.pagos && orden.pagos.length > 0 ? (
                  <div className="space-y-3">
                    {orden.pagos.map((pago: any) => (
                      <div key={pago.id} className="bg-white border border-slate-200 p-3 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                            <Wallet size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-[#1D1D1F] uppercase tracking-wide leading-none">{pago.metodo.nombre.replace('_', ' ')}</span>
                            {pago.referencia && <span className="text-[10px] text-slate-400 font-medium mt-1">Ref: {pago.referencia}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-[#1D1D1F] text-sm">${pago.montoUSD.toFixed(2)}</p>
                          <p className="text-[10px] font-bold text-slate-500">Bs {pago.montoBS.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Wallet size={24} className="text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-400">Orden pendiente de cobro</p>
                    <p className="text-xs text-slate-400 mt-1">No hay pagos registrados aún.</p>
                  </div>
                )}
              </div>
            </div>

          </section>

        </div>
      </div>
    </div>
  );
}