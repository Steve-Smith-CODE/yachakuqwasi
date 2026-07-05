import { useEffect, useState } from "react";
import { listHousingsRequest } from "../api/housings.js";
import { ApiError } from "../api/client.js";
import HousingCard from "../components/HousingCard.jsx";

export default function ExplorePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [barrio, setBarrio] = useState("");
  const [tipo, setTipo] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listHousingsRequest({ barrio: barrio || undefined, tipo: tipo || undefined });
      setListings(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar las habitaciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterSubmit(e) {
    e.preventDefault();
    load();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-black text-slate-900">Explorar alojamientos</h1>
        <p className="text-sm text-slate-500">Publicaciones reales, aprobadas y guardadas en Supabase.</p>
      </div>

      <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Barrio (Ej. San Blas)"
          value={barrio}
          onChange={(e) => setBarrio(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-guindo"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 font-semibold"
        >
          <option value="">Todos los tipos</option>
          <option value="room">Habitación</option>
          <option value="apartment">Departamento</option>
          <option value="shared">Compartido</option>
          <option value="family">Familiar</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-guindo text-white rounded-xl text-sm font-bold hover:bg-guindo-dark cursor-pointer">
          Buscar
        </button>
      </form>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Cargando...</p>
      ) : listings.length === 0 ? (
        <p className="text-sm text-slate-400">No hay publicaciones aprobadas que coincidan con tu búsqueda.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <HousingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
