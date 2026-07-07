import { useState } from "react";
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

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#334155] font-sans selection:bg-guindo selection:text-white">
      <NavBar onOpenMaki={() => setIsChatOpen(true)} />
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
