import {
  Wifi,
  ChefHat,
  ShowerHead,
  BedDouble,
  ShieldCheck,
  Car,
  Tv,
  Mountain,
  WashingMachine,
  Briefcase,
  Refrigerator,
  Microwave,
  KeyRound,
  Coffee,
  Sparkles,
  Wind,
  Check
} from "lucide-react";

// Clasifica un texto libre de amenity ("Cocina", "Cámaras de seguridad"...)
// en un icono + color vivo por categoria. Clases completas (no compuestas
// en runtime) para que Tailwind las detecte al escanear el codigo.
const RULES = [
  { test: /wifi|internet/i, Icon: Wifi, classes: "bg-sky-50 text-sky-600" },
  { test: /cocina/i, Icon: ChefHat, classes: "bg-orange-50 text-orange-600" },
  { test: /refrigerad/i, Icon: Refrigerator, classes: "bg-cyan-50 text-cyan-600" },
  { test: /microondas/i, Icon: Microwave, classes: "bg-orange-50 text-orange-600" },
  { test: /baño|ducha|agua caliente/i, Icon: ShowerHead, classes: "bg-cyan-50 text-cyan-600" },
  { test: /cama|habitaci[oó]n/i, Icon: BedDouble, classes: "bg-violet-50 text-violet-600" },
  { test: /c[aá]mara|seguridad/i, Icon: ShieldCheck, classes: "bg-rose-50 text-rose-600" },
  { test: /garaje|estacionamiento|auto|moto/i, Icon: Car, classes: "bg-indigo-50 text-indigo-600" },
  { test: /tv|televis/i, Icon: Tv, classes: "bg-pink-50 text-pink-600" },
  { test: /terraza|balc[oó]n|vista|panor[aá]mica/i, Icon: Mountain, classes: "bg-teal-50 text-teal-600" },
  { test: /lavador/i, Icon: WashingMachine, classes: "bg-blue-50 text-blue-600" },
  { test: /zona de trabajo/i, Icon: Briefcase, classes: "bg-amber-50 text-amber-600" },
  { test: /cafetera/i, Icon: Coffee, classes: "bg-amber-50 text-amber-700" },
  { test: /llegada aut[oó]noma|caja de seguridad|autom[aá]tica/i, Icon: KeyRound, classes: "bg-emerald-50 text-emerald-600" },
  { test: /jacuzzi|hbo|premium/i, Icon: Sparkles, classes: "bg-fuchsia-50 text-fuchsia-600" },
  { test: /secadora/i, Icon: Wind, classes: "bg-sky-50 text-sky-600" }
];

const DEFAULT_VISUAL = { Icon: Check, classes: "bg-guindo/8 text-guindo" };

export function getAmenityVisual(text) {
  const rule = RULES.find((r) => r.test.test(text));
  return rule ? { Icon: rule.Icon, classes: rule.classes } : DEFAULT_VISUAL;
}
