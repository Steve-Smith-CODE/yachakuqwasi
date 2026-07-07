import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// El login real ahora vive en <AuthModal /> (montado globalmente en App.jsx).
// Esta ruta solo existe para no romper enlaces/bookmarks antiguos a /login.
export default function LoginPage() {
  const { openAuthModal } = useAuth();

  useEffect(() => {
    openAuthModal("login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Navigate to="/explorar" replace />;
}
