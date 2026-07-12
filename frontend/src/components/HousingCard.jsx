import { Heart, MapPin, Clock } from "lucide-react";
import { TYPE_LABEL, TYPE_ACCENT } from "../constants/content.js";
import { getPlaceholderImage } from "../constants/placeholderImages.js";
import PhoneContactPopover from "./PhoneContactPopover.jsx";
import makiMascot from "../assets/images/maki-mascota.webp";

export default function HousingCard({ listing, onOpen, isFavorite, onToggleFavorite }) {
  const image = listing.images?.[0] || getPlaceholderImage(listing.type, listing.id);
  const accent = TYPE_ACCENT[listing.type] || TYPE_ACCENT.room;
  const waNumber = (listing.contact_phone || "").replace(/\D/g, "");
  const waText = encodeURIComponent(
    `Hola, vengo del portal YachakuqWasi y estoy muy interesado en su alojamiento en ${listing.neighborhood} (${listing.address}). ¿Sigue disponible?`
  );

  return (
    <div
      onClick={() => onOpen(listing)}
      className="w-[290px] sm:w-[340px] shrink-0 bg-white rounded-2xl border border-guindo/12 hover:border-guindo shadow-[0_4px_18px_-6px_rgba(88,18,18,0.12)] hover:shadow-lg transition-all cursor-pointer snap-start overflow-hidden group flex flex-col justify-between"
    >
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        <img
          src={image}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {listing.verified_by_maki && (
            <span className="bg-dorado-dark text-slate-900 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider font-mono shadow-sm">
              Maki Verificado
            </span>
          )}
          <span className={`${accent.badge} text-white text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide w-fit shadow-sm`}>
            {TYPE_LABEL[listing.type] || listing.type}
          </span>
        </div>

        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(listing);
            }}
            className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow hover:scale-110 active:scale-90 transition-all z-10"
          >
            <Heart className={`h-4 w-4 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-slate-400 hover:text-red-500"}`} />
          </button>
        )}

        <div className="absolute bottom-2.5 left-2.5 bg-slate-900/70 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
          <MapPin className="h-3 w-3 text-dorado-dark" />
          <span>{listing.neighborhood}</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1 group-hover:text-guindo transition-colors">{listing.title}</h4>
          <div className="flex items-center gap-1.5 mt-1">
            <img
              src={listing.profiles?.avatar_url || makiMascot}
              alt={listing.profiles?.name || "Arrendador"}
              className="h-4 w-4 rounded-full object-cover ring-1 ring-white shadow-sm shrink-0"
            />
            <span className="text-[10px] text-slate-400 font-semibold truncate">{listing.profiles?.name || "Arrendador"}</span>
          </div>
          {listing.description && (
            <p className="text-slate-500 text-[11px] line-clamp-2 mt-1 leading-relaxed">{listing.description}</p>
          )}
        </div>

        {listing.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.amenities.slice(0, 3).map((a, i) => (
              <span key={i} className="bg-slate-50 border border-slate-100 text-slate-500 text-[9px] px-2 py-0.5 rounded font-semibold">
                {a}
              </span>
            ))}
            {listing.amenities.length > 3 && (
              <span className="text-slate-400 text-[9px] font-bold self-center px-1">+{listing.amenities.length - 3}</span>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-slate-500 font-medium text-[10px]">
            <Clock className="h-3 w-3 text-guindo" />
            <span>A {listing.distance_to_unsch_minutes} min caminando</span>
          </span>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">Costo mensual</span>
            <span className="text-sm font-black text-guindo font-mono">
              S/. {listing.price_pen} <span className="text-[10px] font-bold text-slate-400">PEN</span>
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
          <PhoneContactPopover phone={listing.contact_phone} size="sm" />
          <a
            href={`https://wa.me/51${waNumber}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer text-center"
          >
            <svg className="h-3.5 w-3.5 fill-white shrink-0" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
