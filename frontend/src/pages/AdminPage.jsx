import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getStatsRequest,
  getPendingHousingsRequest,
  reviewHousingRequest,
  getPendingDocumentsRequest,
  reviewDocumentRequest,
  blockUserRequest
} from "../api/admin.js";
import { ApiError } from "../api/client.js";

export default function AdminPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingHousings, setPendingHousings] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [blockUserId, setBlockUserId] = useState("");
  const [blockMotivo, setBlockMotivo] = useState("");
  const [blockDias, setBlockDias] = useState("");
  const [blockMessage, setBlockMessage] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [s, housings, docs] = await Promise.all([
        getStatsRequest(token),
        getPendingHousingsRequest(token),
        getPendingDocumentsRequest(token)
      ]);
      setStats(s);
      setPendingHousings(housings);
      setPendingDocs(docs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el panel de administración.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleHousingReview(id, estado) {
    await reviewHousingRequest(token, id, estado);
    setPendingHousings((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleDocReview(id, estado) {
    await reviewDocumentRequest(token, id, estado, estado === "approved" ? "Documento válido" : "Documento rechazado");
    setPendingDocs((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleBlockUser(e) {
    e.preventDefault();
    setBlockMessage("");
    try {
      const result = await blockUserRequest(token, blockUserId, blockMotivo, blockDias ? Number(blockDias) : undefined);
      setBlockMessage(result.message);
      setBlockUserId("");
      setBlockMotivo("");
      setBlockDias("");
    } catch (err) {
      setBlockMessage(err instanceof ApiError ? err.message : "No se pudo bloquear al usuario.");
    }
  }

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-slate-400">Cargando panel...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-xl font-black text-slate-900">Panel de Administración</h1>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Usuarios</span>
            <span className="text-2xl font-black text-slate-900">{stats.totalUsers}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Habitaciones</span>
            <span className="text-2xl font-black text-slate-900">{stats.totalHousings}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Docs pendientes</span>
            <span className="text-2xl font-black text-slate-900">{stats.pendingDocuments}</span>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
          Habitaciones pendientes ({pendingHousings.length})
        </h2>
        {pendingHousings.length === 0 ? (
          <p className="text-xs text-slate-400">No hay habitaciones esperando revisión.</p>
        ) : (
          <div className="space-y-2">
            {pendingHousings.map((listing) => (
              <div key={listing.id} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-4 bg-white">
                <div>
                  <p className="text-sm font-bold text-slate-800">{listing.title}</p>
                  <p className="text-xs text-slate-400">
                    {listing.neighborhood} · S/. {listing.price_pen} / mes · arrendador: {listing.profiles?.name || "—"}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleHousingReview(listing.id, "approved")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleHousingReview(listing.id, "flagged")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
          Documentos pendientes ({pendingDocs.length})
        </h2>
        {pendingDocs.length === 0 ? (
          <p className="text-xs text-slate-400">No hay documentos esperando revisión.</p>
        ) : (
          <div className="space-y-2">
            {pendingDocs.map((doc) => (
              <div key={doc.id} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-4 bg-white">
                <div>
                  <p className="text-sm font-bold text-slate-800">{doc.profiles?.name || "Usuario"}</p>
                  <a href={doc.doc_url} target="_blank" rel="noreferrer" className="text-xs text-guindo underline">
                    Ver documento
                  </a>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleDocReview(doc.id, "approved")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleDocReview(doc.id, "rejected")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3 max-w-sm">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Bloquear usuario</h2>
        {blockMessage && <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">{blockMessage}</p>}
        <form onSubmit={handleBlockUser} className="space-y-2">
          <input
            required
            placeholder="ID del usuario (uuid)"
            value={blockUserId}
            onChange={(e) => setBlockUserId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
          />
          <input
            required
            placeholder="Motivo"
            value={blockMotivo}
            onChange={(e) => setBlockMotivo(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
          />
          <input
            type="number"
            placeholder="Días (opcional)"
            value={blockDias}
            onChange={(e) => setBlockDias(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
          />
          <button type="submit" className="w-full bg-guindo text-white py-2 rounded-xl text-sm font-black hover:bg-guindo-dark cursor-pointer">
            Bloquear
          </button>
        </form>
      </section>
    </div>
  );
}
