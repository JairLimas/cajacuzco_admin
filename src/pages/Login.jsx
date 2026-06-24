import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_USER = "admin";
const ADMIN_PASS = "cajacuzco2024";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (usuario === ADMIN_USER && password === ADMIN_PASS) {
      localStorage.setItem("admin_auth", "true");
      navigate("/dashboard");
    } else {
      setError("Usuario o contraseña incorrectos.");
    }
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
        <p className="text-sm text-gray-400 mb-6">Acceso exclusivo para administradores</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="admin"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Contraseña</label>
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
            className="w-full bg-red-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-red-700 transition"
          >
            Ingresar
          </button>
        </div>

        <p className="text-xs text-gray-300 text-center mt-6">Sistema restringido · Solo personal autorizado</p>
      </div>
    </div>
  );
}