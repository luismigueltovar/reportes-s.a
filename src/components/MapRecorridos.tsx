'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
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
const iconContrato = svgIcon('#1A3A6B', 'C'); // azul corporativo — contrato
const iconAlerta = svgIcon('#dc2626', '!');   // rojo — alerta

// ── Simulated route ──────────────────────────────────────────────────────
const recorridoCoords: [number, number][] = [
  [3.4516, -76.5320],
  [3.4525, -76.5305],
  [3.4538, -76.5288],
  [3.4550, -76.5272],
  [3.4562, -76.5258],
];

const marcadores = [
  {
    pos: recorridoCoords[0] as [number, number],
    icon: iconInicio,
    title: 'Inicio de recorrido',
    detail: '08:02 AM — Salida base operativa',
  },
  {
    pos: recorridoCoords[2] as [number, number],
    icon: iconContrato,
    title: 'Contrato #48291',
    detail: '08:18 AM — Revisión periódica domiciliaria',
  },
  {
    pos: recorridoCoords[4] as [number, number],
    icon: iconAlerta,
    title: 'Alerta de desvío',
    detail: '08:35 AM — Técnico fuera de zona asignada',
  },
];

// ── Component ────────────────────────────────────────────────────────────
export default function MapRecorridos() {
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

  return (
    <MapContainer
      center={[3.4516, -76.5320]}
      zoom={14}
      scrollWheelZoom
      style={{ height: 'calc(100vh - 140px)', width: '100%', borderRadius: '1rem' }}
      className="z-0 shadow-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Polyline — recorrido del técnico */}
      <Polyline
        positions={recorridoCoords}
        pathOptions={{
          color: '#1A3A6B',
          weight: 5,
          opacity: 0.85,
          dashArray: '10 6',
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {/* Marcadores */}
      {marcadores.map((m, i) => (
        <Marker key={i} position={m.pos} icon={m.icon}>
          <Popup>
            <div style={{ minWidth: 180 }}>
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: '#1e293b' }}>
                {m.title}
              </p>
              <p style={{ fontSize: 12, margin: '4px 0 0', color: '#64748b' }}>
                {m.detail}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
