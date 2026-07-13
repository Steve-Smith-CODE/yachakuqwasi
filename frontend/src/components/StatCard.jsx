import { ArrowUp, ArrowDown, Minus } from "lucide-react";

const TONE_CLASS = {
  slate: "text-slate-900",
  guindo: "text-guindo",
  emerald: "text-emerald-600",
  amber: "text-amber-600"
};

const TREND_META = {
  up: { Icon: ArrowUp, className: "text-emerald-600 bg-emerald-50" },
  down: { Icon: ArrowDown, className: "text-red-600 bg-red-50" },
  flat: { Icon: Minus, className: "text-slate-500 bg-slate-100" }
};

function TrendBadge({ trend }) {
  const meta = TREND_META[trend.direction] || TREND_META.flat;
  const { Icon } = meta;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${meta.className}`}>
      <Icon className="h-2.5 w-2.5" />
      {trend.pct}%
    </span>
  );
}

export default function StatCard({ icon: Icon, label, value, hint, trend, tone = "slate", className = "", children }) {
  return (
    <div className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-left flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-slate-300 shrink-0" />}
      </div>
      {children ?? (
        <>
          <div className="flex items-end justify-between gap-2 mt-1">
            <span className={`text-2xl font-black block font-mono ${TONE_CLASS[tone] || TONE_CLASS.slate}`}>{value}</span>
            {trend && <TrendBadge trend={trend} />}
          </div>
          {hint && <span className="text-[10px] text-slate-500 mt-0.5 block">{hint}</span>}
        </>
      )}
    </div>
  );
}
