import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { AlertTriangle } from "lucide-react";

export default function BandejaMora() {
  const [prestamos, setPrestamos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarMora();
  }, []);

  const cargarMora = async () => {
    const { data } = await supabase
      .from("prestamos")
      .select("*")
      .eq("estado", "desembolsado")
      .order("dias_mora", { ascending: false });
    setPrestamos(data || []);
    setCargando(false);
  };

  const actualizarMora = async (id, dias) => {
    await supabase.from("prestamos").update({ dias_mora: parseInt(dias) }).eq("id", id);
    cargarMora();
  };

  const nivelMora = (dias) => {
    if (dias === 0) return { label: "Al día", color: "bg-green-100 text-green-700" };
    if (dias <= 30) return { label: "Mora leve", color: "bg-yellow-100 text-yellow-700" };
    if (dias <= 90) return { label: "Mora moderada", color: "bg-orange-100 text-orange-700" };
    return { label: "Mora grave", color: "bg-red-100 text-red-700" };
  };

  const cuotaMensual = (p) => {
    const tasa = 0.018;
    const n = p.plazo;
    const c = p.monto;
    return ((c * tasa * Math.pow(1 + tasa, n)) / (Math.pow(1 + tasa, n) - 1)).toFixed(2);
  };

  const totalMora = prestamos.filter(p => p.dias_mora > 0).reduce((a, p) => a + Number(p.monto), 0);
  const enMora = prestamos.filter(p => p.dias_mora > 0).length;
  const alDia = prestamos.filter(p => p.dias_mora === 0).length;
  const ratioMora = prestamos.length > 0 ? ((enMora / prestamos.length) * 100).toFixed(1) : 0;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-1">Bandeja de Mora</h1>
      <p className="text-sm text-gray-400 mb-6">Seguimiento y recuperación de créditos vencidos</p>

      {/* KPIs mora */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total cartera", value: prestamos.length, color: "border-l-4 border-gray-300" },
          { label: "Al día", value: alDia, color: "border-l-4 border-green-500" },
          { label: "En mora", value: enMora, color: "border-l-4 border-red-500" },
          { label: "Ratio de mora", value: `${ratioMora}%`, color: "border-l-4 border-orange-500" },
        ].map((k) => (
          <div key={k.label} className={`bg-white rounded-xl p-4 shadow-sm ${k.color}`}>
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className="text-2xl font-bold text-gray-800">{k.value}</p>
          </div>
        ))}
      </div>

      {enMora > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500" />
          <p className="text-sm text-red-700">
            <span className="font-bold">{enMora} crédito(s)</span> en mora por un total de{" "}
            <span className="font-bold">S/ {totalMora.toLocaleString()}</span>
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {cargando ? (
          <p className="p-6 text-sm text-gray-400">Cargando...</p>
        ) : prestamos.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No hay créditos desembolsados aún.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Deudor</th>
                <th className="px-6 py-3 text-left">DNI</th>
                <th className="px-6 py-3 text-left">Monto</th>
                <th className="px-6 py-3 text-left">Cuota</th>
                <th className="px-6 py-3 text-left">Desembolso</th>
                <th className="px-6 py-3 text-left">Días mora</th>
                <th className="px-6 py-3 text-left">Nivel</th>
                <th className="px-6 py-3 text-left">Actualizar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prestamos.map((p) => {
                const nivel = nivelMora(p.dias_mora || 0);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">{p.nombre}</td>
                    <td className="px-6 py-4 text-gray-500">{p.dni}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">S/ {Number(p.monto).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500">S/ {cuotaMensual(p)}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {p.fecha_desembolso ? new Date(p.fecha_desembolso).toLocaleDateString("es-PE") : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        defaultValue={p.dias_mora || 0}
                        min={0}
                        onBlur={(e) => actualizarMora(p.id, e.target.value)}
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${nivel.color}`}>
                        {nivel.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => actualizarMora(p.id, 0)}
                        className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 transition"
                      >
                        Regularizar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}