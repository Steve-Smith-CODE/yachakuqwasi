import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuthModal from "./AuthModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { forgotPasswordRequest } from "../api/auth.js";
import { ApiError } from "../api/client.js";
import { FACULTIES, UNSCH_ACADEMIC_MAP } from "../constants/content.js";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

vi.mock("../api/auth.js", () => ({
  forgotPasswordRequest: vi.fn()
}));

function setupAuth({ mode = "login", login = vi.fn(), register = vi.fn(), closeAuthModal = vi.fn() } = {}) {
  const value = { authModal: { open: true, mode }, closeAuthModal, login, register };
  useAuth.mockReturnValue(value);
  return value;
}

beforeEach(() => {
  useAuth.mockReset();
  forgotPasswordRequest.mockReset();
});

describe("AuthModal", () => {
  it("no renderiza nada si el modal esta cerrado", () => {
    useAuth.mockReturnValue({ authModal: { open: false, mode: "login" }, closeAuthModal: vi.fn(), login: vi.fn(), register: vi.fn() });

    render(<AuthModal />);

    expect(screen.queryByText("Iniciar Sesión con Maki")).not.toBeInTheDocument();
  });

  it("hace login con el email y password ingresados y cierra el modal", async () => {
    const login = vi.fn().mockResolvedValueOnce({});
    const closeAuthModal = vi.fn();
    setupAuth({ mode: "login", login, closeAuthModal });

    render(<AuthModal />);
    fireEvent.change(screen.getByPlaceholderText("ejemplo@unsch.edu.pe"), { target: { value: "ana@unsch.edu.pe" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "secreta123" } });
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith("ana@unsch.edu.pe", "secreta123"));
    await waitFor(() => expect(closeAuthModal).toHaveBeenCalled());
  });

  it("muestra el mensaje de error si el login falla y no cierra el modal", async () => {
    const login = vi.fn().mockRejectedValueOnce(new ApiError("Credenciales invalidas", 401));
    const closeAuthModal = vi.fn();
    setupAuth({ mode: "login", login, closeAuthModal });

    render(<AuthModal />);
    fireEvent.change(screen.getByPlaceholderText("ejemplo@unsch.edu.pe"), { target: { value: "ana@unsch.edu.pe" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "mala" } });
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(await screen.findByText(/credenciales invalidas/i)).toBeInTheDocument();
    expect(closeAuthModal).not.toHaveBeenCalled();
  });

  it("registra un estudiante con facultad y carrera por defecto", async () => {
    const register = vi.fn().mockResolvedValueOnce({ id: "nuevo" });
    setupAuth({ mode: "signup", register });

    render(<AuthModal />);
    fireEvent.change(screen.getByPlaceholderText("Ej. Juan Pérez Quispe"), { target: { value: "Ana Torres" } });
    fireEvent.change(screen.getByPlaceholderText("ejemplo@unsch.edu.pe"), { target: { value: "ana@unsch.edu.pe" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "secreta123" } });
    fireEvent.click(screen.getByRole("button", { name: /registrar datos/i }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        email: "ana@unsch.edu.pe",
        password: "secreta123",
        name: "Ana Torres",
        role: "student",
        faculty: FACULTIES[0],
        career: UNSCH_ACADEMIC_MAP[FACULTIES[0]][0],
        phone: ""
      })
    );
    expect(await screen.findByText(/cuenta creada/i)).toBeInTheDocument();
  });

  it("registra un arrendador sin facultad ni carrera", async () => {
    const register = vi.fn().mockResolvedValueOnce({ id: "nuevo" });
    setupAuth({ mode: "signup", register });

    render(<AuthModal />);
    fireEvent.change(screen.getByPlaceholderText("Ej. Juan Pérez Quispe"), { target: { value: "Luis Landlord" } });
    fireEvent.change(screen.getByPlaceholderText("ejemplo@unsch.edu.pe"), { target: { value: "luis@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "secreta123" } });
    fireEvent.change(screen.getByDisplayValue("Estudiante"), { target: { value: "landlord" } });
    fireEvent.click(screen.getByRole("button", { name: /registrar datos/i }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({ role: "landlord", faculty: undefined, career: undefined })
      )
    );
  });

  it("envia el enlace de recuperacion desde el modo forgot", async () => {
    forgotPasswordRequest.mockResolvedValueOnce({ message: "Si el correo esta registrado, te enviamos un enlace." });
    setupAuth({ mode: "login" });

    render(<AuthModal />);
    fireEvent.click(screen.getByRole("button", { name: /olvidaste tu contraseña/i }));
    fireEvent.change(screen.getByPlaceholderText("ejemplo@unsch.edu.pe"), { target: { value: "ana@unsch.edu.pe" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar enlace/i }));

    await waitFor(() => expect(forgotPasswordRequest).toHaveBeenCalledWith("ana@unsch.edu.pe"));
    expect(await screen.findByText(/si el correo esta registrado/i)).toBeInTheDocument();
  });
});
