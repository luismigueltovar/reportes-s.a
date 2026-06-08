'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── SVG Icon factories ───────────────────────────────────────────────────
function svgIcon(color: string, label: string) {
  return L.divIcon({
    className: '',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -42],
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z"
              fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="16" cy="15" r="7" fill="#fff" opacity=".9"/>
        <text x="16" y="19" text-anchor="middle" font-size="11" font-weight="700"
              fill="${color}" font-family="Inter,system-ui,sans-serif">${label}</text>
      </svg>
    `,
  });
}

const iconInicio = svgIcon('#16a34a', 'A');   // verde — inicio
const iconFin    = svgIcon('#dc2626', 'B');   // rojo — fin

// ── Tipos ────────────────────────────────────────────────────────────────
export interface PuntoTrayectoria {
  lat: number;
  lng: number;
  hora: string;
}

interface MapRecorridosProps {
  trayectoria?: PuntoTrayectoria[];
}

// ── Sub-component: ajusta el mapa al bounds de la trayectoria ────────────
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [coords, map]);
  return null;
}

// ── Component ────────────────────────────────────────────────────────────
export default function MapRecorridos({ trayectoria }: MapRecorridosProps) {
  // Fix default marker icon paths broken by webpack
  useEffect(() => {
    // @ts-ignore
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  const puntos: PuntoTrayectoria[] = useMemo(() => {
    if (!trayectoria) return [];
    const parsed = typeof trayectoria === 'string' ? JSON.parse(trayectoria) : trayectoria;
    return Array.isArray(parsed) ? parsed : [];
  }, [trayectoria]);

  const coords: [number, number][] = useMemo(
    () => puntos.map((p) => [p.lat, p.lng] as [number, number]),
    [puntos],
  );

  // Centro por defecto (Cali) si no hay datos
  const defaultCenter: [number, number] = [3.4516, -76.532];
  const center = coords.length > 0 ? coords[0] : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom
      style={{ height: 'calc(100vh - 140px)', width: '100%', borderRadius: '1rem' }}
      className="z-0 shadow-lg"
    >
      {/* ── Control de capas base ──────────────────────────────────── */}
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="Mapa Base" checked>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Vista Satelital">
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {coords.length > 0 && (
        <>
          <FitBounds coords={coords} />

          {/* Polyline — recorrido del técnico */}
          <Polyline
            positions={coords}
            pathOptions={{
              color: '#1A3A6B',
              weight: 5,
              opacity: 0.85,
              dashArray: '10 6',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />

          {/* Marcador inicio */}
          <Marker position={coords[0]} icon={iconInicio}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: '#1e293b' }}>
                  Inicio de recorrido
                </p>
                <p style={{ fontSize: 12, margin: '4px 0 0', color: '#64748b' }}>
                  {trayectoria![0].hora}
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Marcador fin */}
          <Marker position={coords[coords.length - 1]} icon={iconFin}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: '#1e293b' }}>
                  Último punto registrado
                </p>
                <p style={{ fontSize: 12, margin: '4px 0 0', color: '#64748b' }}>
                  {trayectoria![trayectoria!.length - 1].hora}
                </p>
              </div>
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}
