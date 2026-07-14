import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import AdminPage from "./AdminPage.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getStatsRequest,
  getPendingDocumentsRequest,
  reviewUserDocumentsRequest,
  getAllHousingsRequest,
  getAllUsersRequest,
  getAuditLogsRequest,
  reviewHousingRequest,
  setUserRoleRequest,
  blockUserRequest,
  reactivateUserRequest,
  deleteUserRequest,
  getVerifiedDomainsRequest,
  addVerifiedDomainRequest,
  removeVerifiedDomainRequest
} from "../api/admin.js";
import { deleteHousingRequest } from "../api/housings.js";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

vi.mock("../api/admin.js", () => ({
  getStatsRequest: vi.fn(),
  getPendingHousingsRequest: vi.fn(),
  reviewHousingRequest: vi.fn(),
  getPendingDocumentsRequest: vi.fn(),
  reviewUserDocumentsRequest: vi.fn(),
  blockUserRequest: vi.fn(),
  reactivateUserRequest: vi.fn(),
  deleteUserRequest: vi.fn(),
  getAllHousingsRequest: vi.fn(),
  getAllUsersRequest: vi.fn(),
  setUserRoleRequest: vi.fn(),
  getAuditLogsRequest: vi.fn(),
  getVerifiedDomainsRequest: vi.fn(),
  addVerifiedDomainRequest: vi.fn(),
  removeVerifiedDomainRequest: vi.fn()
}));

vi.mock("../api/housings.js", () => ({
  deleteHousingRequest: vi.fn()
}));

vi.mock("../components/ListingDetailModal.jsx", () => ({
  default: ({ listing, onClose }) => (
    <div data-testid="listing-detail-modal" data-listing-id={listing.id}>
      <button onClick={onClose}>cerrar-listing</button>
    </div>
  )
}));

vi.mock("../components/AdminUserDetailModal.jsx", () => ({
  default: ({ userId, onClose }) => (
    <div data-testid="admin-user-modal" data-user-id={userId}>
      <button onClick={onClose}>cerrar-usuario</button>
    </div>
  )
}));

let mockLocationState = null;
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useLocation: () => ({ state: mockLocationState }) };
});

const DOC_USER = {
  user_id: "u1",
  profiles: { name: "Ana Torres", role: "student" },
  doc_type: "dni",
  doc_url: "https://cdn.test/dni.png",
  id: "d1"
};

const HOUSING_A = {
  id: "h1",
  title: "Zeta Cuarto",
  neighborhood: "Yanamilla",
  price_pen: 300,
  status: "pending",
  created_at: "2026-02-01T00:00:00Z",
  profiles: { name: "Rosa Landlord", phone: "966123456" }
};
const HOUSING_B = {
  id: "h2",
  title: "Alfa Cuarto",
  neighborhood: "Magdalena",
  price_pen: 400,
  status: "approved",
  created_at: "2026-01-01T00:00:00Z",
  profiles: { name: "Luis Landlord", phone: "955123456" }
};

const USER_ACTIVE = {
  id: "u2",
  name: "Ana Torres",
  role: "student",
  is_verified: true,
  verification_status: "approved",
  blocked_reason: null,
  blocked_until: null,
  created_at: "2026-01-01T00:00:00Z"
};
const USER_BLOCKED = {
  id: "u3",
  name: "Bloqueado User",
  role: "student",
  is_verified: false,
  verification_status: "none",
  blocked_reason: "Fraude",
  blocked_until: null,
  created_at: "2026-01-02T00:00:00Z"
};

const ADMIN_LOG = {
  id: "l1",
  type: "listing",
  actor_name: "Admin Uno",
  action: "aprobó un anuncio",
  details: "Cuarto A",
  created_at: "2026-01-01T00:00:00Z",
  listing_id: "h1"
};

function setupDefaults() {
  useAuth.mockReturnValue({ token: "tok" });
  getStatsRequest.mockResolvedValue({ ok: true });
  getPendingDocumentsRequest.mockResolvedValue([]);
  getAllHousingsRequest.mockResolvedValue([]);
  getAllUsersRequest.mockResolvedValue([]);
  getAuditLogsRequest.mockResolvedValue([]);
  reviewUserDocumentsRequest.mockResolvedValue({});
  reviewHousingRequest.mockResolvedValue({});
  setUserRoleRequest.mockResolvedValue({});
  blockUserRequest.mockResolvedValue({});
  reactivateUserRequest.mockResolvedValue({});
  deleteUserRequest.mockResolvedValue({});
  deleteHousingRequest.mockResolvedValue({});
  getVerifiedDomainsRequest.mockResolvedValue([]);
  addVerifiedDomainRequest.mockResolvedValue({});
  removeVerifiedDomainRequest.mockResolvedValue({});
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLocationState = null;
  setupDefaults();
});

describe("AdminPage", () => {
  it("muestra un skeleton de carga y luego el titulo del panel", async () => {
    render(<AdminPage />);
    expect(screen.getByRole("status", { name: /cargando panel de administración/i })).toBeInTheDocument();
    expect(await screen.findByText("Panel de Administración")).toBeInTheDocument();
  });

  it("muestra el error si falla la carga inicial", async () => {
    getStatsRequest.mockRejectedValueOnce(new Error("500"));
    render(<AdminPage />);
    expect(await screen.findByText("No se pudo cargar el panel de administración.")).toBeInTheDocument();
  });

  it("el boton Reintentar del banner de error vuelve a llamar a loadAll", async () => {
    getStatsRequest.mockRejectedValueOnce(new Error("500"));
    render(<AdminPage />);
    await screen.findByText("No se pudo cargar el panel de administración.");

    getStatsRequest.mockResolvedValueOnce({ ok: true });
    fireEvent.click(screen.getByText("Reintentar"));

    await waitFor(() => expect(getStatsRequest).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByText("No se pudo cargar el panel de administración.")).not.toBeInTheDocument()
    );
  });

  it("muestra tendencia real en las KPI cards de anuncios y cuentas segun created_at", async () => {
    const now = Date.now();
    const recentHousing = { ...HOUSING_A, id: "h-recent", created_at: new Date(now).toISOString() };
    const recentUser = { ...USER_ACTIVE, id: "u-recent", created_at: new Date(now).toISOString() };
    getAllHousingsRequest.mockResolvedValue([recentHousing]);
    getAllUsersRequest.mockResolvedValue([recentUser]);

    render(<AdminPage />);
    await screen.findByText("Panel de Administración");

    expect(screen.getByText("Total Ofertas de Vivienda")).toBeInTheDocument();
    expect(screen.getByText("Cuentas Registradas")).toBeInTheDocument();
    expect(screen.getAllByText("100%").length).toBeGreaterThan(0);
  });

  it("muestra la seccion de graficos con datos reales de anuncios y usuarios", async () => {
    getAllHousingsRequest.mockResolvedValue([HOUSING_A, HOUSING_B]);
    render(<AdminPage />);
    await screen.findByText("Panel de Administración");

    expect(screen.getByText("Tendencia de Registros")).toBeInTheDocument();
    expect(screen.getByText("Anuncios por Estado")).toBeInTheDocument();
    // "Pendientes"/"Aprobadas" aparecen tanto en la leyenda de la dona como en
    // el desglose de texto existente (BreakdownRow) - ambos son validos.
    expect(screen.getAllByText("Pendientes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Aprobadas").length).toBeGreaterThan(0);
  });

  it("verificaciones: cola vacia muestra el mensaje de exito", async () => {
    render(<AdminPage />);
    expect(await screen.findByText("¡Excelente! Cola de identidades limpia")).toBeInTheDocument();
  });

  it("verificaciones: aprobar ambos documentos llama al endpoint con approved", async () => {
    getPendingDocumentsRequest.mockResolvedValue([DOC_USER]);
    render(<AdminPage />);
    await screen.findByText("Ana Torres");

    fireEvent.click(screen.getByText("✔ Aprobar ambos"));

    await waitFor(() =>
      expect(reviewUserDocumentsRequest).toHaveBeenCalledWith("tok", "u1", "approved", "Documentos válidos")
    );
  });

  it("verificaciones: rechazar llama al endpoint con rejected", async () => {
    getPendingDocumentsRequest.mockResolvedValue([DOC_USER]);
    render(<AdminPage />);
    await screen.findByText("Ana Torres");

    fireEvent.click(screen.getByText("❌ Rechazar"));

    await waitFor(() =>
      expect(reviewUserDocumentsRequest).toHaveBeenCalledWith("tok", "u1", "rejected", "Documentos rechazados")
    );
  });

  it("anuncios: lista, aprueba y suspende desde la tabla", async () => {
    getAllHousingsRequest.mockResolvedValue([HOUSING_A]);
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Monitoreo de Anuncios"));
    await screen.findByText("Zeta Cuarto");

    fireEvent.click(screen.getByText("Aprobar"));
    await waitFor(() => expect(reviewHousingRequest).toHaveBeenCalledWith("tok", "h1", "approved"));

    fireEvent.click(screen.getByText("Suspender"));
    await waitFor(() => expect(reviewHousingRequest).toHaveBeenCalledWith("tok", "h1", "suspended"));
  });

  it("anuncios: eliminar pide confirmacion y llama al endpoint solo si se confirma", async () => {
    getAllHousingsRequest.mockResolvedValue([HOUSING_A]);
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Monitoreo de Anuncios"));
    await screen.findByText("Zeta Cuarto");

    vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    fireEvent.click(screen.getByText("Eliminar"));
    expect(deleteHousingRequest).not.toHaveBeenCalled();

    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    fireEvent.click(screen.getByText("Eliminar"));
    await waitFor(() => expect(deleteHousingRequest).toHaveBeenCalledWith("tok", "h1"));
  });

  it("anuncios: ordenar por Inmueble invierte el orden por defecto (creado desc)", async () => {
    getAllHousingsRequest.mockResolvedValue([HOUSING_A, HOUSING_B]);
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Monitoreo de Anuncios"));
    await screen.findByText("Zeta Cuarto");

    let rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("Zeta Cuarto")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Inmueble"));

    rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("Alfa Cuarto")).toBeInTheDocument();
  });

  it("usuarios: cambiar el rol llama a setUserRoleRequest", async () => {
    getAllUsersRequest.mockResolvedValue([USER_ACTIVE]);
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Control de Usuarios"));
    await screen.findByText("Ana Torres");

    fireEvent.change(screen.getByDisplayValue("Estudiante"), { target: { value: "landlord" } });

    await waitFor(() => expect(setUserRoleRequest).toHaveBeenCalledWith("tok", "u2", "landlord"));
  });

  it("usuarios: suspender pide motivo y dias, y llama a blockUserRequest", async () => {
    getAllUsersRequest.mockResolvedValue([USER_ACTIVE]);
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Control de Usuarios"));
    await screen.findByText("Ana Torres");

    vi.spyOn(window, "prompt").mockReturnValueOnce("Comportamiento sospechoso").mockReturnValueOnce("5");
    fireEvent.click(screen.getByText("Suspender"));

    await waitFor(() => expect(blockUserRequest).toHaveBeenCalledWith("tok", "u2", "Comportamiento sospechoso", 5));
  });

  it("usuarios: bloquear permanentemente llama a blockUserRequest sin dias", async () => {
    getAllUsersRequest.mockResolvedValue([USER_ACTIVE]);
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Control de Usuarios"));
    await screen.findByText("Ana Torres");

    vi.spyOn(window, "prompt").mockReturnValueOnce("Fraude confirmado");
    fireEvent.click(screen.getByText("Bloquear"));

    await waitFor(() => expect(blockUserRequest).toHaveBeenCalledWith("tok", "u2", "Fraude confirmado"));
  });

  it("usuarios: reactivar un usuario bloqueado llama a reactivateUserRequest", async () => {
    getAllUsersRequest.mockResolvedValue([USER_BLOCKED]);
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Control de Usuarios"));
    await screen.findByText("Bloqueado User");

    fireEvent.click(screen.getByText("Reactivar"));

    await waitFor(() => expect(reactivateUserRequest).toHaveBeenCalledWith("tok", "u3"));
  });

  it("usuarios: eliminar cuenta requiere motivo y confirmacion antes de llamar al endpoint", async () => {
    getAllUsersRequest.mockResolvedValue([USER_ACTIVE]);
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Control de Usuarios"));
    await screen.findByText("Ana Torres");

    vi.spyOn(window, "prompt").mockReturnValueOnce("Cuenta duplicada");
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    fireEvent.click(screen.getByText("Eliminar cuenta"));

    await waitFor(() => expect(deleteUserRequest).toHaveBeenCalledWith("tok", "u2", "Cuenta duplicada"));
  });

  it("logs: click en un evento con anuncio asociado abre el detalle del anuncio", async () => {
    getAllHousingsRequest.mockResolvedValue([HOUSING_A]);
    getAuditLogsRequest.mockImplementation((token, scope) => Promise.resolve(scope === "admin" ? [ADMIN_LOG] : []));
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Registro de Admin"));
    await screen.findByText(/aprobó un anuncio/);

    fireEvent.click(screen.getByText(/aprobó un anuncio/).closest("div[class*='border']"));

    expect(await screen.findByTestId("listing-detail-modal")).toHaveAttribute("data-listing-id", "h1");
  });

  it("al llegar desde una notificacion con openUserId, abre la pestaña de usuarios y el perfil", async () => {
    mockLocationState = { openUserId: "u2" };
    getAllUsersRequest.mockResolvedValue([USER_ACTIVE]);
    render(<AdminPage />);

    expect(await screen.findByTestId("admin-user-modal")).toHaveAttribute("data-user-id", "u2");
    expect(screen.getByText("Control de Usuarios").closest("button").className).toMatch(/bg-guindo/);
  });

  it("dominios: cola vacia muestra el mensaje de sin dominios", async () => {
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Dominios Verificados"));

    expect(await screen.findByText("Sin dominios verificados todavía.")).toBeInTheDocument();
  });

  it("dominios: lista los dominios reales con su institucion", async () => {
    getVerifiedDomainsRequest.mockResolvedValue([{ domain: "unsch.edu.pe", institution_name: "UNSCH" }]);
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Dominios Verificados"));

    expect(await screen.findByText("@unsch.edu.pe")).toBeInTheDocument();
    expect(screen.getByText("UNSCH")).toBeInTheDocument();
  });

  it("dominios: agregar uno nuevo llama al endpoint y recarga la lista", async () => {
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Dominios Verificados"));
    await screen.findByText("Sin dominios verificados todavía.");

    fireEvent.change(screen.getByPlaceholderText("dominio.edu.pe"), { target: { value: "unsch.edu.pe" } });
    fireEvent.change(screen.getByPlaceholderText("Nombre de la institución"), { target: { value: "UNSCH" } });
    fireEvent.click(screen.getByText("Agregar"));

    await waitFor(() => expect(addVerifiedDomainRequest).toHaveBeenCalledWith("tok", "unsch.edu.pe", "UNSCH"));
  });

  it("dominios: muestra el error si falla al agregar", async () => {
    addVerifiedDomainRequest.mockRejectedValueOnce(new Error("Ese dominio ya está registrado."));
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Dominios Verificados"));
    await screen.findByText("Sin dominios verificados todavía.");

    fireEvent.change(screen.getByPlaceholderText("dominio.edu.pe"), { target: { value: "unsch.edu.pe" } });
    fireEvent.change(screen.getByPlaceholderText("Nombre de la institución"), { target: { value: "UNSCH" } });
    fireEvent.click(screen.getByText("Agregar"));

    expect(await screen.findByText("No se pudo agregar el dominio.")).toBeInTheDocument();
  });

  it("dominios: eliminar pide confirmacion y llama al endpoint solo si se confirma", async () => {
    getVerifiedDomainsRequest.mockResolvedValue([{ domain: "unsch.edu.pe", institution_name: "UNSCH" }]);
    render(<AdminPage />);
    fireEvent.click(await screen.findByText("Dominios Verificados"));
    await screen.findByText("@unsch.edu.pe");

    vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    fireEvent.click(screen.getByLabelText("Eliminar dominio unsch.edu.pe"));
    expect(removeVerifiedDomainRequest).not.toHaveBeenCalled();

    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    fireEvent.click(screen.getByLabelText("Eliminar dominio unsch.edu.pe"));
    await waitFor(() => expect(removeVerifiedDomainRequest).toHaveBeenCalledWith("tok", "unsch.edu.pe"));
  });
});
