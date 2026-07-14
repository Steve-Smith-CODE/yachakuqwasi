import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ListingActionsMenu from "./ListingActionsMenu.jsx";

function openMenu(listing, handlers = {}) {
  const onEdit = handlers.onEdit || vi.fn();
  const onTogglePause = handlers.onTogglePause || vi.fn();
  const onDelete = handlers.onDelete || vi.fn();
  render(<ListingActionsMenu listing={listing} onEdit={onEdit} onTogglePause={onTogglePause} onDelete={onDelete} />);
  fireEvent.click(screen.getByLabelText("Gestionar anuncio"));
  return { onEdit, onTogglePause, onDelete };
}

describe("ListingActionsMenu", () => {
  it("el menu esta cerrado por defecto", () => {
    render(<ListingActionsMenu listing={{}} onEdit={vi.fn()} onTogglePause={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText("Editar anuncio")).not.toBeInTheDocument();
  });

  it("Editar anuncio llama a onEdit y cierra el menu", () => {
    const { onEdit } = openMenu({});
    fireEvent.click(screen.getByText("Editar anuncio"));

    expect(onEdit).toHaveBeenCalled();
    expect(screen.queryByText("Editar anuncio")).not.toBeInTheDocument();
  });

  it("muestra Pausar anuncio si esta activo y llama a onTogglePause(true)", () => {
    const { onTogglePause } = openMenu({ paused_at: null });
    expect(screen.getByText("Pausar anuncio")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Pausar anuncio"));
    expect(onTogglePause).toHaveBeenCalledWith(true);
  });

  it("muestra Publicar anuncio si esta pausado y llama a onTogglePause(false)", () => {
    const { onTogglePause } = openMenu({ paused_at: "2026-01-01T00:00:00Z" });
    expect(screen.getByText("Publicar anuncio")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Publicar anuncio"));
    expect(onTogglePause).toHaveBeenCalledWith(false);
  });

  it("Eliminar anuncio pide el motivo antes de confirmar", () => {
    openMenu({});
    fireEvent.click(screen.getByText("Eliminar anuncio"));

    expect(screen.getByText("¿Por qué lo eliminas?")).toBeInTheDocument();
    expect(screen.getByText("Ya alquilé")).toBeInTheDocument();
  });

  it("elegir un motivo llama a onDelete con ese motivo y cierra el menu", () => {
    const { onDelete } = openMenu({});
    fireEvent.click(screen.getByText("Eliminar anuncio"));
    fireEvent.click(screen.getByText("Ya alquilé"));

    expect(onDelete).toHaveBeenCalledWith("rented");
    expect(screen.queryByText("¿Por qué lo eliminas?")).not.toBeInTheDocument();
  });

  it("Volver regresa al menu principal sin eliminar", () => {
    const { onDelete } = openMenu({});
    fireEvent.click(screen.getByText("Eliminar anuncio"));
    fireEvent.click(screen.getByText("Volver"));

    expect(screen.getByText("Editar anuncio")).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("Escape cierra el menu", () => {
    openMenu({});
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Editar anuncio")).not.toBeInTheDocument();
  });
});
