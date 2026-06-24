import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">Caja Cusco — <span className="font-semibold text-gray-700">Core Financiero</span></p>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">Administrador · Ag. 0001</p>
            <button className="text-sm text-red-600 hover:underline font-medium">Cerrar sesión</button>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}