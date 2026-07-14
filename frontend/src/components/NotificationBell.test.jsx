import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotificationBell from "./NotificationBell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  listNotificationsRequest,
  markNotificationReadRequest,
  markAllNotificationsReadRequest
} from "../api/notifications.js";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

vi.mock("../api/notifications.js", () => ({
  listNotificationsRequest: vi.fn(),
  markNotificationReadRequest: vi.fn(),
  markAllNotificationsReadRequest: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>
  );
}

const NOTIF_APPROVED = {
  id: "n1",
  type: "listing_approved",
  title: "Tu anuncio fue aprobado",
  body: "Ya esta visible para estudiantes",
  created_at: new Date().toISOString(),
  read_at: null,
  listing_id: "h1"
};

const NOTIF_READ = {
  id: "n2",
  type: "new_user",
  title: "Nuevo usuario registrado",
  body: null,
  created_at: new Date().toISOString(),
  read_at: new Date().toISOString(),
  actor_id: "u9"
};

beforeEach(() => {
  useAuth.mockReturnValue({ token: "tok" });
  listNotificationsRequest.mockReset().mockResolvedValue({ notifications: [], unreadCount: 0 });
  markNotificationReadRequest.mockReset().mockResolvedValue({});
  markAllNotificationsReadRequest.mockReset().mockResolvedValue({});
  mockNavigate.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("NotificationBell", () => {
  it("carga las notificaciones al montar y muestra el contador de no leidas", async () => {
    listNotificationsRequest.mockResolvedValue({ notifications: [NOTIF_APPROVED], unreadCount: 1 });

    renderBell();

    expect(await screen.findByText("1")).toBeInTheDocument();
    expect(listNotificationsRequest).toHaveBeenCalledWith("tok");
  });

  it("muestra 9+ cuando hay mas de 9 notificaciones sin leer", async () => {
    listNotificationsRequest.mockResolvedValue({ notifications: [], unreadCount: 15 });

    renderBell();

    expect(await screen.findByText("9+")).toBeInTheDocument();
  });

  it("al abrir el panel lista las notificaciones y muestra el vacio si no hay", async () => {
    renderBell();
    fireEvent.click(screen.getByTitle("Notificaciones"));

    expect(await screen.findByText("No tienes notificaciones.")).toBeInTheDocument();
  });

  it("muestra titulo y cuerpo de cada notificacion al abrir el panel", async () => {
    listNotificationsRequest.mockResolvedValue({ notifications: [NOTIF_APPROVED, NOTIF_READ], unreadCount: 1 });
    renderBell();
    await screen.findByText("1");

    fireEvent.click(screen.getByTitle("Notificaciones"));

    expect(await screen.findByText("Tu anuncio fue aprobado")).toBeInTheDocument();
    expect(screen.getByText("Nuevo usuario registrado")).toBeInTheDocument();
  });

  it("al hacer click en una notificacion la marca leida y navega a su destino", async () => {
    listNotificationsRequest.mockResolvedValue({ notifications: [NOTIF_APPROVED], unreadCount: 1 });
    renderBell();
    fireEvent.click(screen.getByTitle("Notificaciones"));
    fireEvent.click(await screen.findByText("Tu anuncio fue aprobado"));

    await waitFor(() => expect(markNotificationReadRequest).toHaveBeenCalledWith("tok", "n1"));
    expect(mockNavigate).toHaveBeenCalledWith("/habitacion/h1", undefined);
  });

  it("marcar todas como leidas llama al endpoint y pone el contador en cero", async () => {
    listNotificationsRequest.mockResolvedValue({ notifications: [NOTIF_APPROVED], unreadCount: 1 });
    renderBell();
    fireEvent.click(screen.getByTitle("Notificaciones"));
    await screen.findByText("Tu anuncio fue aprobado");

    fireEvent.click(screen.getByText("Marcar todas"));

    await waitFor(() => expect(markAllNotificationsReadRequest).toHaveBeenCalledWith("tok"));
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });
});
