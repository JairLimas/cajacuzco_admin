import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { CheckCircle } from "lucide-react";

export default function Desembolso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");

  const [solicitud, setSolicitud] = useState(null);
  const [desembolsado, setDesembolsado] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (id) cargarSolicitud();
  }, [id]);

  const cargarSolicitud = async () => {
    const { data } = await supabase.from("prestamos").select("*").eq("id", id).single();
    setSolicitud(data);
    if (data?.estado === "desembolsado") setDesembolsado(true);
  };

  const cuotaMensual = () => {
    if (!solicitud) return 0;
    const tasa = (parseFloat(solicitud.tasa_interes) || 1.8) / 100;
    const n = solicitud.plazo;
    const c = solicitud.monto;
    return ((c * tasa * Math.pow(1 + tasa, n)) / (Math.pow(1 + tasa, n) - 1)).toFixed(2);
  };

  const realizarDesembolso = async () => {
    setCargando(true);

    await supabase.from("prestamos").update({
      estado: "desembolsado",
      fecha_desembolso: new Date().toISOString(),
    }).eq("id", id);

    const { data: cuenta } = await supabase
      .from("cuentas")
      .select("*")
      .eq("usuario_id", solicitud.usuario_id)
      .single();

    if (cuenta) {
      await supabase.from("cuentas").update({
        saldo: Number(cuenta.saldo) + Number(solicitud.monto),
      }).eq("id", cuenta.id);

      await supabase.from("movimientos").insert({
        cuenta_id: cuenta.id,
        descripcion: `Desembolso de préstamo`,
        monto: Number(solicitud.monto),
        tipo: "entrada",
        categoria: "Préstamo",
        fecha: new Date().toISOString(),
      });
    }

    setCargando(false);
    setDesembolsado(true);
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-1">4. Aprobación y Desembolso</h1>
      <p className="text-sm text-gray-400 mb-6">Confirmación y desembolso del crédito aprobado</p>

      {!id ? (
        <div className="bg-white rounded-xl p-6 shadow-sm text-sm text-gray-400">
          Selecciona una solicitud desde la <span className="text-red-600 cursor-pointer underline" onClick={() => navigate("/bandeja")}>Bandeja</span>.
        </div>
      ) : !solicitud ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : desembolsado ? (
        <div className="bg-white rounded-xl p-10 shadow-sm flex flex-col items-center gap-4 text-center">
          <CheckCircle size={56} className="text-green-500" />
          <h2 className="text-xl font-bold text-gray-800">¡Crédito desembolsado!</h2>
          <p className="text-sm text-gray-400">El monto de <span className="font-bold text-gray-700">S/ {Number(solicitud.monto).toLocaleString()}</span> fue desembolsado exitosamente a {solicitud.nombre}.</p>
          <p className="text-xs text-gray-400">Fecha: {solicitud.fecha_desembolso ? new Date(solicitud.fecha_desembolso).toLocaleDateString("es-PE") : new Date().toLocaleDateString("es-PE")}</p>
          <button
            onClick={() => navigate("/bandeja")}
            className="mt-2 px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
          >
            Volver a bandeja
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Detalle del crédito aprobado</h2>
            <div className="space-y-3">
              {[
                { label: "Solicitante", value: solicitud.nombre },
                { label: "DNI", value: solicitud.dni },
                { label: "Monto a desembolsar", value: `S/ ${Number(solicitud.monto).toLocaleString()}` },
                { label: "Plazo", value: `${solicitud.plazo} meses` },
                { label: "Cuota mensual", value: `S/ ${cuotaMensual()}` },
                { label: "Total a pagar", value: `S/ ${(cuotaMensual() * solicitud.plazo).toFixed(2)}` },
                { label: "Tasa mensual", value: `${solicitud.tasa_interes || 1.8}%` },
                { label: "Asesor", value: solicitud.asesor || "-" },
                { label: "Scoring", value: `${solicitud.scoring}/100` },
                { label: "Garantía", value: solicitud.garantia || "Sin garantía" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Confirmar desembolso</h2>

            <div className="bg-green-50 rounded-xl p-5 mb-6 text-center">
              <p className="text-xs text-gray-400 mb-1">Monto a desembolsar</p>
              <p className="text-4xl font-bold text-green-600">S/ {Number(solicitud.monto).toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-2">A nombre de {solicitud.nombre}</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-xs text-blue-600 font-semibold mb-2">Cronograma de pagos</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {Array.from({ length: solicitud.plazo }, (_, i) => {
                  const fecha = new Date();
                  fecha.setMonth(fecha.getMonth() + i + 1);
                  return (
                    <div key={i} className="flex justify-between text-xs text-gray-600">
                      <span>Cuota {i + 1} — {fecha.toLocaleDateString("es-PE", { month: "short", year: "numeric" })}</span>
                      <span className="font-medium">S/ {cuotaMensual()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={realizarDesembolso}
              disabled={cargando}
              className="w-full bg-red-600 text-white rounded-lg py-3 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
            >
              {cargando ? "Procesando..." : "✅ Confirmar desembolso"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}