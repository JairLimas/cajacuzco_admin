import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Comite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");

  const [solicitud, setSolicitud] = useState(null);
  const [decision, setDecision] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (id) cargarSolicitud();
  }, [id]);

  const cargarSolicitud = async () => {
    const { data } = await supabase.from("prestamos").select("*").eq("id", id).single();
    setSolicitud(data);
  };

  const resolverComite = async () => {
    if (!decision) return;
    setCargando(true);
    await supabase.from("prestamos").update({
      estado: decision,
      observaciones: observaciones || solicitud.observaciones,
    }).eq("id", id);
    setCargando(false);
    if (decision === "aprobado") navigate("/desembolso?id=" + id);
    else navigate("/bandeja");
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
      <h1 className="text-xl font-bold text-gray-800 mb-1">3. Propuesta y Comité</h1>
      <p className="text-sm text-gray-400 mb-6">Resolución del comité de créditos</p>

      {!id ? (
        <div className="bg-white rounded-xl p-6 shadow-sm text-sm text-gray-400">
          Selecciona una solicitud desde la <span className="text-red-600 cursor-pointer underline" onClick={() => navigate("/bandeja")}>Bandeja</span>.
        </div>
      ) : !solicitud ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Expediente */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Expediente del crédito</h2>
            <div className="space-y-3">
              {[
                { label: "Solicitante", value: solicitud.nombre },
                { label: "DNI", value: solicitud.dni },
                { label: "Monto", value: `S/ ${Number(solicitud.monto).toLocaleString()}` },
                { label: "Plazo", value: `${solicitud.plazo} meses` },
                { label: "Cuota mensual", value: `S/ ${cuotaMensual()}` },
                { label: "Ingresos", value: `S/ ${Number(solicitud.ingresos || 0).toLocaleString()}` },
                { label: "Gastos", value: `S/ ${Number(solicitud.gastos || 0).toLocaleString()}` },
                { label: "Garantía", value: solicitud.garantia || "Sin garantía" },
                { label: "Asesor", value: solicitud.asesor || "-" },
                { label: "Scoring", value: `${solicitud.scoring}/100` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>

            {solicitud.observaciones && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Observaciones del asesor</p>
                <p className="text-sm text-gray-700">{solicitud.observaciones}</p>
              </div>
            )}
          </div>

          {/* Resolución */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Resolución del comité</h2>
            <div className="space-y-4">
              <div className={`rounded-lg p-4 text-center ${
                solicitud.scoring >= 75 ? "bg-green-50" :
                solicitud.scoring >= 60 ? "bg-yellow-50" : "bg-red-50"
              }`}>
                <p className="text-xs text-gray-400 mb-1">Scoring</p>
                <p className={`text-3xl font-bold ${
                  solicitud.scoring >= 75 ? "text-green-600" :
                  solicitud.scoring >= 60 ? "text-yellow-600" : "text-red-600"
                }`}>{solicitud.scoring}/100</p>
                <p className="text-xs text-gray-500 mt-1">
                  {solicitud.scoring >= 75 ? "✅ Recomendado para aprobación" :
                   solicitud.scoring >= 60 ? "⚠️ Análisis adicional requerido" :
                   "❌ No recomendado"}
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-2 block">Decisión del comité</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDecision("aprobado")}
                    className={`py-3 rounded-lg text-sm font-semibold border-2 transition ${
                      decision === "aprobado"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500 hover:border-green-300"
                    }`}
                  >
                    ✅ Aprobar
                  </button>
                  <button
                    onClick={() => setDecision("rechazado")}
                    className={`py-3 rounded-lg text-sm font-semibold border-2 transition ${
                      decision === "rechazado"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 text-gray-500 hover:border-red-300"
                    }`}
                  >
                    ❌ Rechazar
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Observaciones del comité</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Resolución y comentarios del comité..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>

              <button
                onClick={resolverComite}
                disabled={!decision || cargando}
                className="w-full bg-red-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {cargando ? "Guardando..." : decision === "aprobado" ? "Aprobar y continuar →" : "Confirmar resolución"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}