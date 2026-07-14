import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResetPasswordPage from "./ResetPasswordPage.jsx";
import { supabase } from "../api/supabaseClient.js";
import { useAuth } from "../context/AuthContext.jsx";

vi.mock("../api/supabaseClient.js", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn().mockResolvedValue({})
    }
  }
}));

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  mockNavigate.mockClear();
  useAuth.mockReturnValue({ openAuthModal: vi.fn() });
  supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  supabase.auth.updateUser.mockReset();
  supabase.auth.signOut.mockReset().mockResolvedValue({});
});

describe("ResetPasswordPage", () => {
  it("muestra el link invalido si no hay sesion de recuperacion", async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });
    render(<ResetPasswordPage />);

    expect(await screen.findByText(/ya no es válido o expiró/)).toBeInTheDocument();
  });

  it("volver a YachakuqWasi navega a /explorar", async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });
    render(<ResetPasswordPage />);

    fireEvent.click(await screen.findByText("Volver a YachakuqWasi"));

    expect(mockNavigate).toHaveBeenCalledWith("/explorar", { replace: true });
  });

  it("con sesion de recuperacion valida, muestra el formulario", async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { access_token: "x" } } });
    render(<ResetPasswordPage />);

    expect(await screen.findByText("Guardar Contraseña")).toBeInTheDocument();
  });

  it("valida que la contraseña tenga al menos 6 caracteres", async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { access_token: "x" } } });
    render(<ResetPasswordPage />);
    await screen.findByText("Guardar Contraseña");

    const [password, confirm] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(password, { target: { value: "123" } });
    fireEvent.change(confirm, { target: { value: "123" } });
    fireEvent.click(screen.getByText("Guardar Contraseña"));

    expect(await screen.findByText(/al menos 6 caracteres/)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("valida que ambas contraseñas coincidan", async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { access_token: "x" } } });
    render(<ResetPasswordPage />);
    await screen.findByText("Guardar Contraseña");

    const [password, confirm] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(password, { target: { value: "secreta123" } });
    fireEvent.change(confirm, { target: { value: "otraClave1" } });
    fireEvent.click(screen.getByText("Guardar Contraseña"));

    expect(await screen.findByText(/no coinciden/)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("guarda la contraseña, cierra la sesion de recuperacion y muestra el estado done", async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { access_token: "x" } } });
    supabase.auth.updateUser.mockResolvedValueOnce({ error: null });
    render(<ResetPasswordPage />);
    await screen.findByText("Guardar Contraseña");

    const [password, confirm] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(password, { target: { value: "secreta123" } });
    fireEvent.change(confirm, { target: { value: "secreta123" } });
    fireEvent.click(screen.getByText("Guardar Contraseña"));

    expect(await screen.findByText(/se actualizó correctamente/)).toBeInTheDocument();
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "secreta123" });
    await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalled());
  });

  it("muestra el error si Supabase falla al actualizar la contraseña", async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { access_token: "x" } } });
    supabase.auth.updateUser.mockResolvedValueOnce({ error: { message: "Token expirado" } });
    render(<ResetPasswordPage />);
    await screen.findByText("Guardar Contraseña");

    const [password, confirm] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(password, { target: { value: "secreta123" } });
    fireEvent.change(confirm, { target: { value: "secreta123" } });
    fireEvent.click(screen.getByText("Guardar Contraseña"));

    expect(await screen.findByText(/token expirado/i)).toBeInTheDocument();
  });

  it("iniciar sesion desde el estado done navega y abre el modal de login", async () => {
    const openAuthModal = vi.fn();
    useAuth.mockReturnValue({ openAuthModal });
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { access_token: "x" } } });
    supabase.auth.updateUser.mockResolvedValueOnce({ error: null });
    render(<ResetPasswordPage />);
    await screen.findByText("Guardar Contraseña");

    const [password, confirm] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(password, { target: { value: "secreta123" } });
    fireEvent.change(confirm, { target: { value: "secreta123" } });
    fireEvent.click(screen.getByText("Guardar Contraseña"));
    fireEvent.click(await screen.findByText("Iniciar sesión"));

    expect(mockNavigate).toHaveBeenCalledWith("/explorar", { replace: true });
    expect(openAuthModal).toHaveBeenCalledWith("login");
  });
});
