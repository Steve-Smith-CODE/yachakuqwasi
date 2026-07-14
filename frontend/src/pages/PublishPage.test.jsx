import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PublishPage from "./PublishPage.jsx";
import { createHousingRequest, uploadHousingImagesRequest } from "../api/housings.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiError } from "../api/client.js";

vi.mock("../api/housings.js", () => ({
  createHousingRequest: vi.fn(),
  uploadHousingImagesRequest: vi.fn()
}));

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText("Ej. Cuarto Amoblado a espaldas de la UNSCH"), {
    target: { value: "Cuarto cerca al campus" }
  });
  fireEvent.change(screen.getByPlaceholderText("Ej. Jr. Tres Máscaras 142"), { target: { value: "Jr. Los Álamos 123" } });
  fireEvent.change(screen.getByPlaceholderText("Ej. +51 987 654 321"), { target: { value: "966123456" } });
}

beforeEach(() => {
  useAuth.mockReturnValue({ token: "tok" });
  createHousingRequest.mockReset();
  uploadHousingImagesRequest.mockReset();
  mockNavigate.mockClear();
  if (!URL.createObjectURL) URL.createObjectURL = vi.fn();
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-preview");
});

describe("PublishPage", () => {
  it("publica sin fotos y muestra la pantalla de exito con id y estado", async () => {
    createHousingRequest.mockResolvedValueOnce({ id: "h1", status: "pending" });
    render(<PublishPage />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Publicar Ahora"));

    expect(await screen.findByText(/ha sido registrada con éxito/)).toBeInTheDocument();
    expect(screen.getByText("h1")).toBeInTheDocument();
    expect(createHousingRequest).toHaveBeenCalledWith(
      "tok",
      expect.objectContaining({ title: "Cuarto cerca al campus", address: "Jr. Los Álamos 123", contactPhone: "966123456" })
    );
    expect(uploadHousingImagesRequest).not.toHaveBeenCalled();
  });

  it("con fotos seleccionadas: las sube tras crear el listing", async () => {
    createHousingRequest.mockResolvedValueOnce({ id: "h1", status: "pending" });
    uploadHousingImagesRequest.mockResolvedValueOnce({ id: "h1", status: "pending", images: ["data:image/png;base64,xx"] });
    render(<PublishPage />);
    fillRequiredFields();

    const file = new File(["foto"], "foto.png", { type: "image/png" });
    const fileInput = document.getElementById("publish-photo-input");
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText("Fotos de la Habitación (1/8)")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Publicar Ahora"));

    await waitFor(() => expect(uploadHousingImagesRequest).toHaveBeenCalledWith("tok", "h1", [expect.any(String)]));
    expect(await screen.findByText(/ha sido registrada con éxito/)).toBeInTheDocument();
  });

  it("permite quitar una foto antes de publicar", () => {
    render(<PublishPage />);
    const file = new File(["foto"], "foto.png", { type: "image/png" });
    const fileInput = document.getElementById("publish-photo-input");
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(screen.getByText("Fotos de la Habitación (1/8)")).toBeInTheDocument();

    fireEvent.click(screen.getByText("×"));

    expect(screen.getByText("Fotos de la Habitación (0/8)")).toBeInTheDocument();
  });

  it("permite agregar y quitar un servicio (amenity)", () => {
    render(<PublishPage />);
    const input = screen.getByPlaceholderText("Ej. Wi-Fi de fibra, Baño privado");

    fireEvent.change(input, { target: { value: "WiFi" } });
    fireEvent.click(screen.getByText("Agregar"));

    expect(screen.getByText("WiFi")).toBeInTheDocument();
  });

  it("muestra el error si falla la publicacion", async () => {
    createHousingRequest.mockRejectedValueOnce(new ApiError("Datos invalidos", 400));
    render(<PublishPage />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Publicar Ahora"));

    expect(await screen.findByText("Datos invalidos")).toBeInTheDocument();
  });

  it("Ir a mi panel navega a /portal tras publicar", async () => {
    createHousingRequest.mockResolvedValueOnce({ id: "h1", status: "pending" });
    render(<PublishPage />);
    fillRequiredFields();
    fireEvent.click(screen.getByText("Publicar Ahora"));
    await screen.findByText(/ha sido registrada con éxito/);

    fireEvent.click(screen.getByText("Ir a mi panel"));

    expect(mockNavigate).toHaveBeenCalledWith("/portal");
  });

  it("Publicar otra habitacion reinicia el formulario", async () => {
    createHousingRequest.mockResolvedValueOnce({ id: "h1", status: "pending" });
    render(<PublishPage />);
    fillRequiredFields();
    fireEvent.click(screen.getByText("Publicar Ahora"));
    await screen.findByText(/ha sido registrada con éxito/);

    fireEvent.click(screen.getByText("Publicar otra habitación"));

    expect(screen.getByPlaceholderText("Ej. Cuarto Amoblado a espaldas de la UNSCH")).toHaveValue("");
  });

  it("Cancelar navega a /portal sin publicar", () => {
    render(<PublishPage />);

    fireEvent.click(screen.getByText("Cancelar"));

    expect(mockNavigate).toHaveBeenCalledWith("/portal");
    expect(createHousingRequest).not.toHaveBeenCalled();
  });
});
