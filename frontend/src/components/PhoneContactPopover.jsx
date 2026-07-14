import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Phone, Copy, Check } from "lucide-react";

const SIZE = {
  sm: { chip: "text-[11px] py-2 px-2.5 gap-1.5", icon: "h-3 w-3", copyBtn: "p-1.5" },
  md: { chip: "text-xs py-2.5 px-3 gap-2", icon: "h-3.5 w-3.5", copyBtn: "p-2" }
};

// El numero se muestra directo (no hay un boton "Llamar" que abra un popover):
// un tel: no hace nada visible en desktop, asi que esconder el numero detras
// de un clic solo generaba la sensacion de un boton roto.
export default function PhoneContactPopover({ phone, size = "sm", className = "" }) {
  const [copied, setCopied] = useState(false);
  const s = SIZE[size];

  async function handleCopy(e) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op: navegadores sin permiso de portapapeles caen de vuelta a "seleccionar y copiar" manual
    }
  }

  return (
    <div
      className={`relative flex-1 flex items-center justify-between bg-guindo/5 border border-guindo/20 text-guindo rounded-xl ${s.chip} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <a href={`tel:${phone}`} className="flex items-center gap-1.5 min-w-0 flex-1">
        <Phone className={`${s.icon} shrink-0`} />
        <span className="font-mono font-black tracking-wide tabular-nums truncate">{phone}</span>
      </a>

      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copiar número"
        className={`shrink-0 rounded-lg text-guindo hover:bg-guindo/10 transition-all cursor-pointer active:scale-90 ${s.copyBtn}`}
      >
        {copied ? <Check className={`${s.icon} text-emerald-600`} /> : <Copy className={s.icon} />}
      </button>

      <AnimatePresence>
        {copied && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-7 right-0 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg"
          >
            Copiado
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
