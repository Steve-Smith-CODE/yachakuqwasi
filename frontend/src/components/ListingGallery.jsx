import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, X, Grid2x2, Camera } from "lucide-react";

const expoOut = [0.16, 1, 0.3, 1];

function GalleryLightbox({ images, title, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de fotos: ${title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.25 }}
      className="fixed inset-0 z-[70] bg-slate-950/97 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 text-white/90 shrink-0">
        <span className="text-xs font-bold font-mono tracking-wider">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar galería"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center px-2 md:px-16 min-h-0">
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => setIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
            aria-label="Foto anterior"
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={images[index]}
            alt={`${title} — foto ${index + 1} de ${images.length}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
            transition={{ duration: reduce ? 0.1 : 0.3, ease: expoOut }}
            className="max-h-[75vh] md:max-h-[80vh] max-w-full object-contain rounded-lg select-none"
          />
        </AnimatePresence>

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % images.length)}
            aria-label="Foto siguiente"
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="shrink-0 flex gap-2 overflow-x-auto px-4 py-4 md:justify-center scrollbar-none">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir a foto ${i + 1}`}
              className={`shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                i === index ? "border-dorado opacity-100" : "border-transparent opacity-45 hover:opacity-75"
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function ListingGallery({ images, title, badges }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const photos = images.length > 0 ? images : [];
  const hero = photos[0];
  const thumbs = photos.slice(1, 5);
  const extraCount = photos.length - 5;

  return (
    <div className="relative">
      {photos.length <= 1 ? (
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="w-full aspect-[16/9] md:aspect-[21/9] bg-slate-100 overflow-hidden block cursor-pointer group"
        >
          <img
            src={hero}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </button>
      ) : (
        <div className="grid grid-cols-4 grid-rows-2 gap-1 md:gap-1.5 h-[280px] md:h-[420px]">
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="col-span-4 row-span-2 sm:col-span-2 sm:row-span-2 relative overflow-hidden cursor-pointer group"
          >
            <img
              src={hero}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </button>

          {thumbs.map((src, i) => {
            const isLast = i === thumbs.length - 1 && extraCount > 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(i + 1)}
                className="hidden sm:block relative overflow-hidden cursor-pointer group"
              >
                <img
                  src={src}
                  alt={`${title} — foto ${i + 2}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                {isLast && (
                  <div className="absolute inset-0 bg-slate-950/55 flex items-center justify-center">
                    <span className="text-white text-xs font-black">+{extraCount} fotos</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="absolute top-3 left-3 flex gap-1.5 z-10 pointer-events-none">{badges}</div>

      {photos.length > 1 && (
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-sm text-slate-800 text-[11px] font-black px-3 py-2 rounded-xl shadow-md flex items-center gap-1.5 hover:bg-white transition-colors cursor-pointer"
        >
          <Grid2x2 className="h-3.5 w-3.5" />
          <span>Ver las {photos.length} fotos</span>
        </button>
      )}
      {photos.length === 1 && (
        <span className="absolute bottom-3 right-3 z-10 bg-white/90 backdrop-blur-sm text-slate-600 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1">
          <Camera className="h-3 w-3" />
          <span>1 foto</span>
        </span>
      )}

      <AnimatePresence>
        {lightboxIndex !== null && (
          <GalleryLightbox images={photos} title={title} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
