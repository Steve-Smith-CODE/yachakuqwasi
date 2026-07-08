import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Ubicacion aproximada del campus UNSCH en Ayacucho, usada como centro por
// defecto del mapa y como referencia de distancia para el estudiante.
const UNSCH_POSITION = [-13.1631, -74.2236];

function priceIcon(price, isSelected) {
  const bg = isSelected ? "#FFC000" : "#7a1c1c";
  const text = isSelected ? "#1e293b" : "#ffffff";
  const border = isSelected ? "#FFD700" : "#ffffff";
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:${text};border:2px solid ${border};border-radius:9999px;padding:3px 9px;font-size:10px;font-weight:900;font-family:'JetBrains Mono',monospace;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3);">S/.${price}</div>`,
    iconSize: [56, 26],
    iconAnchor: [28, 13]
  });
}

const unschIcon = L.divIcon({
  className: "",
  html: `<div style="background:#7a1c1c;border:2px solid white;border-radius:10px;padding:4px;box-shadow:0 4px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;width:26px;height:26px;">
      <div style="width:100%;height:100%;border-radius:5px;background:white;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:#7a1c1c;font-family:'JetBrains Mono',monospace;">U</div>
    </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

function clusterIcon(cluster) {
  return L.divIcon({
    html: `<div style="background:#7a1c1c;color:#fff;border:2px solid white;border-radius:9999px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;font-family:'JetBrains Mono',monospace;box-shadow:0 2px 8px rgba(0,0,0,.35);">${cluster.getChildCount()}</div>`,
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

        <Marker position={UNSCH_POSITION} icon={unschIcon}>
          <Popup>
            <strong>Campus UNSCH</strong>
          </Popup>
        </Marker>

        <MarkerClusterGroup chunkedLoading iconCreateFunction={clusterIcon}>
          {geolocated.map((room) => (
            <Marker
              key={room.id}
              position={[room.coordinate_y, room.coordinate_x]}
              icon={priceIcon(room.price_pen, room.id === selectedListingId)}
              eventHandlers={{ click: () => onSelectListing(room) }}
            >
              <Popup>
                <div className="space-y-0.5 text-xs">
                  <strong className="block">{room.title}</strong>
                  <span className="block text-slate-500">{room.neighborhood}</span>
                  <span className="block font-black text-guindo">S/. {room.price_pen} / mes</span>
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
