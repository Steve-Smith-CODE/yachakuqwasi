import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ roles, children }) {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) openAuthModal("login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/explorar" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/explorar" replace />;

  return children;
}
