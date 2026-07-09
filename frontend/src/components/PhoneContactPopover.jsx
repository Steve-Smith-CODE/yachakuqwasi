import { useEffect, useRef, useState } from "react";
import { Phone, Copy, Check } from "lucide-react";

const SIZE = {
  sm: {
    trigger: "text-[11px] py-2 px-2.5 gap-1.5",
    icon: "h-3 w-3",
    panel: "w-[210px] p-3",
    number: "text-sm",
    action: "text-[10px] py-1.5"
  },
  md: {
    trigger: "text-xs py-2.5 gap-1.5",
    icon: "h-3.5 w-3.5",
    panel: "w-[230px] p-3.5",
    number: "text-base",
    action: "text-[11px] py-2"
  }
};

// Popover de "Llamar": en desktop un `tel:` no hace nada visible, asi que en
// vez de solo abrir el marcador, mostramos el numero para copiarlo. En movil
// "Llamar" abre el marcador igual.
export default function PhoneContactPopover({ phone, size = "sm", className = "" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const s = SIZE[size];

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op: navegadores sin permiso de portapapeles caen de vuelta a "seleccionar y copiar" manual
    }
  }

  return (
    <div ref={ref} className={`relative flex-1 ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full bg-guindo hover:bg-guindo-dark text-white font-black rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer text-center ${s.trigger}`}
      >
        <Phone className={`${s.icon} text-dorado shrink-0`} />
        <span>Llamar</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Número de contacto"
          className={`absolute z-30 top-[calc(100%+8px)] left-0 bg-white border border-slate-200 rounded-2xl shadow-xl ${s.panel}`}
        >
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Número de contacto
          </span>
          <p className={`font-mono font-black text-slate-900 tracking-wide tabular-nums select-all mb-2.5 ${s.number}`}>
            {phone}
          </p>

          <div className="flex gap-1.5">
            <a
              href={`tel:${phone}`}
              onClick={() => setOpen(false)}
              className={`flex-1 bg-guindo hover:bg-guindo-dark text-white font-black rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${s.action}`}
            >
              <Phone className="h-3 w-3 text-dorado" />
              <span>Llamar</span>
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${s.action}`}
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? "Copiado" : "Copiar"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
