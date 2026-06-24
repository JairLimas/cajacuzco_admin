import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function BandejaCreditos() {
  const [creditos, setCreditos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    cargarCreditos();
  }, []);

  const cargarCreditos = async () => {
    const { data } = await supabase
      .from("creditos")
      .select("*")
      .order("created_at", { ascending: false });
    setCreditos(data || []);
    setCargando(false);
  };

  const cambiarEstado = async (id, estado) => {
    await supabase.from("creditos").update({ estado }).eq("id", id);
    cargarCreditos();
  };

  const colorEstado = (estado) => {
    if (estado === "aprobado" || estado === "desembolsado") return "bg-green-100 text-green-700";
    if (estado === "rechazado") return "bg-red-100 text-red-700";
    if (estado === "en_evaluacion" || estado === "en_comite") return "bg-orange-100 text-orange-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const filtrados = filtro === "todos"
    ? creditos
    : creditos.filter(c => c.estado === filtro);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Bandeja de Créditos</h1>
          <p className="text-sm text-gray-400">Gestiona todas las solicitudes de crédito</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: "todos", label: "Todos" },
          { value: "pendiente", label: "Pendientes" },
          { value: "en_evaluacion", label: "En Evaluación" },
          { value: "en_comite", label: "En Comité" },
          { value: "aprobado", label: "Aprobados" },
          { value: "desembolsado", label: "Desembolsados" },
          { value: "rechazado", label: "Rechazados" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filtro === f.value
                ? "bg-red-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {cargando ? (
          <p className="p-6 text-sm text-gray-400">Cargando...</p>
        ) : filtrados.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No hay solicitudes.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Solicitante</th>
                <th className="px-6 py-3 text-left">DNI</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-left">Monto</th>
                <th className="px-6 py-3 text-left">Plazo</th>
                <th className="px-6 py-3 text-left">Ingresos</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{c.nombre}</td>
                  <td className="px-6 py-4 text-gray-500">{c.dni}</td>
                  <td className="px-6 py-4 text-gray-500">{c.tipo_credito}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">S/ {Number(c.monto).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-500">{c.plazo} meses</td>
                  <td className="px-6 py-4 text-gray-500">S/ {Number(c.ingresos || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorEstado(c.estado)}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(c.created_at).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-6 py-4">
                    {c.estado === "pendiente" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => cambiarEstado(c.id, "aprobado")}
                          className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 transition"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => cambiarEstado(c.id, "rechazado")}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}