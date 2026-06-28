import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem("admin_nombre") || "Administrador";
  const cargo = localStorage.getItem("admin_cargo") || "Core Financiero";

  const cerrarSesion = () => {
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_id");
    localStorage.removeItem("admin_nombre");
    localStorage.removeItem("admin_rol");
    localStorage.removeItem("admin_cargo");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">Caja Cusco — <span className="font-semibold text-gray-700">Core Financiero</span></p>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">{nombre}</p>
              <p className="text-xs text-gray-400">{cargo}</p>
            </div>
            <button
              onClick={cerrarSesion}
              className="text-sm text-red-600 hover:underline font-medium"
            >
              Cerrar sesión
            </button>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}