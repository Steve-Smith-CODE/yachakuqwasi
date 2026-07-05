import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import PublishPage from "./pages/PublishPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
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
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/explorar" replace />} />
      </Routes>
    </div>
  );
}
