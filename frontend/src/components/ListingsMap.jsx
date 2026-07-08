import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { getPlaceholderImage } from "../constants/placeholderImages.js";
import unschCampusPhoto from "../assets/images/maqueta-unsch.webp";

// Ubicacion aproximada del campus UNSCH en Ayacucho, usada como centro por
// defecto del mapa y como referencia de distancia para el estudiante.
const UNSCH_POSITION = [-13.1631, -74.2236];
const UNSCH_LATLNG = L.latLng(UNSCH_POSITION);

function priceIcon(price, isSelected) {
  const bg = isSelected ? "#e8a100" : "#a62639";
  const text = isSelected ? "#1e293b" : "#ffffff";
  const border = isSelected ? "#f5b929" : "#ffffff";
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:${text};border:2px solid ${border};border-radius:9999px;padding:3px 9px;font-size:10px;font-weight:900;font-family:'Inter',sans-serif;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3);">S/.${price}</div>`,
    iconSize: [56, 26],
    iconAnchor: [28, 13]
  });
}

const unschIcon = L.divIcon({
  className: "",
  html: `<div style="background:#a62639;border:2px solid white;border-radius:10px;padding:4px;box-shadow:0 4px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;width:26px;height:26px;">
      <div style="width:100%;height:100%;border-radius:5px;background:white;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:#a62639;font-family:'Inter',sans-serif;">U</div>
    </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

function clusterIcon(cluster) {
  return L.divIcon({
    html: `<div style="background:#a62639;color:#fff;border:2px solid white;border-radius:9999px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;font-family:'Inter',sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.35);">${cluster.getChildCount()}</div>`,
    className: "",
    iconSize: [36, 36]
  });
}

// Ajusta el zoom/centro para que todos los pines (y el campus) queden
// visibles cuando cambia la lista de alojamientos geolocalizados.
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
  }, [points, map]);
  return null;
}

// Boton flotante, estilo "volver a mi ubicacion" de Google Maps: solo aparece
// cuando el campus deja de estar visible (el usuario arrastro o hizo zoom
// lejos de la zona) y al click hace un flyTo animado de regreso.
function RecenterControl() {
  const map = useMap();
  const [visible, setVisible] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    function checkVisibility() {
      setVisible(!map.getBounds().contains(UNSCH_LATLNG));
    }
    checkVisibility();
    map.on("moveend", checkVisibility);
    map.on("zoomend", checkVisibility);
    return () => {
      map.off("moveend", checkVisibility);
      map.off("zoomend", checkVisibility);
    };
  }, [map]);

  useEffect(() => {
    if (btnRef.current) L.DomEvent.disableClickPropagation(btnRef.current);
  }, []);

  if (!visible) return null;

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={() => map.flyTo(UNSCH_POSITION, 15, { duration: 0.8 })}
      title="Volver al campus UNSCH"
      aria-label="Volver al campus UNSCH"
      className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white text-guindo text-[11px] font-bold px-3 py-2 rounded-full shadow-lg border border-guindo/15 hover:bg-guindo hover:text-white active:scale-95 transition-all cursor-pointer animate-fade-in"
    >
      <LocateFixed className="h-3.5 w-3.5 shrink-0" />
      Volver a la UNSCH
    </button>
  );
}

export default function ListingsMap({ listings, onSelectListing, selectedListingId }) {
  const geolocated = useMemo(
    () => listings.filter((l) => l.coordinate_y != null && l.coordinate_x != null),
    [listings]
  );

  const points = useMemo(
    () => [UNSCH_POSITION, ...geolocated.map((l) => [l.coordinate_y, l.coordinate_x])],
    [geolocated]
  );

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 h-96 relative">
      <MapContainer
        center={UNSCH_POSITION}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        <RecenterControl />

        <Marker position={UNSCH_POSITION} icon={unschIcon}>
          <Popup minWidth={190} maxWidth={220}>
            <div className="space-y-1.5">
              <img
                src={unschCampusPhoto}
                alt="Campus de la Universidad Nacional de San Cristobal de Huamanga"
                className="w-full h-24 object-cover rounded-lg"
              />
              <strong className="block text-xs text-guindo">Campus UNSCH</strong>
              <span className="block text-[10px] text-slate-500 leading-snug">
                Universidad Nacional de San Cristobal de Huamanga, Ayacucho
              </span>
            </div>
          </Popup>
        </Marker>

        <MarkerClusterGroup chunkedLoading iconCreateFunction={clusterIcon}>
          {geolocated.map((room) => (
            <Marker
              key={room.id}
              position={[room.coordinate_y, room.coordinate_x]}
              icon={priceIcon(room.price_pen, room.id === selectedListingId)}
            >
              <Popup minWidth={200} maxWidth={220}>
                <div className="space-y-1.5">
                  <img
                    src={room.images?.[0] || getPlaceholderImage(room.type, room.id)}
                    alt={room.title}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <strong className="block text-xs leading-snug">{room.title}</strong>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{room.neighborhood}</span>
                    {room.distance_to_unsch_minutes != null && (
                      <span>A {room.distance_to_unsch_minutes} min de la UNSCH</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-black text-guindo text-xs">S/. {room.price_pen} / mes</span>
                    <button
                      type="button"
                      onClick={() => onSelectListing(room)}
                      className="text-[10px] font-bold text-white bg-guindo px-2.5 py-1.5 rounded-lg hover:bg-guindo-dark transition-colors cursor-pointer"
                    >
                      Ver alojamiento →
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm px-3.5 py-2 rounded-xl text-[10px] text-slate-500 font-bold border border-slate-100 flex items-center justify-between z-[1000] pointer-events-none">
        <span>📍 {geolocated.length} de {listings.length} habitaciones ubicadas en el mapa</span>
        <span className="text-guindo">YachakuqWasi</span>
      </div>
    </div>
  );
}
