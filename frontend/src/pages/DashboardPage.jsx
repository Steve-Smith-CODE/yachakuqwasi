import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import StudentDashboard from "./StudentDashboard.jsx";
import LandlordDashboard from "./LandlordDashboard.jsx";

const ROLE_INTRO = {
  student: "Gestiona tu vida universitaria: carnet digital, presupuesto mensual y chats con arrendadores.",
  landlord: "Administra tus alquileres activos, monitorea las solicitudes de estudiantes e inspecciona tus ingresos."
};

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-guindo animate-pulse" />
            <span className="text-[10px] font-black text-guindo uppercase tracking-wider font-mono">
              Portal del {user.role === "student" ? "Estudiante" : "Arrendatario de Viviendas"}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex flex-wrap items-center gap-2">
            <span>¡Allillanchu, {user.name}!</span>
            {user.is_verified && (
              <span className="bg-amber-100 text-amber-800 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 border border-amber-200">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                <span>Verificado por Maki</span>
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-xs mt-1">{ROLE_INTRO[user.role]}</p>
        </div>
      </div>

      {user.role === "landlord" ? <LandlordDashboard /> : <StudentDashboard />}
    </div>
  );
}
