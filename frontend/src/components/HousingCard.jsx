const TYPE_LABEL = { room: "Habitación", apartment: "Departamento", shared: "Compartido", family: "Familiar" };

export default function HousingCard({ listing }) {
  const image = listing.images?.[0];

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      <div className="h-36 bg-slate-100">
        {image ? (
          <img src={image} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold">
            Sin foto
          </div>
        )}
      </div>
      <div className="p-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wide text-guindo">
            {TYPE_LABEL[listing.type] || listing.type}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">{listing.neighborhood}</span>
        </div>
        <h3 className="font-extrabold text-slate-800 text-sm leading-snug">{listing.title}</h3>
        <p className="text-xs text-slate-500">A {listing.distance_to_unsch_minutes} min caminando de la UNSCH</p>
        <p className="text-sm font-black text-guindo">S/. {listing.price_pen} <span className="text-xs font-semibold text-slate-500">/ mes</span></p>
      </div>
    </div>
  );
}
