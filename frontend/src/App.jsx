import { lazy, Suspense, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2 } from "lucide-react";
import NavBar from "./components/NavBar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import MakiChat from "./components/MakiChat.jsx";
import AuthModal from "./components/AuthModal.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import heroTheme from "./assets/audio/hero-theme.mp3";

// Solo la pagina de explorar (la mas visitada) va en el bundle principal.
// El resto de rutas se cargan bajo demanda para no cargarle a un estudiante
// que solo navega el explorador el peso de paneles que quiza nunca visite.
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const ListingDetailPage = lazy(() => import("./pages/ListingDetailPage.jsx"));
const PublishPage = lazy(() => import("./pages/PublishPage.jsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const AccountSettingsPage = lazy(() => import("./pages/AccountSettingsPage.jsx"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.jsx"));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-6 w-6 text-guindo animate-spin" />
    </div>
  );
}

function OverlayFallback() {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-white animate-spin" />
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] } }
};

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef(null);
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  // Patron de "modal route": si llegamos aca via click (con backgroundLocation
  // en el state), las Routes de abajo siguen mostrando esa pantalla de fondo
  // y la ruta /habitacion/:id se dibuja aparte, encima, como overlay. Si se
  // entra directo (link compartido, F5), no hay backgroundLocation y
  // /habitacion/:id se resuelve como pantalla normal dentro de las mismas Routes.
  const backgroundLocation = location.state?.backgroundLocation;

  function toggleSound() {
    const audio = audioRef.current;
    if (!audio) return;
    if (soundOn) {
      audio.pause();
      setSoundOn(false);
    } else {
      audio.volume = 1;
      audio.play().catch(() => {});
      setSoundOn(true);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-plomo-dark font-sans selection:bg-guindo selection:text-white">
      <audio ref={audioRef} src={heroTheme} loop preload="none" />
      <NavBar onOpenMaki={() => setIsChatOpen(true)} soundOn={soundOn} onToggleSound={toggleSound} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={(backgroundLocation || location).pathname}
          initial={reduceMotion ? undefined : "initial"}
          animate="animate"
          exit={reduceMotion ? undefined : "exit"}
          variants={pageVariants}
        >
          <Suspense fallback={<RouteFallback />}>
            <Routes location={backgroundLocation || location}>
              <Route path="/" element={<Navigate to="/explorar" replace />} />
              <Route path="/explorar" element={<ExplorePage />} />
              <Route path="/habitacion/:id" element={<ListingDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/restablecer-password" element={<ResetPasswordPage />} />
              <Route
                path="/publicar"
                element={
                  <ProtectedRoute roles={["landlord", "admin"]}>
                    <PublishPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portal"
                element={
                  <ProtectedRoute roles={["student", "landlord"]}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cuenta"
                element={
                  <ProtectedRoute>
                    <AccountSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/explorar" replace />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {backgroundLocation && (
        <Suspense fallback={<OverlayFallback />}>
          <Routes>
            <Route path="/habitacion/:id" element={<ListingDetailPage />} />
          </Routes>
        </Suspense>
      )}

      <MakiChat open={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <AuthModal />
    </div>
  );
}
