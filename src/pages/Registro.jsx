import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Registro() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");

  const [solicitud, setSolicitud] = useState(null);
  const [observaciones, setObservaciones] = useState("");
  const [asesor, setAsesor] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (id) cargarSolicitud();
  }, [id]);

  const cargarSolicitud = async () => {
    const { data } = await supabase.from("prestamos").select("*").eq("id", id).single();
    setSolicitud(data);
    if (data?.observaciones) setObservaciones(data.observaciones);
    if (data?.asesor) setAsesor(data.asesor);
  };

  const enviarComite = async () => {
    if (!asesor) return;
    setCargando(true);
    await supabase.from("prestamos").update({
      observaciones,
      asesor,
      estado: "en_comite",
    }).eq("id", id);
    setCargando(false);
    navigate("/comite?id=" + id);
  };

  const cuotaMensual = () => {
    if (!solicitud) return 0;
    const tasa = 0.018;
    const n = solicitud.plazo;
    const c = solicitud.monto;
    return ((c * tasa * Math.pow(1 + tasa, n)) / (Math.pow(1 + tasa, n) - 1)).toFixed(2);
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-1">2. Registro de solicitud</h1>
      <p className="text-sm text-gray-400 mb-6">Registro formal y propuesta de crédito</p>

      {!id ? (
        <div className="bg-white rounded-xl p-6 shadow-sm text-sm text-gray-400">
          Selecciona una solicitud desde la <span className="text-red-600 cursor-pointer underline" onClick={() => navigate("/bandeja")}>Bandeja</span>.
        </div>
      ) : !solicitud ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Resumen del crédito */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Resumen del crédito</h2>
            <div className="space-y-3">
              {[
                { label: "Solicitante", value: solicitud.nombre },
                { label: "DNI", value: solicitud.dni },
                { label: "Monto", value: `S/ ${Number(solicitud.monto).toLocaleString()}` },
                { label: "Plazo", value: `${solicitud.plazo} meses` },
                { label: "Tasa mensual", value: "1.8%" },
                { label: "Cuota mensual", value: `S/ ${cuotaMensual()}` },
                { label: "Total a pagar", value: `S/ ${(cuotaMensual() * solicitud.plazo).toFixed(2)}` },
                { label: "Ingresos", value: `S/ ${Number(solicitud.ingresos || 0).toLocaleString()}` },
                { label: "Gastos", value: `S/ ${Number(solicitud.gastos || 0).toLocaleString()}` },
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

          {/* Propuesta */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Propuesta del asesor</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre del asesor</label>
                <input
                  type="text"
                  value={asesor}
                  onChange={(e) => setAsesor(e.target.value)}
                  placeholder="Ej: Carlos Mamani"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Observaciones</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ingresa observaciones relevantes del crédito..."
                  rows={5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>

              <div className={`rounded-lg p-3 text-sm font-medium text-center ${
                solicitud.scoring >= 75 ? "bg-green-50 text-green-700" :
                solicitud.scoring >= 60 ? "bg-yellow-50 text-yellow-700" :
                "bg-red-50 text-red-700"
              }`}>
                Scoring: {solicitud.scoring}/100 —{" "}
                {solicitud.scoring >= 75 ? "Recomendado para aprobación" :
                 solicitud.scoring >= 60 ? "Requiere análisis adicional" :
                 "No recomendado"}
              </div>

              <button
                onClick={enviarComite}
                disabled={!asesor || cargando}
                className="w-full bg-red-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {cargando ? "Guardando..." : "Enviar a comité →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}