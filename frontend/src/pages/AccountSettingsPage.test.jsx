import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccountSettingsPage from "./AccountSettingsPage.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  updateProfileRequest,
  updatePasswordRequest,
  uploadAvatarRequest,
  updateInstitutionalEmailRequest
} from "../api/profile.js";
import { ApiError } from "../api/client.js";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

vi.mock("../api/profile.js", () => ({
  updateProfileRequest: vi.fn(),
  updatePasswordRequest: vi.fn(),
  uploadAvatarRequest: vi.fn(),
  updateInstitutionalEmailRequest: vi.fn()
}));

const STUDENT = { name: "Ana Torres", role: "student", phone: "966123456", faculty: "Ingeniería y Ciencias", career: "" };

function setAuth(userOverrides = {}, updateUser = vi.fn()) {
  useAuth.mockReturnValue({ user: { ...STUDENT, ...userOverrides }, token: "tok", updateUser });
  return updateUser;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AccountSettingsPage", () => {
  it("cambiar la foto llama a uploadAvatarRequest y actualiza el usuario", async () => {
    const updateUser = setAuth();
    uploadAvatarRequest.mockResolvedValueOnce({ profile: { avatar_url: "https://cdn.test/nueva.jpg" } });
    render(<AccountSettingsPage />);

    const file = new File(["foto"], "foto.png", { type: "image/png" });
    const input = document.querySelector("input[type='file']");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(uploadAvatarRequest).toHaveBeenCalledWith("tok", expect.any(String)));
    expect(updateUser).toHaveBeenCalledWith({ avatar_url: "https://cdn.test/nueva.jpg" });
  });

  it("muestra el error si falla la subida de la foto", async () => {
    setAuth();
    uploadAvatarRequest.mockRejectedValueOnce(new ApiError("Formato no soportado", 400));
    render(<AccountSettingsPage />);

    const file = new File(["foto"], "foto.gif", { type: "image/gif" });
    fireEvent.change(document.querySelector("input[type='file']"), { target: { files: [file] } });

    expect(await screen.findByText("Formato no soportado")).toBeInTheDocument();
  });

  it("estudiante: guardar datos personales incluye facultad y carrera", async () => {
    const updateUser = setAuth();
    updateProfileRequest.mockResolvedValueOnce({ profile: { name: "Ana Torres Actualizada" } });
    render(<AccountSettingsPage />);

    fireEvent.change(screen.getByDisplayValue("Ana Torres"), { target: { value: "Ana Torres Actualizada" } });
    fireEvent.click(screen.getByText("Guardar Cambios"));

    await waitFor(() =>
      expect(updateProfileRequest).toHaveBeenCalledWith(
        "tok",
        expect.objectContaining({ name: "Ana Torres Actualizada", faculty: "Ingeniería y Ciencias" })
      )
    );
    expect(updateUser).toHaveBeenCalledWith({ name: "Ana Torres Actualizada" });
    expect(await screen.findByText("Datos actualizados correctamente.")).toBeInTheDocument();
  });

  it("arrendador: guardar datos personales no incluye facultad ni carrera", async () => {
    setAuth({ role: "landlord", faculty: undefined, career: undefined });
    updateProfileRequest.mockResolvedValueOnce({ profile: { name: "Luis Landlord" } });
    render(<AccountSettingsPage />);

    fireEvent.click(screen.getByText("Guardar Cambios"));

    await waitFor(() => expect(updateProfileRequest).toHaveBeenCalled());
    const payload = updateProfileRequest.mock.calls[0][1];
    expect(payload).not.toHaveProperty("faculty");
    expect(payload).not.toHaveProperty("career");
  });

  it("muestra el error si falla el guardado del perfil", async () => {
    setAuth();
    updateProfileRequest.mockRejectedValueOnce(new ApiError("Nombre invalido", 400));
    render(<AccountSettingsPage />);

    fireEvent.click(screen.getByText("Guardar Cambios"));

    expect(await screen.findByText("Nombre invalido")).toBeInTheDocument();
  });

  it("guardar el correo institucional llama al endpoint y muestra exito", async () => {
    const updateUser = setAuth();
    updateInstitutionalEmailRequest.mockResolvedValueOnce({ profile: { institutional_email: "ana@unsch.edu.pe" } });
    render(<AccountSettingsPage />);

    fireEvent.change(screen.getByPlaceholderText("tunombre@unsch.edu.pe"), { target: { value: "ana@unsch.edu.pe" } });
    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => expect(updateInstitutionalEmailRequest).toHaveBeenCalledWith("tok", "ana@unsch.edu.pe"));
    expect(updateUser).toHaveBeenCalledWith({ institutional_email: "ana@unsch.edu.pe" });
    expect(await screen.findByText("Correo institucional guardado.")).toBeInTheDocument();
  });

  it("valida que la nueva contraseña tenga al menos 6 caracteres", async () => {
    setAuth();
    render(<AccountSettingsPage />);

    const [newPass, confirmPass] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(newPass, { target: { value: "123" } });
    fireEvent.change(confirmPass, { target: { value: "123" } });
    fireEvent.click(screen.getByText("Actualizar Contraseña"));

    expect(await screen.findByText(/al menos 6 caracteres/)).toBeInTheDocument();
    expect(updatePasswordRequest).not.toHaveBeenCalled();
  });

  it("valida que las contraseñas coincidan", async () => {
    setAuth();
    render(<AccountSettingsPage />);

    const [newPass, confirmPass] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(newPass, { target: { value: "secreta123" } });
    fireEvent.change(confirmPass, { target: { value: "otraClave1" } });
    fireEvent.click(screen.getByText("Actualizar Contraseña"));

    expect(await screen.findByText(/no coinciden/)).toBeInTheDocument();
    expect(updatePasswordRequest).not.toHaveBeenCalled();
  });

  it("cambia la contraseña correctamente y limpia los campos", async () => {
    setAuth();
    updatePasswordRequest.mockResolvedValueOnce({});
    render(<AccountSettingsPage />);

    const [newPass, confirmPass] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(newPass, { target: { value: "secreta123" } });
    fireEvent.change(confirmPass, { target: { value: "secreta123" } });
    fireEvent.click(screen.getByText("Actualizar Contraseña"));

    await waitFor(() => expect(updatePasswordRequest).toHaveBeenCalledWith("tok", "secreta123"));
    expect(await screen.findByText("Contraseña actualizada correctamente.")).toBeInTheDocument();
    expect(newPass).toHaveValue("");
  });

  it("muestra el error si falla el cambio de contraseña", async () => {
    setAuth();
    updatePasswordRequest.mockRejectedValueOnce(new ApiError("Sesion expirada", 401));
    render(<AccountSettingsPage />);

    const [newPass, confirmPass] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(newPass, { target: { value: "secreta123" } });
    fireEvent.change(confirmPass, { target: { value: "secreta123" } });
    fireEvent.click(screen.getByText("Actualizar Contraseña"));

    expect(await screen.findByText("Sesion expirada")).toBeInTheDocument();
  });
});
