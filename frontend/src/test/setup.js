import "@testing-library/jest-dom/vitest";

// jsdom no implementa scrollIntoView; varios componentes (chat, listas) lo
// llaman para autoscroll y sin este stub el test truena con TypeError.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom no implementa reproduccion real de <video>/<audio>; ExplorePage
// pausa/reproduce el video del hero segun el scroll.
if (window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};
}

// jsdom no implementa matchMedia; se usa para prefers-reduced-motion en
// varias paginas/animaciones, algunas evaluadas a nivel de modulo.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  });
}

// jsdom no implementa IntersectionObserver; lo usa framer-motion para
// whileInView en secciones que aparecen al hacer scroll.
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}

// jsdom no implementa ResizeObserver; recharts lo usa (via ResponsiveContainer)
// para medir el contenedor del grafico antes de renderizar.
if (!window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
