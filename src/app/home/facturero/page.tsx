"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  Search,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  Loader2,
  X,
  Printer,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import useTasaBCV from "../../hooks/useTasaBcv";

// ─── Utilidades ─────────────────────────────────────────────────────────────

const obtenerFechaHoyVzla = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Caracas" });

const formatearMetodoPago = (pagos: any[]): string => {
  if (!pagos || pagos.length === 0) return "";
  const metodos = [...new Set(pagos.map((p: any) => p.metodo?.nombre || ""))].filter(Boolean);
  return metodos
    .map((m) =>
      m
        .split("_")
        .map((p: string) =>
          p === "USD" || p === "BS" ? p : p.charAt(0) + p.slice(1).toLowerCase()
        )
        .join(" ")
    )
    .join(" / ");
};

const obtenerFechaDisplay = (iso: string) => {
  const [y, m, d] = iso.split("-");
  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];
  return `${d} de ${meses[parseInt(m) - 1]} del ${y}`;
};

// ─── Componente FacturaPreview ───────────────────────────────────────────────

function FacturaPreview({
  orden,
  onClose,
  tasa: tasaLive,
}: {
  orden: any;
  onClose: () => void;
  tasa: number | null;
}) {
  // Usar la tasa BCV histórica con la que se registró y pagó la orden (para coincidir con la tarjeta exterior)
  const tasa = Number(orden.tasaBCV) || tasaLive || 1;

  const fechaEmision = new Date(orden.fechaCreacion);
  const dia = String(fechaEmision.getDate()).padStart(2, "0");
  const mes = String(fechaEmision.getMonth() + 1).padStart(2, "0");
  const anioStr = String(fechaEmision.getFullYear());
  const decenio = anioStr.slice(2, 3);
  const unidad = anioStr.slice(3, 4);

  // Agrupar items: si es paquete, se consolida en 1 renglón con el nombre del paquete y su precio total.
  // Si es prueba individual, se muestra con el nombre del examen.
  const itemsAgrupados: { concepto: string; cantidad: number; precioUSD: number; montoUSD: number }[] = [];
  const paquetesMap = new Map<string, { concepto: string; cantidad: number; precioUSD: number; montoUSD: number }>();

  (orden.detalles || []).forEach((d: any) => {
    const isPaquete = Boolean(d.prueba?.subcategoria?.esPaquete);
    const precioItemUSD = Number(d.precioCongeladoUSD) || 0;
    const cant = d.cantidad || 1;
    const montoItemUSD = precioItemUSD * cant;

    if (isPaquete) {
      const subcatId = d.prueba?.subcategoria?.id || d.prueba?.subcategoria?.nombre || "paquete";
      if (paquetesMap.has(subcatId)) {
        const pkg = paquetesMap.get(subcatId)!;
        pkg.precioUSD += precioItemUSD;
        pkg.montoUSD += montoItemUSD;
      } else {
        const nuevoPkg = {
          concepto: d.prueba?.subcategoria?.nombre || d.prueba?.nombre || "PAQUETE",
          cantidad: cant,
          precioUSD: precioItemUSD,
          montoUSD: montoItemUSD,
        };
        paquetesMap.set(subcatId, nuevoPkg);
        itemsAgrupados.push(nuevoPkg);
      }
    } else {
      itemsAgrupados.push({
        concepto: d.prueba?.nombre || "-",
        cantidad: cant,
        precioUSD: precioItemUSD,
        montoUSD: montoItemUSD,
      });
    }
  });

  // Servicios extra: calcular monto total en Bs
  let totalServiciosExtraBS = 0;
  (orden.serviciosExtra || []).forEach((s: any) => {
    const precioUSD = Number(s.precioCongeladoUSD) || 0;
    const precioBS = tasa ? precioUSD * tasa : 0;
    totalServiciosExtraBS += precioBS * (s.cantidad || 1);
  });

  // Prorrateo equitativo de los servicios extra entre los ítems de la factura
  const numItems = itemsAgrupados.length;
  const extraPorItemBS = numItems > 0 ? totalServiciosExtraBS / numItems : 0;

  // Total base de pruebas para cuadre exacto de céntimos
  let basePruebasBS = 0;
  itemsAgrupados.forEach((it) => {
    basePruebasBS += tasa ? it.montoUSD * tasa : 0;
  });
  const totalFacturaBS = Math.round((basePruebasBS + totalServiciosExtraBS) * 100) / 100;

  const renglones: { concepto: string; cantidad: number; precioBS: number; montoBS: number }[] = [];
  let acumuladorRenglonesBS = 0;

  itemsAgrupados.forEach((item, index) => {
    const cant = item.cantidad || 1;
    const baseMontoBS = tasa ? item.montoUSD * tasa : 0;
    const esUltimo = index === numItems - 1;

    // Repartir equitativamente y ajustar céntimos residuales en el último renglón
    const montoCalculado = baseMontoBS + extraPorItemBS;
    const montoBS = esUltimo
      ? Math.round((totalFacturaBS - acumuladorRenglonesBS) * 100) / 100
      : Math.round(montoCalculado * 100) / 100;

    acumuladorRenglonesBS += montoBS;
    const precioBS = cant > 0 ? montoBS / cant : 0;

    renglones.push({
      concepto: item.concepto,
      cantidad: cant,
      precioBS,
      montoBS,
    });
  });

  // Si la orden no tiene exámenes y solo tiene servicios extra
  if (numItems === 0 && totalServiciosExtraBS > 0) {
    (orden.serviciosExtra || []).forEach((s: any) => {
      const precioUSD = Number(s.precioCongeladoUSD) || 0;
      const precioBS = tasa ? precioUSD * tasa : 0;
      const cant = s.cantidad || 1;
      const montoBS = precioBS * cant;
      acumuladorRenglonesBS += montoBS;
      renglones.push({
        concepto: s.servicio?.nombre || "SERVICIO",
        cantidad: cant,
        precioBS,
        montoBS,
      });
    });
  }

  // Rellenar hasta 9
  while (renglones.length < 9) {
    renglones.push({ concepto: "", cantidad: 0, precioBS: 0, montoBS: 0 });
  }

  // Sumatoria total en Bs (la suma de los renglones cuadra con el total a pagar)
  const totalExentoBS = acumuladorRenglonesBS;
  const formaPago = formatearMetodoPago(orden.pagos || []);
  const cedula = orden.paciente?.cedula || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-[880px] my-auto">

        {/* Barra modal */}
        <div className="no-print flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0071E3] rounded-xl flex items-center justify-center text-white shadow-sm">
              <Receipt size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white font-black text-sm tracking-tight">
                Factura — Orden #{orden.id}
              </p>
              <p className="text-white/60 text-xs font-medium">{orden.paciente?.nombreCompleto}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-xl transition-all shadow"
            >
              <Printer size={13} />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Hoja */}
        <div
          id="factura-papel"
          className="relative bg-white p-6 sm:p-8 shadow-2xl border border-slate-300 text-slate-900 font-sans print:shadow-none print:border-none print:p-4"
        >
          {/* Marca de agua */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.035] select-none">
            <span className="text-9xl font-black rotate-[-35deg] tracking-widest text-slate-900">
              REFERENCIA
            </span>
          </div>

          {/* Cabecera */}
          <div className="relative flex items-start justify-between gap-4 pb-2">
            {/* Espacio reservado para el membrete físico del talonario */}
            <div className="w-20 h-20 shrink-0" />

            <div className="flex-1 text-center px-2">
              <p className="text-[11px] font-semibold text-slate-700 tracking-wide">
                Laboratorio Clínico Bacteriológico
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
                LEYMA, C.A.
              </h1>
              <p className="text-[10px] font-medium text-slate-700">Servicio de Laboratorio Clínico</p>
              <p className="text-[10px] font-medium text-slate-700">Compra y Venta de Insumos</p>
              <p className="text-[11px] font-bold text-slate-900 mt-0.5">Tel.: 0422 - 035.36.60</p>
            </div>

            <div className="text-right shrink-0 flex flex-col items-end min-w-[200px]">
              <p className="text-[12px] font-bold text-slate-900">R.I.F.: J - 508463315</p>
              <p className="text-base font-black tracking-wider text-slate-900 mt-0.5">FACTURA</p>
              <div className="flex items-center my-1">
                <div className="bg-black text-white font-bold text-sm px-2.5 py-0.5 rounded-l-md">
                  Nº
                </div>
                <div className="border border-black border-l-0 px-3 py-0.5 rounded-r-md font-mono text-base font-black tracking-widest text-[#dc2626] min-w-[100px] text-center bg-yellow-50/30">
                  <span className="opacity-25 text-xs">completar</span>
                </div>
              </div>
              <div className="text-[9px] leading-tight text-slate-700 text-right mt-0.5">
                <p>Av. Coro Local Nro 4-79</p>
                <p>Sector Santa Rosa - Santa Rosa</p>
                <p>(Trujillo) - Trujillo</p>
              </div>
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="border border-black rounded-lg overflow-hidden mt-2 text-xs">
            <div className="flex items-center justify-between border-b border-black">
              <div className="px-3 py-1 font-bold text-[11px] text-slate-900">FECHA DE EMISIÓN:</div>
              <div className="flex items-center divide-x divide-black border-l border-black text-[10px]">
                <span className="px-2 py-1 font-bold">DIA</span>
                <span className="w-9 text-center font-black py-1 bg-blue-50/40">{dia}</span>
                <span className="px-2 py-1 font-bold">MES</span>
                <span className="w-9 text-center font-black py-1 bg-blue-50/40">{mes}</span>
                <span className="px-2 py-1 font-bold">AÑO</span>
                <span className="w-5 text-center font-black py-1">2</span>
                <span className="w-5 text-center font-black py-1">0</span>
                <span className="w-5 text-center font-black py-1 bg-blue-50/40">{decenio}</span>
                <span className="w-5 text-center font-black py-1 bg-blue-50/40">{unidad}</span>
              </div>
            </div>

            <div className="flex items-center border-b border-black px-3 py-1.5">
              <span className="font-bold text-[11px] whitespace-nowrap mr-2 text-slate-600">
                Nombre y Apellido o Razón Social:
              </span>
              <span className="flex-1 font-black text-[12px] text-slate-900 bg-blue-50/40 px-1 rounded">
                {orden.paciente?.nombreCompleto}
              </span>
            </div>

            <div className="flex items-center border-b border-black px-3 py-1.5">
              <span className="font-bold text-[11px] whitespace-nowrap mr-2 text-slate-600">
                Domicilio Fiscal:
              </span>
              <span className="flex-1 font-semibold text-[11px] text-slate-900">
                {orden.paciente?.direccion ? (
                  <span className="bg-blue-50/40 px-1 rounded">{orden.paciente.direccion}</span>
                ) : (
                  <span className="text-slate-300 italic text-[10px]">sin dirección registrada</span>
                )}
              </span>
            </div>

            <div className="flex items-center border-b border-black">
              <div className="flex-1 px-3 py-1.5"></div>
              <div className="w-[320px] border-l border-black px-3 py-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold whitespace-nowrap text-slate-600">Nº RIF. o C.I:</span>
                  <span className="font-black text-slate-900 text-[13px] bg-blue-50/40 px-1 rounded">
                    {cedula}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-bold whitespace-nowrap text-slate-600">Pasaporte Nº</span>
                  <span className="text-slate-400 text-[10px]">—</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 divide-x divide-black text-[11px]">
              <div className="col-span-5 px-3 py-1.5">
                <span className="font-bold block text-[10px] text-slate-600">
                  Orden de Entrega / Nº Guía de Despacho
                </span>
                <span className="font-semibold text-slate-900 text-[11px]">
                  Orden #{orden.id}
                </span>
              </div>
              <div className="col-span-3 px-3 py-1.5">
                <span className="font-bold block text-[10px] text-slate-600">Fecha:</span>
                <span className="font-semibold text-slate-900 bg-blue-50/40 px-0.5 rounded">
                  {dia}/{mes}/20{decenio}{unidad}
                </span>
              </div>
              <div className="col-span-4 px-3 py-1.5">
                <span className="font-bold block text-[10px] text-slate-600">Forma de Pago:</span>
                <span className="font-semibold text-slate-900">{formaPago || "—"}</span>
              </div>
            </div>
          </div>

          {/* Tabla de 9 renglones */}
          <div className="border border-black rounded-lg overflow-hidden mt-2.5 text-xs">
            <div className="flex items-center border-b border-black bg-slate-50/70 font-bold text-[11px] text-center divide-x divide-black">
              <div className="w-10 py-1.5">Rgl.</div>
              <div className="flex-1 py-1.5">CONCEPTO O DESCRIPCIÓN</div>
              <div className="w-14 py-1.5">CANT.</div>
              <div className="w-28 py-1.5">PRECIO Bs.</div>
              <div className="w-32 py-1.5">Monto Bs.</div>
            </div>

            <div className="divide-y divide-black">
              {renglones.slice(0, 9).map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center divide-x divide-black h-7 text-[11px] ${
                    r.concepto ? "" : "opacity-30"
                  }`}
                >
                  <div className="w-10 text-center font-bold text-slate-800">{i + 1}</div>
                  <div className="flex-1 px-2 h-full flex items-center">
                    <span className="font-semibold text-slate-900 uppercase text-[10px]">
                      {r.concepto}
                    </span>
                  </div>
                  <div className="w-14 text-center font-bold text-slate-700">
                    {r.cantidad > 0 ? r.cantidad : ""}
                  </div>
                  <div className="w-28 px-2 text-right font-semibold text-slate-800">
                    {r.precioBS > 0
                      ? r.precioBS.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : ""}
                  </div>
                  <div className="w-32 px-2 text-right font-black text-slate-900">
                    {r.montoBS > 0
                      ? r.montoBS.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sección inferior */}
          <div className="flex items-start gap-3 mt-2.5">
            {/* Izquierda */}
            <div className="flex-1 space-y-2">
              <div className="border border-black rounded-lg p-2 flex items-center justify-between text-xs">
                <div className="flex items-center flex-1 mr-3">
                  <span className="font-bold mr-2 text-[11px] text-slate-600">Explique:</span>
                  <span className="text-slate-500 text-[10px] italic">
                    Servicios de laboratorio clínico
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold shrink-0">
                  <span>
                    Adiciones{" "}
                    <span className="inline-block w-3.5 h-3.5 border border-black rounded align-middle ml-0.5"></span>
                  </span>
                  <span>
                    Descuentos{" "}
                    <span className="inline-block w-3.5 h-3.5 border border-black rounded align-middle ml-0.5"></span>
                  </span>
                  <span>
                    Bs.{" "}
                    <span className="inline-block w-16 border-b border-black align-middle ml-0.5"></span>
                  </span>
                </div>
              </div>

              <p className="text-[9px] font-bold text-slate-800 px-0.5">
                Este Documento va sin tachaduras ni enmendaduras.
              </p>

              <div className="border border-black rounded-lg p-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[11px]">Nº DE CONTROL</span>
                    <div className="flex items-center">
                      <span className="border border-black px-2 py-0.5 rounded-l font-bold text-xs bg-white">
                        00-
                      </span>
                      <span className="border border-black border-l-0 px-2 py-0.5 rounded-r font-mono font-bold text-[#dc2626] text-sm tracking-widest w-24 text-center bg-yellow-50/20">
                        <span className="opacity-30 text-[9px]">completar</span>
                      </span>
                    </div>
                  </div>
                  <div className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded">
                    COPIA 1
                  </div>
                </div>

                <div className="flex flex-col items-center my-0.5">
                  <svg className="h-6 w-44 text-black" viewBox="0 0 160 24" preserveAspectRatio="none">
                    {[0,5,10,17,22,30,35,42,51,56,63,69,74,82,88,93,100,109,114,120,128,133,140,146,151,157].map(
                      (x, i) => (
                        <rect
                          key={i}
                          x={x}
                          y="0"
                          width={[3,2,4,2,5,2,3,6,2,4,3,2,5,3,2,4,6,2,3,5,2,4,3,2,4,3][i]}
                          height="24"
                          fill="currentColor"
                        />
                      )
                    )}
                  </svg>
                  <span className="font-mono text-[9px] tracking-widest text-slate-700 font-semibold">
                    4073 6932 062026
                  </span>
                </div>

                <p className="text-[8px] font-bold text-slate-600 text-center">
                  (Papel Blanco) CONTABILIDAD &quot;SIN derecho a Crédito Fiscal&quot;
                </p>
              </div>

              <div className="border border-black rounded-lg p-2 flex items-center justify-between text-[10px] font-bold">
                <span>
                  Pago realizado en Divisa o Moneda Extranjera{" "}
                  <span className="inline-block w-3.5 h-3.5 border border-black rounded align-middle ml-0.5"></span>
                </span>
                <span>
                  Alícuota del I.G.T.F{" "}
                  <span className="inline-block w-6 border border-black rounded text-center align-middle mx-0.5"></span>{" "}
                  %
                </span>
              </div>
            </div>

            {/* Derecha: Totales */}
            <div className="w-[300px] border border-black rounded-lg overflow-hidden text-xs divide-y divide-black">
              <div className="flex items-center justify-between p-2">
                <span className="font-medium text-[11px]">Monto Total Exento o Exonerado</span>
                <div className="flex items-center gap-1 font-black text-xs">
                  <span className="text-[9px] text-slate-500">Bs.</span>
                  <span className="min-w-[80px] text-right text-[#1D1D1F]">
                    {totalExentoBS.toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2">
                <span className="font-medium text-[11px]">Monto Total Base Imponible</span>
                <div className="flex items-center gap-2 font-bold text-xs">
                  <span className="text-[9px] text-slate-400">% Bs.</span>
                  <span className="min-w-[60px] text-right text-slate-400">—</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2">
                <span className="font-medium text-[11px]">Monto Total del I.V.A</span>
                <div className="flex items-center gap-2 font-bold text-xs">
                  <span className="text-[9px] text-slate-400">% Bs.</span>
                  <span className="min-w-[60px] text-right text-slate-400">—</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-50/80">
                <span className="text-[11px] font-black">VALOR TOTAL DE LA VENTA Bs.</span>
                <span className="font-black text-sm text-slate-900 min-w-[80px] text-right">
                  {totalExentoBS.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between p-2">
                <span className="font-medium text-[11px]">Monto del I.G.T.F.</span>
                <div className="flex items-center gap-1 font-bold text-xs">
                  <span className="text-[9px]">Bs.</span>
                  <span className="min-w-[80px] text-right text-slate-400">—</span>
                </div>
              </div>

              <div className="p-2 bg-slate-100/70">
                <span className="text-[8px] text-slate-500 block font-semibold">(SNAT/2022/000013)</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs font-black">Total a Pagar Bs.</span>
                  <span className="text-base font-black text-slate-900">
                    {totalExentoBS.toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>


          {/* Aviso de referencia */}
          <div className="no-print mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
            <div className="w-6 h-6 bg-[#0071E3] rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <FileText size={12} className="text-white" />
            </div>
            <p className="text-xs font-semibold text-blue-700 leading-relaxed">
              <strong>Referencia para transcripción manual.</strong> Los valores con fondo azul son los
              datos a copiar en el talonario físico. Los campos en amarillo (Nº Factura, Nº Control)
              se completan con el número correlativo de la imprenta. Tasa BCV aplicada:{" "}
              <strong>Bs. {tasa?.toFixed(2) ?? "cargando..."}</strong>
              {totalServiciosExtraBS > 0 && (
                <span className="block mt-1 text-[11px] text-blue-600 font-medium">
                  * Nota: Se incluye un total de Bs.{" "}
                  {totalServiciosExtraBS.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  por servicios adicionales (toma de muestra / extracción), prorrateados equitativamente entre los ítems para que la sumatoria de los renglones coincida exactamente con el total a pagar.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #factura-papel,
          #factura-papel * {
            visibility: visible;
          }
          #factura-papel {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────────────────────

export default function FactureroPage() {
  const { tasa } = useTasaBCV();

  const [fecha, setFecha] = useState(obtenerFechaHoyVzla());
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [ordenDetalle, setOrdenDetalle] = useState<any | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState<number | null>(null);

  const cambiarDia = (delta: number) => {
    const d = new Date(fecha + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setFecha(d.toLocaleDateString("en-CA", { timeZone: "America/Caracas" }));
  };

  const fetchOrdenes = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/ordenes/diarias?fecha=${fecha}`);
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setOrdenes(data.filter((o: any) => o.estado?.nombre === "CERRADA"));
    } catch {
      toast.error("Error al cargar las órdenes del día");
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  useEffect(() => {
    fetchOrdenes();
  }, [fetchOrdenes]);

  const abrirFactura = async (ordenId: number) => {
    setCargandoDetalle(ordenId);
    try {
      const res = await fetch(`/api/ordenes/${ordenId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrdenDetalle(data);
    } catch {
      toast.error("No se pudo cargar el detalle de la orden");
    } finally {
      setCargandoDetalle(null);
    }
  };

  const ordenesFiltradas = ordenes.filter((o) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      o.paciente?.nombreCompleto?.toLowerCase().includes(q) ||
      o.paciente?.cedula?.toLowerCase().includes(q) ||
      String(o.id).includes(q)
    );
  });

  const formatHora = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-VE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Caracas",
    });

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-2">
      {ordenDetalle && (
        <FacturaPreview orden={ordenDetalle} tasa={tasa} onClose={() => setOrdenDetalle(null)} />
      )}

      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <Receipt className="text-[#0071E3]" size={36} strokeWidth={2.5} />
            Facturero
          </h1>
          <p className="text-[#86868B] mt-2 font-medium text-[15px]">
            Pacientes cerrados del día · Genera la referencia para el talonario físico
          </p>
        </div>
        <button
          onClick={fetchOrdenes}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl shadow-sm transition-all"
        >
          <RefreshCw size={15} />
          Actualizar
        </button>
      </div>

      {/* Navegador de fecha */}
      <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-[#0071E3]">
            <Calendar size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Fecha seleccionada
            </p>
            <p className="text-base font-black text-slate-800 tracking-tight">
              {obtenerFechaDisplay(fecha)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => cambiarDia(-1)}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm"
          >
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            max={obtenerFechaHoyVzla()}
            className="h-9 px-3 bg-[#F5F5F7] border border-slate-200/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
          />
          <button
            onClick={() => cambiarDia(1)}
            disabled={fecha >= obtenerFechaHoyVzla()}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} className="text-slate-600" />
          </button>
          <button
            onClick={() => setFecha(obtenerFechaHoyVzla())}
            className="px-4 py-2 text-xs font-bold text-[#0071E3] bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Buscador y contador */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
        <div className="relative w-full sm:w-[460px] md:w-[500px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por paciente, cédula o N° orden..."
            className="w-full pl-11 pr-10 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 shadow-sm transition-all"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>
            {cargando
              ? "Cargando..."
              : `${ordenesFiltradas.length} paciente${ordenesFiltradas.length !== 1 ? "s" : ""} cerrado${ordenesFiltradas.length !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {/* Grid de cards */}
      {cargando ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-[#0071E3] animate-spin" />
            <p className="text-slate-500 font-medium text-sm">Cargando pacientes del día...</p>
          </div>
        </div>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Receipt size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-bold text-base">
              {busqueda
                ? "Sin resultados para esa búsqueda"
                : "No hay pacientes cerrados para esta fecha"}
            </p>
            <p className="text-slate-400 font-medium text-sm">
              {busqueda
                ? "Intenta con otro nombre o cédula"
                : "Las órdenes pagadas aparecerán aquí"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ordenesFiltradas.map((orden) => (
            <button
              key={orden.id}
              onClick={() => abrirFactura(orden.id)}
              disabled={cargandoDetalle === orden.id}
              className="group relative bg-white border border-slate-200/80 rounded-[20px] p-5 shadow-sm hover:shadow-lg hover:border-[#0071E3]/30 hover:-translate-y-0.5 transition-all duration-200 text-left w-full"
            >
              {/* Badge */}
              <div className="absolute top-4 right-4">
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  <CheckCircle size={9} strokeWidth={2.5} />
                  CERRADA
                </span>
              </div>

              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-[#0071E3] to-blue-600 rounded-[14px] flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-xl leading-none">
                  {(orden.paciente?.nombreCompleto || "?").charAt(0).toUpperCase()}
                </span>
              </div>

              <p className="font-black text-[#1D1D1F] text-sm leading-tight mb-0.5 pr-16 line-clamp-2">
                {orden.paciente?.nombreCompleto}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 mb-3 flex items-center gap-1">
                <User size={10} className="text-slate-400" />
                {orden.paciente?.cedula || "Sin cédula"}
              </p>

              <div className="space-y-1.5 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">Orden</span>
                  <span className="font-black text-slate-800">#{orden.id}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">Hora</span>
                  <span className="font-bold text-slate-700">{formatHora(orden.fechaCreacion)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">Pruebas</span>
                  <span className="font-bold text-slate-700">{orden._count?.detalles ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">Total</span>
                  <span className="font-black text-[#0071E3]">
                    Bs.{" "}
                    {Number(orden.totalBS).toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                {cargandoDetalle === orden.id ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#0071E3]">
                    <Loader2 size={13} className="animate-spin" />
                    Cargando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#0071E3] group-hover:gap-2.5 transition-all">
                    <Receipt size={13} />
                    Ver referencia de factura
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
