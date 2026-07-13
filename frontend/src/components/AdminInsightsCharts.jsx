import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const STATUS_COLOR = {
  approved: "#10b981",
  pending: "#f59e0b",
  suspended: "#ef4444",
  flagged: "#ef4444"
};

const STATUS_LABEL = {
  approved: "Aprobadas",
  pending: "Pendientes",
  suspended: "Suspendidas",
  flagged: "Observadas"
};

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">{title}</h4>
      {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function AdminInsightsCharts({ registrationTrend, housingByStatus }) {
  const statusData = Object.entries(housingByStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ status, count, label: STATUS_LABEL[status] || status }));

  const hasStatusData = statusData.length > 0;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <ChartCard title="Tendencia de Registros" subtitle="Usuarios y anuncios nuevos, últimos 14 días">
        <div
          className="h-56"
          role="img"
          aria-label="Gráfico de línea: registros diarios de usuarios y anuncios en los últimos 14 días"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={registrationTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Line type="monotone" dataKey="usuarios" name="Usuarios" stroke="#a62639" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="anuncios" name="Anuncios" stroke="#f5b929" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Anuncios por Estado" subtitle="Distribución actual de todas las publicaciones">
        {hasStatusData ? (
          <div className="flex items-center gap-4">
            <div className="h-40 w-40 shrink-0" role="img" aria-label="Gráfico de dona: distribución de anuncios por estado">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="count" nameKey="label" innerRadius={40} outerRadius={64} paddingAngle={2}>
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLOR[entry.status] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #e2e8f0" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1.5 text-xs flex-1">
              {statusData.map((entry) => (
                <li key={entry.status} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[entry.status] || "#94a3b8" }} />
                  <span className="text-slate-500 font-semibold">{entry.label}</span>
                  <span className="font-black text-slate-900 font-mono ml-auto">{entry.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-8 text-center">Todavía no hay anuncios publicados.</p>
        )}
      </ChartCard>
    </div>
  );
}
