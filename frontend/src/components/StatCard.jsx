const TONE_CLASS = {
  slate: "text-slate-900",
  guindo: "text-guindo",
  emerald: "text-emerald-600",
  amber: "text-amber-600"
};

export default function StatCard({ icon: Icon, label, value, hint, tone = "slate", className = "", children }) {
  return (
    <div className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-left flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-slate-300 shrink-0" />}
      </div>
      {children ?? (
        <>
          <span className={`text-2xl font-black mt-1 block font-mono ${TONE_CLASS[tone] || TONE_CLASS.slate}`}>{value}</span>
          {hint && <span className="text-[10px] text-slate-500 mt-0.5 block">{hint}</span>}
        </>
      )}
    </div>
  );
}
