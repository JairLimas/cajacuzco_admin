import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Login() {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    if (!dni || !password) {
      setError("Completa todos los campos.");
      return;
    }
    setCargando(true);

    const { data: usuario } = await supabase
      .from("admin_usuarios")
      .select("*")
      .eq("numerodni", dni)
      .single();

    if (!usuario) {
      setError("Usuario no encontrado.");
      setCargando(false);
      return;
    }

    if (usuario.numerodni !== password) {
      setError("Contraseña incorrecta.");
      setCargando(false);
      return;
    }

    localStorage.setItem("admin_auth", "true");
    localStorage.setItem("admin_id", usuario.id);
    localStorage.setItem("admin_nombre", usuario.nombre);
    localStorage.setItem("admin_rol", usuario.rol);
    localStorage.setItem("admin_cargo", usuario.cargo);

    setCargando(false);
    navigate("/dashboard");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/1280px-Machu_Picchu%2C_Peru.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black opacity-50" />

      <div className="relative z-10 bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">CC</span>
          </div>
          <div>
            <h1 className="text-gray-800 font-bold text-lg leading-tight">Caja Cusco</h1>
            <p className="text-gray-400 text-xs">Core Financiero — Admin</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-1">Iniciar sesión</h2>
        <p className="text-sm text-gray-400 mb-6">Acceso exclusivo para personal autorizado</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">DNI (usuario)</label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ej: 10000001"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Contraseña (mismo DNI)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={cargando}
            className="w-full bg-red-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            {cargando ? "Verificando..." : "Ingresar"}
          </button>
        </div>

        <p className="text-xs text-gray-300 text-center mt-6">Sistema restringido · Solo personal autorizado</p>
      </div>
    </div>
  );
}