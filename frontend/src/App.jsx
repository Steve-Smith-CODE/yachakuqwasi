import { useRef, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import MakiChat from "./components/MakiChat.jsx";
import AuthModal from "./components/AuthModal.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import PublishPage from "./pages/PublishPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AccountSettingsPage from "./pages/AccountSettingsPage.jsx";
import heroTheme from "./assets/audio/hero-theme.mp3";

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef(null);

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
    <div className="min-h-screen bg-[#F8F9FA] text-[#334155] font-sans selection:bg-guindo selection:text-white">
      <audio ref={audioRef} src={heroTheme} loop preload="none" />
      <NavBar onOpenMaki={() => setIsChatOpen(true)} soundOn={soundOn} onToggleSound={toggleSound} />
      <Routes>
        <Route path="/" element={<Navigate to="/explorar" replace />} />
        <Route path="/explorar" element={<ExplorePage />} />
        <Route path="/login" element={<LoginPage />} />
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
      <MakiChat open={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <AuthModal />
    </div>
  );
}
