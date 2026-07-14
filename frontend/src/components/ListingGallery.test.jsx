import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ListingGallery from "./ListingGallery.jsx";

const ONE_PHOTO = ["https://cdn.test/a.jpg"];
const MANY_PHOTOS = Array.from({ length: 6 }, (_, i) => `https://cdn.test/${i}.jpg`);

describe("ListingGallery", () => {
  it("con una sola foto muestra el indicador '1 foto' y no el boton de ver todas", () => {
    render(<ListingGallery images={ONE_PHOTO} title="Cuarto" badges={null} />);

    expect(screen.getByText("1 foto")).toBeInTheDocument();
    expect(screen.queryByText(/ver las/i)).not.toBeInTheDocument();
  });

  it("con varias fotos muestra el boton 'Ver las N fotos' y el contador de extras", () => {
    render(<ListingGallery images={MANY_PHOTOS} title="Cuarto" badges={null} />);

    expect(screen.getByText("Ver las 6 fotos")).toBeInTheDocument();
    expect(screen.getByText("+1 fotos")).toBeInTheDocument();
  });

  it("al hacer click en la foto principal abre el lightbox", () => {
    render(<ListingGallery images={MANY_PHOTOS} title="Cuarto" badges={null} />);

    fireEvent.click(screen.getByAltText("Cuarto"));

    expect(screen.getByRole("dialog", { name: /galería de fotos: cuarto/i })).toBeInTheDocument();
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
  });

  it("la flecha siguiente avanza la foto y el contador", () => {
    render(<ListingGallery images={MANY_PHOTOS} title="Cuarto" badges={null} />);
    fireEvent.click(screen.getByAltText("Cuarto"));

    fireEvent.click(screen.getByLabelText("Foto siguiente"));

    expect(screen.getByText("2 / 6")).toBeInTheDocument();
  });

  it("Escape cierra el lightbox", async () => {
    render(<ListingGallery images={MANY_PHOTOS} title="Cuarto" badges={null} />);
    fireEvent.click(screen.getByAltText("Cuarto"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("renderiza los badges recibidos", () => {
    render(<ListingGallery images={ONE_PHOTO} title="Cuarto" badges={<span>Maki Verificado</span>} />);
    expect(screen.getByText("Maki Verificado")).toBeInTheDocument();
  });
});
