import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StudentDashboard from "./StudentDashboard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { listChatsRequest, getMessagesRequest, sendMessageRequest } from "../api/chat.js";
import { listFavoritesRequest } from "../api/favorites.js";
import { submitVerificationRequest } from "../api/verification.js";
import { getStudentStatsRequest } from "../api/stats.js";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

vi.mock("../api/chat.js", () => ({
  listChatsRequest: vi.fn(),
  getMessagesRequest: vi.fn(),
  sendMessageRequest: vi.fn()
}));

vi.mock("../api/favorites.js", () => ({
  listFavoritesRequest: vi.fn()
}));

vi.mock("../api/verification.js", () => ({
  submitVerificationRequest: vi.fn()
}));

vi.mock("../api/stats.js", () => ({
  getStudentStatsRequest: vi.fn()
}));

vi.mock("../components/UserProfileModal.jsx", () => ({
  default: ({ userId, onClose }) => (
    <div data-testid="user-profile-modal" data-user-id={userId}>
      <button onClick={onClose}>Cerrar perfil</button>
    </div>
  )
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => vi.fn() };
});

const CHAT = {
  id: "c1",
  last_message: "Hola, sigue disponible?",
  landlord: { id: "l1", name: "Rosa Landlord", avatar_url: null },
  housing_listings: { title: "Cuarto A" }
};

function setupDefaults() {
  useAuth.mockReturnValue({ token: "tok", user: { name: "Ana", career: "Ing. Sistemas", is_verified: false } });
  listChatsRequest.mockResolvedValue([]);
  getMessagesRequest.mockResolvedValue([]);
  listFavoritesRequest.mockResolvedValue([]);
  getStudentStatsRequest.mockResolvedValue(null);
  submitVerificationRequest.mockResolvedValue({});
}

beforeEach(() => {
  vi.clearAllMocks();
  setupDefaults();
});

describe("StudentDashboard", () => {
  it("muestra el estado de carga y luego el mensaje vacio si no hay chats", async () => {
    render(<StudentDashboard />);
    expect(screen.getByText("Cargando chats...")).toBeInTheDocument();
    expect(await screen.findByText(/Aún no tienes chats activos/)).toBeInTheDocument();
  });

  it("lista los chats y selecciona el primero automaticamente, cargando sus mensajes", async () => {
    listChatsRequest.mockResolvedValue([CHAT]);
    getMessagesRequest.mockResolvedValue([{ id: "m1", sender: "landlord", text: "Hola, sí sigue libre" }]);
    render(<StudentDashboard />);

    expect(await screen.findAllByText("Cuarto A")).not.toHaveLength(0);
    await waitFor(() => expect(getMessagesRequest).toHaveBeenCalledWith("tok", "c1"));
    expect(await screen.findByText("Hola, sí sigue libre")).toBeInTheDocument();
  });

  it("enviar un mensaje llama a sendMessageRequest y lo agrega al chat", async () => {
    listChatsRequest.mockResolvedValue([CHAT]);
    sendMessageRequest.mockResolvedValueOnce({ id: "m2", sender: "student", text: "Sí, me interesa" });
    render(<StudentDashboard />);
    await screen.findAllByText("Cuarto A");

    fireEvent.change(screen.getByPlaceholderText("Escribe tu respuesta..."), { target: { value: "Sí, me interesa" } });
    fireEvent.submit(screen.getByPlaceholderText("Escribe tu respuesta...").closest("form"));

    await waitFor(() => expect(sendMessageRequest).toHaveBeenCalledWith("tok", "c1", "Sí, me interesa"));
    expect(await screen.findByText("Sí, me interesa")).toBeInTheDocument();
  });

  it("muestra los favoritos guardados y su conteo", async () => {
    listFavoritesRequest.mockResolvedValue([{ id: "h1", title: "Cuarto favorito", price_pen: 300, images: [] }]);
    render(<StudentDashboard />);

    expect(await screen.findByText("Mis Alojamientos Favoritos (1)")).toBeInTheDocument();
    expect(screen.getByText("Cuarto favorito")).toBeInTheDocument();
  });

  it("usa las stats del backend para favoritos/chats cuando estan disponibles", async () => {
    getStudentStatsRequest.mockResolvedValue({ savedFavorites: 7, activeChats: 3 });
    render(<StudentDashboard />);

    expect(await screen.findByText("7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("mover el slider de alquiler actualiza el total del presupuesto", async () => {
    render(<StudentDashboard />);
    await screen.findByText(/Aún no tienes chats activos/);

    expect(screen.getByText(/S\/\. 500/)).toBeInTheDocument();
    const rentSlider = screen.getByText("Alquiler de Cuarto:").closest("div").parentElement.querySelector("input[type='range']");
    fireEvent.change(rentSlider, { target: { value: "300" } });

    expect(screen.getByText(/S\/\. 550/)).toBeInTheDocument();
  });

  it("estudiante sin verificar: el envio de verificacion se habilita solo con ambos archivos", async () => {
    render(<StudentDashboard />);
    await screen.findByText("Sin Verificar");

    const submitBtn = screen.getByText("Enviar para revisión");
    expect(submitBtn).toBeDisabled();

    const dniInput = screen.getByText("Foto de DNI").closest("label").querySelector("input[type='file']");
    const carnetInput = screen.getByText("Carnet / Constancia").closest("label").querySelector("input[type='file']");
    const dni = new File(["dni"], "dni.png", { type: "image/png" });
    const carnet = new File(["carnet"], "carnet.png", { type: "image/png" });
    fireEvent.change(dniInput, { target: { files: [dni] } });
    fireEvent.change(carnetInput, { target: { files: [carnet] } });

    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => expect(submitVerificationRequest).toHaveBeenCalledWith("tok", expect.any(String), expect.any(String)));
    expect(await screen.findByText("Revisión en cola")).toBeInTheDocument();
  });

  it("estudiante ya verificado muestra Estudiante Verificado sin formulario de subida", async () => {
    useAuth.mockReturnValue({ token: "tok", user: { name: "Ana", career: "Ing. Sistemas", is_verified: true } });
    render(<StudentDashboard />);

    expect(await screen.findByText("Estudiante Verificado")).toBeInTheDocument();
    expect(screen.queryByText("Foto de DNI")).not.toBeInTheDocument();
  });

  it("click en el avatar de un chat abre el perfil del arrendador", async () => {
    listChatsRequest.mockResolvedValue([CHAT]);
    render(<StudentDashboard />);
    await screen.findAllByText("Cuarto A");

    fireEvent.click(screen.getAllByAltText("Rosa Landlord")[0]);

    expect(screen.getByTestId("user-profile-modal")).toHaveAttribute("data-user-id", "l1");
  });
});
