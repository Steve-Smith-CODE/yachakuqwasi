import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ListingsMap from "./ListingsMap.jsx";

// react-leaflet no renderiza de verdad en jsdom (depende de layout real del
// DOM), asi que se mockea con stand-ins livianos que solo exponen lo que
// ListingsMap usa: children, position/icon, y el objeto `map` de useMap.
// Esto prueba la logica propia del componente (filtrado de geolocalizados,
// conteo, wiring de callbacks, visibilidad del boton de recentrar) sin pelear
// con Leaflet real.
const { fakeMap } = vi.hoisted(() => ({
  fakeMap: {
    fitBounds: vi.fn(),
    getBounds: vi.fn(() => ({ contains: () => true })),
    on: vi.fn(),
    off: vi.fn(),
    flyTo: vi.fn()
  }
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => fakeMap
}));

vi.mock("react-leaflet-cluster", () => ({
  default: ({ children }) => <div data-testid="cluster">{children}</div>
}));

const GEOLOCATED = {
  id: "h1",
  title: "Cuarto cerca al campus",
  type: "room",
  neighborhood: "Yanamilla",
  price_pen: 300,
  distance_to_unsch_minutes: 5,
  coordinate_y: -13.16,
  coordinate_x: -74.22,
  images: []
};

const NOT_GEOLOCATED = { ...GEOLOCATED, id: "h2", title: "Cuarto sin ubicacion", coordinate_y: null, coordinate_x: null };

beforeEach(() => {
  fakeMap.fitBounds.mockClear();
  fakeMap.flyTo.mockClear();
  fakeMap.getBounds.mockReturnValue({ contains: () => true });
});

describe("ListingsMap", () => {
  it("cuenta solo los alojamientos con coordenadas en el resumen", () => {
    render(<ListingsMap listings={[GEOLOCATED, NOT_GEOLOCATED]} onSelectListing={vi.fn()} selectedListingId={null} />);

    expect(screen.getByText(/1 de 2 habitaciones ubicadas en el mapa/)).toBeInTheDocument();
  });

  it("renderiza un marcador por alojamiento geolocalizado mas el del campus", () => {
    render(<ListingsMap listings={[GEOLOCATED, NOT_GEOLOCATED]} onSelectListing={vi.fn()} selectedListingId={null} />);

    expect(screen.getAllByTestId("marker")).toHaveLength(2);
  });

  it("el popup de un alojamiento llama a onSelectListing al hacer click en Ver alojamiento", () => {
    const onSelectListing = vi.fn();
    render(<ListingsMap listings={[GEOLOCATED]} onSelectListing={onSelectListing} selectedListingId={null} />);

    fireEvent.click(screen.getByText("Ver alojamiento →"));

    expect(onSelectListing).toHaveBeenCalledWith(GEOLOCATED);
  });

  it("no muestra el boton de recentrar si el campus ya esta visible", () => {
    fakeMap.getBounds.mockReturnValue({ contains: () => true });
    render(<ListingsMap listings={[]} onSelectListing={vi.fn()} selectedListingId={null} />);

    expect(screen.queryByLabelText("Volver al campus UNSCH")).not.toBeInTheDocument();
  });

  it("muestra el boton de recentrar cuando el campus sale de vista, y hace flyTo al hacer click", () => {
    fakeMap.getBounds.mockReturnValue({ contains: () => false });
    render(<ListingsMap listings={[]} onSelectListing={vi.fn()} selectedListingId={null} />);

    const button = screen.getByLabelText("Volver al campus UNSCH");
    fireEvent.click(button);

    expect(fakeMap.flyTo).toHaveBeenCalled();
  });
});
