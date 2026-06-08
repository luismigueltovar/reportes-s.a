'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import UserProfile from '@/components/UserProfile';
import NotificationsBell from '@/components/NotificationsBell';

// ── Import mapa sin SSR ──────────────────────────────────────────────────
const MapRecorridos = dynamic(() => import('@/components/MapRecorridos'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-slate-100 rounded-2xl animate-pulse"
         style={{ height: 'calc(100vh - 140px)' }}>
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-medium">Cargando mapa…</span>
      </div>
    </div>
  ),
});

// ── Timeline data (mock) ─────────────────────────────────────────────────
const bitacoraEvents = [
  {
    time: '08:02 AM',
    title: 'Inicio de recorrido',
    detail: 'Salida desde base operativa — Av. 6N #23-45',
    color: 'bg-green-500',
    ring: 'ring-green-100',
  },
  {
    time: '08:12 AM',
    title: 'Llegada a contrato #48291',
    detail: 'Cl. 15 #28-10 — Revisión periódica domiciliaria',
    color: 'bg-blue-600',
    ring: 'ring-blue-100',
  },
  {
    time: '08:18 AM',
    title: 'Foto de soporte cargada',
    detail: 'Evidencia medidor — 2 fotos subidas correctamente',
    color: 'bg-purple-500',
    ring: 'ring-purple-100',
  },
  {
    time: '08:27 AM',
    title: 'Contrato cerrado como Efectiva',
    detail: 'Técnico confirmó revisión sin novedades',
    color: 'bg-emerald-500',
    ring: 'ring-emerald-100',
  },
  {
    time: '08:35 AM',
    title: 'Alerta de desvío',
    detail: 'Técnico fuera de zona asignada (+300 m)',
    color: 'bg-red-500',
    ring: 'ring-red-100',
  },
];

// ── TimelineItem ─────────────────────────────────────────────────────────
function TimelineItem({
  time,
  title,
  detail,
  color,
  ring,
  isLast,
}: {
  time: string;
  title: string;
  detail: string;
  color: string;
  ring: string;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-4 relative">
      {/* Línea vertical */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-slate-200" />
      )}
      {/* Dot */}
      <div className={`w-6 h-6 rounded-full ${color} ring-4 ${ring} shrink-0 mt-0.5 shadow-sm`} />
      {/* Content */}
      <div className="pb-6 flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-0.5">{time}</p>
        <p className="text-sm font-semibold text-slate-800 leading-snug">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

// ── Page Component ───────────────────────────────────────────────────────
export default function TrazabilidadPage() {
  const today = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(today);
  const [tecnico, setTecnico] = useState('Victor Castaño');

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Mapa de Recorridos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Seguimiento GPS del técnico en campo
          </p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationsBell />
          <UserProfile />
        </div>
      </div>

      {/* ── Filtros ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Fecha</label>
          <input
            type="date"
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-700 w-44"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Técnico</label>
          <select
            className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            value={tecnico}
            onChange={(e) => setTecnico(e.target.value)}
          >
            <option>Victor Castaño</option>
            <option>Carlos Méndez</option>
            <option>Andrés López</option>
          </select>
        </div>
        <button
          className="px-6 py-2.5 rounded-lg font-medium text-white text-sm shadow-sm transition-all hover:opacity-90 active:scale-[0.97] flex items-center gap-2"
          style={{ backgroundColor: '#1A3A6B' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Buscar Recorrido
        </button>
      </div>

      {/* ── Grid: Mapa + Bitácora ──────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">
        {/* Mapa */}
        <div className="col-span-12 xl:col-span-8">
          <MapRecorridos />
        </div>

        {/* Bitácora */}
        <div className="col-span-12 xl:col-span-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 overflow-y-auto"
               style={{ height: 'calc(100vh - 140px)' }}>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ backgroundColor: '#1A3A6B' }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-800">Bitácora del Día</h2>
            </div>

            <div>
              {bitacoraEvents.map((evt, i) => (
                <TimelineItem
                  key={i}
                  time={evt.time}
                  title={evt.title}
                  detail={evt.detail}
                  color={evt.color}
                  ring={evt.ring}
                  isLast={i === bitacoraEvents.length - 1}
                />
              ))}
            </div>

            {/* Resumen */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">Contratos visitados</p>
                  <p className="text-xl font-bold text-slate-800">3</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">Distancia total</p>
                  <p className="text-xl font-bold text-slate-800">4.2 km</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-green-600">Efectivas</p>
                  <p className="text-xl font-bold text-green-700">2</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-red-600">Alertas</p>
                  <p className="text-xl font-bold text-red-700">1</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
