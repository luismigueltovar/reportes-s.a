'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import UploadExcelButton from '@/components/UploadExcelButton';
import UserProfile from '@/components/UserProfile';
import NotificationsBell from '@/components/NotificationsBell';
type Orden = {
  orden_trabajo: string;
  contrato: string;
  direccion: string;
  barrio?: string;
  localidad: string;
  descripcion_del_trabajo?: string;
  estado: string;
  id_tecnico_asignado?: string;
  fecha_asignacion_ot?: string;
  observacion_solicitud?: string;
  [key: string]: unknown; // por si hay más campos
};

type Tecnico = {
  id_usuario: string;
  nombre: string;
};

const calcularDiasSLA = (fecha_asignacion_ot?: string) => {
  if (!fecha_asignacion_ot) return 0;
  const asignacion = new Date(fecha_asignacion_ot);
  const now = new Date();
  const diffTime = now.getTime() - asignacion.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays); // evitar negativos si la fecha es futura
};

export default function DespachoTableClient() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loadingOrdenes, setLoadingOrdenes] = useState(true);
  const [errorOrdenes, setErrorOrdenes] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [localidadFilter, setLocalidadFilter] = useState('Todas');
  const [descripcionFilter, setDescripcionFilter] = useState('Todas las Descripciones');
  const [fechaFilter, setFechaFilter] = useState('Todas');
  const [tecnicoFilter, setTecnicoFilter] = useState('Todos');
  const [selectedOrdenes, setSelectedOrdenes] = useState<string[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [selectedTecnicoId, setSelectedTecnicoId] = useState('');
  const [lastUpdateDate, setLastUpdateDate] = useState<string | null>(null);

  // Fetch órdenes pendientes desde Supabase
  const fetchOrdenes = useCallback(async () => {
    setLoadingOrdenes(true);
    setErrorOrdenes(null);
    const { data, error } = await supabase
      .from('ordenes')
      .select('*')
      .eq('estado', 'Pendiente')
      .order('fecha_asignacion_ot', { ascending: false });

    const { data: updateData, error: updateError } = await supabase
      .from('ordenes')
      .select('fecha_asignacion_ot')
      .order('fecha_asignacion_ot', { ascending: false })
      .limit(1);
      
    if (!updateError && updateData && updateData.length > 0) {
      const fechaStr = updateData[0].fecha_asignacion_ot;
      if (fechaStr) {
        const fecha = new Date(fechaStr);
        setLastUpdateDate(fecha.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }));
      }
    }

    if (error) {
      console.error('Error al cargar órdenes:', error);
      setErrorOrdenes('No se pudieron cargar las órdenes.');
    } else {
      setOrdenes(data || []);
    }
    setLoadingOrdenes(false);
  }, []);

  useEffect(() => {
    fetchOrdenes();
  }, [fetchOrdenes]);

  // Fetch real technicians from perfiles table
  useEffect(() => {
    const fetchTecnicos = async () => {
      const { data, error } = await supabase
        .from('perfiles')
        .select('id_usuario, nombre')
        .eq('rol', 'Técnico')
        .order('nombre', { ascending: true });

      if (!error && data) {
        setTecnicos(data);
      }
    };
    fetchTecnicos();
  }, []);

  // Extraer opciones únicas para los selectores
  const localidadesUnicas = useMemo(() => {
    const locs = ordenes.map(o => o.localidad).filter(Boolean);
    return Array.from(new Set(locs)).sort();
  }, [ordenes]);

  const descripcionesUnicas = useMemo(() => {
    const desc = ordenes.map(o => o.descripcion_del_trabajo).filter(Boolean);
    return Array.from(new Set(desc)).sort();
  }, [ordenes]);

  // Derive unique technician IDs from orders (for display fallback in table)
  const tecnicosEnOrdenes = useMemo(() => {
    const techs = ordenes.map(o => o.id_tecnico_asignado).filter(Boolean);
    return Array.from(new Set(techs)).sort();
  }, [ordenes]);

  // Helper: get technician name by id_usuario
  const getTecnicoNombre = (idUsuario?: string): string | null => {
    if (!idUsuario) return null;
    const found = tecnicos.find(t => t.id_usuario === idUsuario);
    return found ? found.nombre : null;
  };

  // Filtrado reactivo en memoria
  const filteredData = useMemo(() => {
    return ordenes.filter(row => {
      // 1. Filtro por Búsqueda (contrato, orden_trabajo, direccion, barrio)
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        (row.contrato && row.contrato.toLowerCase().includes(term)) ||
        (row.orden_trabajo && row.orden_trabajo.toLowerCase().includes(term)) ||
        (row.direccion && row.direccion.toLowerCase().includes(term)) ||
        (row.barrio && row.barrio.toLowerCase().includes(term));

      // 2. Filtro por Localidad
      const matchesLocalidad = localidadFilter === 'Todas' || row.localidad === localidadFilter;

      // 3. Filtro por Descripción del Trabajo
      const matchesDescripcion = descripcionFilter === 'Todas las Descripciones' || row.descripcion_del_trabajo === descripcionFilter;

      // 4. Filtro por Fecha (SLA)
      const daysSLA = calcularDiasSLA(row.fecha_asignacion_ot);
      let matchesFecha = true;
      if (fechaFilter === 'Hoy') {
        matchesFecha = daysSLA === 0;
      } else if (fechaFilter === 'Últimos 3 días') {
        matchesFecha = daysSLA <= 3;
      } else if (fechaFilter === 'Vencidas') {
        matchesFecha = daysSLA > 2; // Asumiendo SLA de 48h
      }

      // 5. Filtro por Técnico
      const matchesTecnico =
        tecnicoFilter === 'Todos' ||
        (tecnicoFilter === 'Sin asignar' && !row.id_tecnico_asignado) ||
        row.id_tecnico_asignado === tecnicoFilter;

      return matchesSearch && matchesLocalidad && matchesDescripcion && matchesFecha && matchesTecnico;
    }).sort((a, b) => {
      const diasA = calcularDiasSLA(a.fecha_asignacion_ot);
      const diasB = calcularDiasSLA(b.fecha_asignacion_ot);
      return diasB - diasA; // descendente (mayor SLA primero)
    });
  }, [ordenes, searchTerm, localidadFilter, descripcionFilter, fechaFilter, tecnicoFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const visibleIds = filteredData.map(o => o.orden_trabajo);
      const newSelected = new Set([...selectedOrdenes, ...visibleIds]);
      setSelectedOrdenes(Array.from(newSelected));
    } else {
      const visibleIds = new Set(filteredData.map(o => o.orden_trabajo));
      setSelectedOrdenes(selectedOrdenes.filter(id => !visibleIds.has(id)));
    }
  };

  const handleSelectOne = (orden_trabajo: string, checked: boolean) => {
    if (checked) {
      setSelectedOrdenes([...selectedOrdenes, orden_trabajo]);
    } else {
      setSelectedOrdenes(selectedOrdenes.filter(id => id !== orden_trabajo));
    }
  };

  const [isAssigning, setIsAssigning] = useState(false);

  const handleAsignarBloque = async () => {
    if (!selectedTecnicoId || selectedOrdenes.length === 0) return;
    setIsAssigning(true);

    try {
      const { error } = await supabase
        .from('ordenes')
        .update({ id_tecnico_asignado: selectedTecnicoId })
        .in('orden_trabajo', selectedOrdenes);

      if (error) {
        console.error('Error al asignar órdenes:', error);
        alert('Hubo un error al asignar las órdenes.');
      } else {
        alert('Órdenes asignadas exitosamente.');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('Hubo un error inesperado al asignar.');
    } finally {
      setIsAssigning(false);
    }
  };

  const isAllVisibleSelected = filteredData.length > 0 && filteredData.every(o => selectedOrdenes.includes(o.orden_trabajo));

  if (loadingOrdenes) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p className="text-sm text-gray-500">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  if (errorOrdenes) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
        {errorOrdenes}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Despacho</h1>
          <p className="text-sm text-slate-500 mt-1">Asignación y gestión de órdenes pendientes</p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdateDate && <span className="text-sm font-medium text-gray-500 hidden md:block">Última actualización: {lastUpdateDate}</span>}
          <UploadExcelButton onUploadSuccess={fetchOrdenes} />
          <NotificationsBell />
          <UserProfile />
        </div>
      </div>
      {/* Controles de Filtros */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-xl">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Buscar por Contrato, Orden, Dirección o Barrio..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={localidadFilter}
          onChange={(e) => setLocalidadFilter(e.target.value)}
        >
          <option value="Todas">Todas las Localidades</option>
          {localidadesUnicas.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <select
          className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[250px] truncate"
          value={descripcionFilter}
          onChange={(e) => setDescripcionFilter(e.target.value)}
        >
          <option value="Todas las Descripciones">Todas las Descripciones</option>
          {descripcionesUnicas.map(desc => (
            <option key={desc} value={desc}>{desc}</option>
          ))}
        </select>
        <select
          className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
          value={fechaFilter}
          onChange={(e) => setFechaFilter(e.target.value)}
        >
          <option value="Todas">Todas las fechas</option>
          <option value="Hoy">Hoy (0 días)</option>
          <option value="Últimos 3 días">Últimos 3 días</option>
          <option value="Vencidas">Vencidas {'>'} 48h</option>
        </select>
        <select
          className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
          value={tecnicoFilter}
          onChange={(e) => setTecnicoFilter(e.target.value)}
        >
          <option value="Todos">Todos los Técnicos</option>
          <option value="Sin asignar">Sin asignar</option>
          {tecnicos.map(tech => (
            <option key={tech.id_usuario} value={tech.id_usuario}>{tech.nombre}</option>
          ))}
        </select>
      </div>

      {/* Tabla de Despacho */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-6 mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="py-3 px-4">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={isAllVisibleSelected}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="py-3 px-4">Orden</th>
                <th className="py-3 px-4">Contrato</th>
                <th className="py-3 px-4">Dirección</th>
                <th className="py-3 px-4">Barrio</th>
                <th className="py-3 px-4">Localidad</th>
                <th className="py-3 px-4">Descripción del Trabajo</th>
                <th className="py-3 px-4">Días / SLA</th>
                <th className="py-3 px-4">Técnico Asignado</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    No se encontraron órdenes que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.orden_trabajo} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedOrdenes.includes(row.orden_trabajo)}
                        onChange={(e) => handleSelectOne(row.orden_trabajo, e.target.checked)}
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{row.orden_trabajo}</td>
                    <td className="py-3 px-4">{row.contrato}</td>
                    <td className="py-3 px-4">{row.direccion}</td>
                    <td className="py-3 px-4">{row.barrio || '-'}</td>
                    <td className="py-3 px-4">{row.localidad}</td>
                    <td className="py-3 px-4 text-xs text-gray-500 whitespace-normal break-words min-w-[200px]" title={row.descripcion_del_trabajo || ''}>
                      {row.descripcion_del_trabajo || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {(() => {
                        const daysSLA = calcularDiasSLA(row.fecha_asignacion_ot);
                        const slaColor = daysSLA <= 1 ? 'bg-green-100 text-green-800' : daysSLA === 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                        return (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${slaColor}`}>
                            {daysSLA} {daysSLA === 1 ? 'día' : 'días'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {(() => {
                        const nombre = getTecnicoNombre(row.id_tecnico_asignado as string);
                        return nombre ? (
                          <p className="text-gray-900 font-medium">{nombre}</p>
                        ) : (
                          <p className="text-gray-400 text-sm italic">Sin asignar</p>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de filtrado */}
      <div className="mt-4 text-sm text-gray-500 px-2">
        Mostrando {filteredData.length} de {ordenes.length} órdenes pendientes
      </div>

      {/* Panel flotante de asignación masiva */}
      {selectedOrdenes.length > 0 && (
        <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                {selectedOrdenes.length}
              </span>
              <span className="text-sm font-medium text-gray-700">Órdenes seleccionadas</span>
            </div>
            <div className="text-sm text-gray-500 border-l border-gray-300 pl-4 hidden md:block">
              Selección múltiple
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select
              className="border border-gray-300 rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500 text-sm"
              value={selectedTecnicoId}
              onChange={(e) => setSelectedTecnicoId(e.target.value)}
            >
              <option value="">Seleccionar técnico para bloque...</option>
              {tecnicos.map(tech => (
                <option key={tech.id_usuario} value={tech.id_usuario}>{tech.nombre}</option>
              ))}
            </select>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition shadow-sm text-sm disabled:opacity-50"
              onClick={handleAsignarBloque}
              disabled={isAssigning || !selectedTecnicoId}
            >
              {isAssigning ? 'Asignando...' : 'Asignar órdenes en bloque'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

