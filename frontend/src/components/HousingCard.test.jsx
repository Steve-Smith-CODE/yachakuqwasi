import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HousingCard from "./HousingCard.jsx";

const BASE_LISTING = {
  id: "h1",
  title: "Cuarto amoblado cerca a la UNSCH",
  type: "room",
  neighborhood: "Yanamilla",
  address: "Jr. Los Álamos 123",
  description: "Cuarto amplio con baño propio",
  distance_to_unsch_minutes: 8,
  price_pen: 350,
  contact_phone: "966123456",
  images: ["https://cdn.test/foto.jpg"],
  amenities: [],
  verified_by_maki: false,
  profiles: { name: "Rosa Landlord", avatar_url: null }
};

function renderCard(overrides = {}, props = {}) {
  const listing = { ...BASE_LISTING, ...overrides };
  return render(<HousingCard listing={listing} onOpen={vi.fn()} {...props} />);
}

describe("HousingCard", () => {
  it("muestra titulo, barrio, precio y distancia", () => {
    renderCard();

    expect(screen.getByText("Cuarto amoblado cerca a la UNSCH")).toBeInTheDocument();
    expect(screen.getByText("Yanamilla")).toBeInTheDocument();
    expect(screen.getByText(/S\/\. 350/)).toBeInTheDocument();
    expect(screen.getByText(/8 min caminando/)).toBeInTheDocument();
    expect(screen.getByText("Habitación")).toBeInTheDocument();
  });

  it("llama a onOpen con el listing al hacer click en la tarjeta", () => {
    const onOpen = vi.fn();
    const listing = { ...BASE_LISTING };
    const { container } = render(<HousingCard listing={listing} onOpen={onOpen} />);

    container.firstChild.click();

    expect(onOpen).toHaveBeenCalledWith(listing);
  });

  it("no muestra el boton de favorito si no se pasa onToggleFavorite", () => {
    renderCard();

    expect(document.querySelector(".lucide-heart")).not.toBeInTheDocument();
  });

  it("al hacer click en favorito llama a onToggleFavorite y no dispara onOpen", () => {
    const onOpen = vi.fn();
    const onToggleFavorite = vi.fn();
    const listing = { ...BASE_LISTING };
    render(<HousingCard listing={listing} onOpen={onOpen} onToggleFavorite={onToggleFavorite} isFavorite={false} />);

    document.querySelector(".lucide-heart").closest("button").click();

    expect(onToggleFavorite).toHaveBeenCalledWith(listing);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("resalta el corazon cuando isFavorite es true", () => {
    renderCard({}, { onToggleFavorite: vi.fn(), isFavorite: true });

    expect(document.querySelector(".lucide-heart").getAttribute("class")).toMatch(/fill-red-500/);
  });

  it("muestra el badge Maki Verificado solo si el listing esta verificado", () => {
    renderCard({ verified_by_maki: true });
    expect(screen.getByText("Maki Verificado")).toBeInTheDocument();
  });

  it("no muestra el badge Maki Verificado si no esta verificado", () => {
    renderCard({ verified_by_maki: false });
    expect(screen.queryByText("Maki Verificado")).not.toBeInTheDocument();
  });

  it("muestra hasta 3 amenities y un contador +N para el resto", () => {
    renderCard({ amenities: ["WiFi", "Agua caliente", "Cochera", "Lavanderia", "Cocina"] });

    expect(screen.getByText("WiFi")).toBeInTheDocument();
    expect(screen.getByText("Agua caliente")).toBeInTheDocument();
    expect(screen.getByText("Cochera")).toBeInTheDocument();
    expect(screen.queryByText("Lavanderia")).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("arma el link de WhatsApp con el numero y el mensaje precargado", () => {
    renderCard();

    const link = screen.getByText("WhatsApp").closest("a");
    expect(link.getAttribute("href")).toContain("https://wa.me/51966123456?text=");
    expect(decodeURIComponent(link.getAttribute("href"))).toContain("Yanamilla");
  });
});
