"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FileSignature, ArrowLeft } from "lucide-react";

// Hooks y Componentes
import useTasaBCV from "../../hooks/useTasaBcv";
import BuscadorPaciente from "../../components/registro/BuscadorPaciente";
import TarjetaPaciente from "../../components/registro/TarjetaPaciente";
import FormularioPaciente from "../../components/registro/FormularioPaciente";
import SeleccionPruebas from "../../components/registro/SeleccionPruebas";
import ResumenPago from "../../components/registro/ResumenPago";
import ServiciosExtras from "../../components/registro/ServiciosExtras";

function RegistroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Estados del Paciente
  const [cedulaBusqueda, setCedulaBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [isCreandoNuevo, setIsCreandoNuevo] = useState(false);
  const [guardandoPaciente, setGuardandoPaciente] = useState(false);
  const [guardandoOrden, setGuardandoOrden] = useState(false);
  const [formData, setFormData] = useState({
    esBebe: false, cedula: "", nombreCompleto: "", fechaNacimiento: "",
    sexo: "M", telefono: "", correo: "", direccion: "", observaciones: ""
  });

  // Estados de Pruebas y Tasa
  const [pruebasCatalogo, setPruebasCatalogo] = useState<any[]>([]);
  const [pruebasSeleccionadas, setPruebasSeleccionadas] = useState<any[]>([]);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<any[]>([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<any[]>([]);
  const { tasa } = useTasaBCV();
  const tasaBCV = tasa ?? 36.5;

  // 1. Cargar Catálogo de Pruebas
  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        const res = await fetch("/api/pruebas");
        const subcategorias = await res.json();
        
        const listaAplanada: any[] = [];
        
        subcategorias.forEach((sub: any) => {
          if (!sub.activa) return;
          
          if (sub.esPaquete) {
            listaAplanada.push({
              id: `sub-${sub.id}`,
              idReal: sub.id,
              tipo: "PAQUETE",
              codigo: sub.pruebas[0]?.codigo.split('-')[0] || "PK", 
              nombre: sub.nombre,
              precioUSD: sub.precioUSD,
              pruebasHijas: sub.pruebas,
              categoriaNombre: sub.categoria?.nombre || "S/C",
              subcategoriaNombre: sub.nombre 
            });
          } else {
            sub.pruebas.forEach((p: any) => {
              if (!p.activa) return;
              listaAplanada.push({
                ...p,
                tipo: "INDIVIDUAL",
                idReal: p.id,
                nombre: p.nombre,
                precioUSD: p.precioUSD,
                categoriaNombre: sub.categoria?.nombre || "S/C",
                subcategoriaNombre: sub.nombre
              });
            });
          }
        });
        
        setPruebasCatalogo(listaAplanada);
      } catch (e: any) {
        toast.error(e?.message ? `Error al cargar el catálogo de pruebas: ${e?.message}` : "Error al cargar el catálogo de pruebas");
      }
    };
    fetchCatalogo();
  }, []);

  // 1b. Cargar Catálogo de Servicios Extra
  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const res = await fetch("/api/servicios-extra");
        if (res.ok) {
          const data = await res.json();
          setServiciosCatalogo(data);
        }
      } catch (e: any) {
        // Silencioso — los servicios son opcionales
      }
    };
    fetchServicios();
  }, []);

  // 2. Lógica de Edición
  useEffect(() => {
    if (editId) {
      const cargarOrdenParaEdicion = async () => {
        try {
          const res = await fetch(`/api/ordenes/${editId}`);
          const orden = await res.json();

          if (res.ok && orden) {
            setPacienteSeleccionado(orden.paciente);
            const pruebasReconstruidas: any[] = [];
            const paquetesMap = new Map<string, any>();

            orden.detalles.forEach((d: any) => {
              if (d.prueba?.subcategoria?.esPaquete) {
                const subcatId = d.prueba.subcategoria.id;
                if (!paquetesMap.has(subcatId)) {
                  paquetesMap.set(subcatId, {
                    tipo: "PAQUETE",
                    id: subcatId,
                    codigo: d.prueba.codigo.split('-')[0] || "PK",
                    nombre: d.prueba.subcategoria.nombre,
                    precioUSD: d.precioCongeladoUSD || 0,
                    descInd: d.descuento || 0,
                    tipoDescInd: d.tipoDescuento?.nombre || "PORCENTAJE",
                    cantidad: d.cantidad || 1,
                    pruebasHijas: [d.prueba],
                    categoriaNombre: d.prueba.subcategoria.categoria?.nombre || "S/C",
                    subcategoriaNombre: d.prueba.subcategoria.nombre
                  });
                } else {
                  const paq = paquetesMap.get(subcatId);
                  paq.pruebasHijas.push(d.prueba);
                  if (d.precioCongeladoUSD > 0) {
                    paq.precioUSD = d.precioCongeladoUSD;
                    paq.descInd = d.descuento || 0;
                    paq.tipoDescInd = d.tipoDescuento?.nombre || "PORCENTAJE";
                  }
                }
              } else {
                pruebasReconstruidas.push({
                  ...d.prueba,
                  idReal: d.prueba.id,
                  tipo: "INDIVIDUAL", 
                  cantidad: d.cantidad,
                  precioUSD: d.precioCongeladoUSD,
                  descInd: d.descuento,
                  tipoDescInd: d.tipoDescuento?.nombre || "PORCENTAJE",
                  categoriaNombre: d.prueba?.subcategoria?.categoria?.nombre || "Desconocida",
                  subcategoriaNombre: d.prueba?.subcategoria?.nombre || "Desconocida"
                });
              }
            });

            paquetesMap.forEach(paq => pruebasReconstruidas.push(paq));
            setPruebasSeleccionadas(pruebasReconstruidas);

            // Cargar servicios extra de la orden si los hay
            if (orden.serviciosExtra && orden.serviciosExtra.length > 0) {
              setServiciosSeleccionados(orden.serviciosExtra.map((se: any) => ({
                ...se.servicio,
                cantidad: se.cantidad || 1
              })));
            }

            toast.info(`Editando Orden #${editId}`, {
              toastId: `edit-toast-${editId}`
            });

          } else {
            toast.error(orden.error ? `Error al obtener la orden: ${orden.error}` : "Error al obtener la orden");
          }
        } catch (error: any) {
          toast.error(error?.message ? `No se pudo cargar la orden para editar: ${error?.message}` : "No se pudo cargar la orden para editar");
        }
      };
      cargarOrdenParaEdicion();
    }
  }, [editId]);

  const buscarPaciente = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cedulaBusqueda.trim()) return;
    setBuscando(true);
    setResultadosBusqueda([]);
    try {
      const res = await fetch(`/api/pacientes?q=${cedulaBusqueda}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al buscar paciente");
      }
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
        if (data.length === 1) {
          setPacienteSeleccionado(data[0]);
          setIsCreandoNuevo(false);
          toast.success("Paciente encontrado");
        } else {
          setResultadosBusqueda(data);
          toast.info("Múltiples coincidencias. Seleccione un paciente de la lista.");
        }
      } else {
        toast.info("Paciente no registrado. Complete los datos.");
        const isNumeric = /^\d+$/.test(cedulaBusqueda.trim());
        setFormData({ 
          ...formData, 
          cedula: isNumeric ? cedulaBusqueda.trim() : "", 
          nombreCompleto: !isNumeric ? cedulaBusqueda.toUpperCase() : "",
          esBebe: false 
        });
        setIsCreandoNuevo(true);
      }
    } catch (error: any) {
      toast.error(error?.message ? `Error de conexión al buscar paciente: ${error?.message}` : "Error de conexión al buscar paciente");
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarDeLista = (paciente: any) => {
    setPacienteSeleccionado(paciente);
    setResultadosBusqueda([]);
    setIsCreandoNuevo(false);
    toast.success("Paciente seleccionado");
  };

  const iniciarRegistroSinCedula = () => {
    setFormData({ ...formData, esBebe: true, cedula: "" });
    setIsCreandoNuevo(true);
  };

  const registrarNuevoPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(formData.fechaNacimiento)) {
      toast.error("Formato de fecha inválido. Use DD/MM/AAAA");
      return;
    }
    const [dia, mes, ano] = formData.fechaNacimiento.split('/');
    
    // Validación lógica de fecha (meses entre 1 y 12, días entre 1 y 31)
    const mesNum = parseInt(mes, 10);
    const diaNum = parseInt(dia, 10);
    if (mesNum < 1 || mesNum > 12 || diaNum < 1 || diaNum > 31) {
      toast.error("Fecha inválida: verifique que el mes o el día existan.");
      return;
    }

    const fechaISO = `${ano}-${mes}-${dia}T12:00:00Z`;
    const dateCheck = new Date(fechaISO);
    if (isNaN(dateCheck.getTime())) {
      toast.error("La fecha ingresada no existe en el calendario.");
      return;
    }

    setGuardandoPaciente(true);
    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, fechaNacimiento: fechaISO }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Paciente registrado exitosamente");
      setPacienteSeleccionado(data);
      setIsCreandoNuevo(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGuardandoPaciente(false);
    }
  };

  const limpiarSeleccion = () => {
    setPacienteSeleccionado(null);
    setCedulaBusqueda("");
    setResultadosBusqueda([]);
    setIsCreandoNuevo(false);
    setPruebasSeleccionadas([]);
    setServiciosSeleccionados([]);
    setFormData({
      esBebe: false, cedula: "", nombreCompleto: "", fechaNacimiento: "",
      sexo: "M", telefono: "", correo: "", direccion: "", observaciones: ""
    });
    if (editId) router.push("/home/registro"); 
  };

  const finalizarOrden = async (resumenData: any) => {
    if (resumenData.estado === "CERRADA" && resumenData.restanteUSD > 0.005) {
      toast.error(`La orden no puede ser CERRADA con saldo pendiente.`);
      return;
    }
    
    if (guardandoOrden) return;

    setGuardandoOrden(true);
    toast.info(editId ? "Actualizando orden..." : "Guardando orden...");

    const pruebasParaEnviar: any[] = [];

    pruebasSeleccionadas.forEach(item => {
      if (item.tipo === "PAQUETE") {
        item.pruebasHijas.forEach((ph: any, index: number) => {
          pruebasParaEnviar.push({
            pruebaId: ph.id,
            cantidad: item.cantidad,
            precioCongelado: index === 0 ? item.precioUSD : 0, 
            descuentoInd: index === 0 ? (item.descInd || 0) : 0,
            tipoDescuentoInd: item.tipoDescInd || "PORCENTAJE"
          });
        });
      } else {
        pruebasParaEnviar.push({
          pruebaId: item.idReal || item.id,
          cantidad: item.cantidad,
          precioCongelado: item.precioUSD,
          descuentoInd: item.descInd || 0,
          tipoDescuentoInd: item.tipoDescInd || "PORCENTAJE"
        });
      }
    });

    const ordenParaGuardar = {
      pacienteId: pacienteSeleccionado.id,
      estado: resumenData.estado,
      tasaBCV: tasaBCV,
      subtotalUSD: resumenData.subtotalUSD,
      totalUSD: resumenData.totalFinalUSD,
      totalBS: resumenData.totalFinalBS,
      descuentoGeneral: resumenData.descuentoGeneral,
      tipoDescuentoGral: resumenData.tipoDescGral,
      pruebas: pruebasParaEnviar,
      serviciosExtra: serviciosSeleccionados.map((s: any) => ({
        servicioId: s.id,
        cantidad: s.cantidad || 1,
        precioCongelado: s.precioUSD,
      })),
      pagos: resumenData.pagos.filter((p: any) => p.metodoId && p.monto > 0).map((p: any) => ({
        metodoId: p.metodoId,
        monto: p.monto,
        moneda: p.moneda || "USD",
        referencia: p.referencia || ""
      }))
    };

    try {
      const url = editId ? `/api/ordenes/${editId}` : "/api/ordenes";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordenParaGuardar)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editId ? "Orden actualizada correctamente" : "Orden guardada correctamente");

      if (editId) {
        router.push("/home/diaria");
      } else {
        limpiarSeleccion();
      }
    } catch (error: any) {
      toast.error(error.message ? `Error al procesar la orden: ${error.message}` : "Error al procesar la orden");
    } finally {
      setGuardandoOrden(false);
    }
  };

  return (
    <div className="h-full flex flex-col pb-10 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="font-title text-4xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <FileSignature className="text-[#0071E3]" size={36} strokeWidth={2.5} />
            {editId ? `Editando Orden #${editId}` : "Nueva Orden de Laboratorio"}
          </h1>
          <p className="text-[#86868B] mt-2 font-medium text-[15px]">
            {editId ? "Modifique los exámenes o datos de la orden seleccionada." : "Gestión integral de pacientes, pruebas y facturación."}
          </p>
        </div>
        {editId && (
          <button
            onClick={() => router.push("/home/diaria")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
          >
            <ArrowLeft size={18} /> Volver a Lista Diaria
          </button>
        )}
      </div>

      <section className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] font-bold shrink-0">1</div>
          <h2 className="text-xl font-bold text-[#1D1D1F]">Datos del Paciente</h2>
        </div>
        {!pacienteSeleccionado && !isCreandoNuevo && (
          <BuscadorPaciente
            cedulaBusqueda={cedulaBusqueda} setCedulaBusqueda={setCedulaBusqueda}
            buscando={buscando} buscarPaciente={buscarPaciente}
            iniciarRegistroSinCedula={iniciarRegistroSinCedula}
            resultadosBusqueda={resultadosBusqueda}
            seleccionarDeLista={seleccionarDeLista}
          />
        )}
        {pacienteSeleccionado && (
          <TarjetaPaciente
            paciente={pacienteSeleccionado}
            limpiarSeleccion={limpiarSeleccion}
            onActualizarPaciente={setPacienteSeleccionado} 
          />
        )}
        {!pacienteSeleccionado && isCreandoNuevo && (
          <FormularioPaciente
            formData={formData} setFormData={setFormData}
            registrarNuevoPaciente={registrarNuevoPaciente}
            guardandoPaciente={guardandoPaciente} limpiarSeleccion={limpiarSeleccion}
          />
        )}
      </section>

      {pacienteSeleccionado && (
        <ServiciosExtras
          catalogo={serviciosCatalogo}
          seleccionados={serviciosSeleccionados}
          onCambio={setServiciosSeleccionados}
          tasaBCV={tasaBCV}
        />
      )}

      {pacienteSeleccionado && (
        <SeleccionPruebas
          pruebasCatalogo={pruebasCatalogo} pruebasSeleccionadas={pruebasSeleccionadas}
          setPruebasSeleccionadas={setPruebasSeleccionadas} tasaBCV={tasaBCV}
        />
      )}

      {pruebasSeleccionadas.length > 0 && (
        <ResumenPago
          pruebasSeleccionadas={pruebasSeleccionadas} setPruebasSeleccionadas={setPruebasSeleccionadas}
          serviciosSeleccionados={serviciosSeleccionados}
          tasaBCV={tasaBCV} onFinalizar={finalizarOrden} guardandoOrden={guardandoOrden}
        />
      )}

      {!pacienteSeleccionado && (
        <div className="mt-10 p-12 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-400">
          <p className="font-medium">Seleccione un paciente para habilitar las secciones de pruebas y pagos.</p>
        </div>
      )}
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Cargando módulo de registro...</div>}>
      <RegistroContent />
    </Suspense>
  );
}