'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import UserProfile from '@/components/UserProfile';
import NotificationsBell from '@/components/NotificationsBell';
import { supabase } from '@/lib/supabase';
import type { PuntoTrayectoria } from '@/components/MapRecorridos';

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

// ── Tipos ────────────────────────────────────────────────────────────────
interface Tecnico {
  id_usuario: string;
  nombre: string;
}

interface ResumenItem {
  id_contrato: string;
  tiempo_en_sitio_minutos: number;
  hora_cierre: string;
}

interface ResumenData {
  cierres: ResumenItem[];
  ultima_sincronizacion?: string;
  total_ordenes_cerradas?: number;
}

interface RutaDiaria {
  tecnico_id: string;
  fecha: string;
  trayectoria: PuntoTrayectoria[];
  resumen: ResumenData;
  cierres: ResumenItem[];  // extraído de resumen.cierres
  estado: string;
}

// ── TimelineItem ─────────────────────────────────────────────────────────
function TimelineItem({
  time,
  title,
  detail,
  color,
  ring,
  badge,
  isLast,
}: {
  time: string;
  title: string;
  detail: string;
  color: string;
  ring: string;
  badge?: string;
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
        {badge && (
          <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
            ⏱ {badge}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────
function formatHora(hora: string): string {
  try {
    // Si ya viene en formato legible, retornar tal cual
    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(hora)) return hora;

    // Si viene como HH:mm:ss o ISO, formatear
    const date = new Date(`1970-01-01T${hora}`);
    if (isNaN(date.getTime())) return hora;

    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return hora;
  }
}

// ── Page Component ───────────────────────────────────────────────────────
export default function TrazabilidadPage() {
  const today = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(today);
  const [tecnicoId, setTecnicoId] = useState('');
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [ruta, setRuta] = useState<RutaDiaria | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // ── Cargar técnicos al montar ──────────────────────────────────────────
  useEffect(() => {
    async function fetchTecnicos() {
      const { data, error } = await supabase
        .from('perfiles')
        .select('id_usuario, nombre')
        .eq('rol', 'Técnico')
        .order('nombre');

      if (!error && data && data.length > 0) {
        setTecnicos(data);
        setTecnicoId(data[0].id_usuario);
      }
    }
    fetchTecnicos();
  }, []);

  // ── Buscar recorrido ──────────────────────────────────────────────────
  const buscarRecorrido = useCallback(async () => {
    if (!tecnicoId || !fecha) return;

    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from('rutas_diarias')
      .select('*')
      .eq('tecnico_id', tecnicoId)
      .eq('fecha', fecha)
      .maybeSingle();

    if (!error && data) {
      const raw = data as any;

      const trayectoria = typeof raw.trayectoria === 'string'
        ? JSON.parse(raw.trayectoria)
        : (raw.trayectoria ?? []);

      const resumenRaw = typeof raw.resumen === 'string'
        ? JSON.parse(raw.resumen)
        : (raw.resumen ?? {});

      // Compatibilidad: si es array directo (formato anterior) o .cierres
      const cierres = Array.isArray(resumenRaw)
        ? resumenRaw
        : (resumenRaw.cierres ?? []);

      setRuta({
        ...raw,
        trayectoria: Array.isArray(trayectoria) ? trayectoria : [],
        resumen: resumenRaw,
        cierres: Array.isArray(cierres) ? cierres : [],
      } as RutaDiaria);
    } else {
      setRuta(null);
    }

    setLoading(false);
  }, [tecnicoId, fecha]);

  // ── Derivar eventos de bitácora desde cierres[] ────────────────────────
  const cierresArr = Array.isArray(ruta?.cierres) ? ruta.cierres : [];
  const bitacoraEvents = cierresArr.map((item) => ({
    time: formatHora(item.hora_cierre),
    title: `Contrato: ${item.id_contrato}`,
    detail: `Cierre registrado`,
    color: 'bg-blue-600',
    ring: 'ring-blue-100',
    badge: `${item.tiempo_en_sitio_minutos} min en sitio`,
  }));

  const tecnicoNombre = tecnicos.find((t) => t.id_usuario === tecnicoId)?.nombre ?? '';

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
            value={tecnicoId}
            onChange={(e) => setTecnicoId(e.target.value)}
          >
            {tecnicos.length === 0 && (
              <option value="">Cargando técnicos…</option>
            )}
            {tecnicos.map((t) => (
              <option key={t.id_usuario} value={t.id_usuario}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
        <button
          className="px-6 py-2.5 rounded-lg font-medium text-white text-sm shadow-sm transition-all hover:opacity-90 active:scale-[0.97] flex items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: '#1A3A6B' }}
          onClick={buscarRecorrido}
          disabled={loading || !tecnicoId}
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
          Buscar Recorrido
        </button>
      </div>

      {/* ── Grid: Mapa + Bitácora ──────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">
        {/* Mapa */}
        <div className="col-span-12 xl:col-span-8">
          <MapRecorridos trayectoria={ruta?.trayectoria} />
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

            {/* Estado vacío */}
            {searched && !loading && !ruta && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-sm font-medium text-slate-500">
                  Sin recorrido registrado para esta fecha
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {tecnicoNombre} — {fecha}
                </p>
              </div>
            )}

            {/* Estado inicial (antes de buscar) */}
            {!searched && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm font-medium text-slate-500">
                  Selecciona un técnico y fecha
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Presiona &quot;Buscar Recorrido&quot; para consultar
                </p>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <svg className="w-10 h-10 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-slate-400 mt-3">Consultando…</p>
              </div>
            )}

            {/* Eventos de bitácora reales */}
            {!loading && ruta && bitacoraEvents.length > 0 && (
              <div>
                {bitacoraEvents.map((evt, i) => (
                  <TimelineItem
                    key={i}
                    time={evt.time}
                    title={evt.title}
                    detail={evt.detail}
                    color={evt.color}
                    ring={evt.ring}
                    badge={evt.badge}
                    isLast={i === bitacoraEvents.length - 1}
                  />
                ))}
              </div>
            )}

            {/* Sin cierres pero sí hay ruta */}
            {!loading && ruta && bitacoraEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm font-medium text-slate-500">
                  Recorrido registrado, sin cierres de contrato
                </p>
              </div>
            )}

            {/* Resumen */}
            {!loading && ruta && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500">Contratos visitados</p>
                    <p className="text-xl font-bold text-slate-800">
                      {ruta.cierres?.length ?? 0}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500">Puntos GPS</p>
                    <p className="text-xl font-bold text-slate-800">
                      {ruta.trayectoria?.length ?? 0}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center col-span-2">
                    <p className="text-xs text-green-600">Tiempo total en sitio</p>
                    <p className="text-xl font-bold text-green-700">
                      {(ruta.cierres ?? []).reduce((a, c) => a + (c.tiempo_en_sitio_minutos || 0), 0)} min
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
