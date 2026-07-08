import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import ListingDetailModal from "../components/ListingDetailModal.jsx";
import { getHousingRequest } from "../api/housings.js";

export default function ListingDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const hasBackground = Boolean(location.state?.backgroundLocation);
  const preloaded = location.state?.listing?.id === id ? location.state.listing : null;

  const [listing, setListing] = useState(preloaded);
  const [loading, setLoading] = useState(!preloaded);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (preloaded) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    getHousingRequest(id)
      .then((data) => {
        if (!cancelled) setListing(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleClose() {
    if (hasBackground) navigate(-1);
    else navigate("/explorar");
  }

  if (notFound) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
        <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl relative z-10 text-center space-y-4">
          <Compass className="h-10 w-10 text-slate-300 mx-auto stroke-1" />
          <h3 className="font-display text-lg font-black text-slate-900">Esta habitación ya no está disponible</h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            Puede que la publicación haya sido retirada o el enlace esté desactualizado.
          </p>
          <button
            onClick={handleClose}
            className="bg-guindo text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all cursor-pointer"
          >
            Volver a explorar
          </button>
        </div>
      </div>
    );
  }

  if (loading || !listing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <div className="bg-white rounded-3xl max-w-5xl w-full h-[80vh] shadow-2xl relative z-10 animate-pulse overflow-hidden">
          <div className="h-[420px] bg-slate-100" />
          <div className="p-10 space-y-4">
            <div className="h-5 w-2/3 bg-slate-100 rounded" />
            <div className="h-4 w-1/3 bg-slate-100 rounded" />
            <div className="h-20 w-full bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return <ListingDetailModal listing={listing} onClose={handleClose} />;
}
