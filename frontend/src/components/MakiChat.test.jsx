import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MakiChat from "./MakiChat.jsx";
import { sendMakiMessage } from "../api/maki.js";
import { ApiError } from "../api/client.js";

vi.mock("../api/maki.js", () => ({
  sendMakiMessage: vi.fn()
}));

beforeEach(() => {
  sendMakiMessage.mockReset();
});

describe("MakiChat", () => {
  it("no renderiza nada si open es false", () => {
    render(<MakiChat open={false} onClose={vi.fn()} />);
    expect(screen.queryByText("Maki, el Halcón Consejero")).not.toBeInTheDocument();
  });

  it("muestra el mensaje de bienvenida al abrir", () => {
    render(<MakiChat open onClose={vi.fn()} />);
    expect(screen.getByText(/Allillanchu, estimado estudiante/)).toBeInTheDocument();
  });

  it("el boton de enviar esta deshabilitado si el input esta vacio", () => {
    render(<MakiChat open onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText("Escribe tu pregunta sobre alquileres...");
    const sendButton = input.closest("form").querySelector("button[type='submit']");

    expect(sendButton).toBeDisabled();
    fireEvent.change(input, { target: { value: "Hola" } });
    expect(sendButton).not.toBeDisabled();
  });

  it("envia el mensaje, muestra el estado 'pensando' y luego la respuesta", async () => {
    let resolvePromise;
    sendMakiMessage.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );
    render(<MakiChat open onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText("Escribe tu pregunta sobre alquileres...");

    fireEvent.change(input, { target: { value: "¿Hay cuartos en Yanamilla?" } });
    fireEvent.submit(input.closest("form"));

    expect(screen.getByText("¿Hay cuartos en Yanamilla?")).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(await screen.findByText("Maki está pensando")).toBeInTheDocument();
    expect(sendMakiMessage).toHaveBeenCalledWith("¿Hay cuartos en Yanamilla?", expect.any(Array));

    resolvePromise({ text: "Sí, hay varias opciones cerca del campus." });

    expect(await screen.findByText("Sí, hay varias opciones cerca del campus.")).toBeInTheDocument();
    expect(screen.queryByText("Maki está pensando")).not.toBeInTheDocument();
  });

  it("muestra el mensaje de error de la API con el prefijo de advertencia", async () => {
    sendMakiMessage.mockRejectedValueOnce(new ApiError("Servicio de IA no disponible", 503));
    render(<MakiChat open onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText("Escribe tu pregunta sobre alquileres...");

    fireEvent.change(input, { target: { value: "Hola Maki" } });
    fireEvent.submit(input.closest("form"));

    expect(await screen.findByText(/Servicio de IA no disponible/)).toBeInTheDocument();
  });

  it("muestra un mensaje generico si el error no es un ApiError", async () => {
    sendMakiMessage.mockRejectedValueOnce(new Error("network down"));
    render(<MakiChat open onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText("Escribe tu pregunta sobre alquileres...");

    fireEvent.change(input, { target: { value: "Hola Maki" } });
    fireEvent.submit(input.closest("form"));

    expect(await screen.findByText(/no pude responder en este momento/i)).toBeInTheDocument();
  });

  it("el boton de cerrar y el overlay llaman a onClose", () => {
    const onClose = vi.fn();
    const { container } = render(<MakiChat open onClose={onClose} />);

    fireEvent.click(document.querySelector(".lucide-x").closest("button"));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector(".bg-slate-900\\/60"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
