'use client';

import React, { useState, useMemo } from 'react';

type Orden = {
  orden_trabajo: string;
  contrato: string;
  direccion: string;
  localidad: string;
  sector_operativo?: string;
  estado: string;
  id_tecnico: string;
  fecha_asignacion?: string;
  [key: string]: unknown; // por si hay más campos
};

const getDaysSLA = (fecha_asignacion?: string) => {
  if (!fecha_asignacion) return 0;
  const asignacion = new Date(fecha_asignacion);
  const now = new Date();
  const diffTime = now.getTime() - asignacion.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays); // evitar negativos si la fecha es futura
};

export default function DespachoTableClient({ initialData }: { initialData: Orden[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localidadFilter, setLocalidadFilter] = useState('Todas');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [fechaFilter, setFechaFilter] = useState('Todas');
  const [tecnicoFilter, setTecnicoFilter] = useState('Todos');
  const [selectedOrdenes, setSelectedOrdenes] = useState<string[]>([]);

  // Extraer opciones únicas para los selectores
  const localidadesUnicas = useMemo(() => {
    const locs = initialData.map(o => o.localidad).filter(Boolean);
    return Array.from(new Set(locs)).sort();
  }, [initialData]);

  const estadosUnicos = useMemo(() => {
    const ests = initialData.map(o => o.estado).filter(Boolean);
    return Array.from(new Set(ests)).sort();
  }, [initialData]);

  const tecnicosUnicos = useMemo(() => {
    const techs = initialData.map(o => o.id_tecnico).filter(Boolean);
    return Array.from(new Set(techs)).sort();
  }, [initialData]);

  // Filtrado reactivo en memoria
  const filteredData = useMemo(() => {
    return initialData.filter(row => {
      // 1. Filtro por Búsqueda (contrato, orden_trabajo, direccion, sector_operativo)
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        !term || 
        (row.contrato && row.contrato.toLowerCase().includes(term)) ||
        (row.orden_trabajo && row.orden_trabajo.toLowerCase().includes(term)) ||
        (row.direccion && row.direccion.toLowerCase().includes(term)) ||
        (row.sector_operativo && row.sector_operativo.toLowerCase().includes(term));

      // 2. Filtro por Localidad
      const matchesLocalidad = localidadFilter === 'Todas' || row.localidad === localidadFilter;

      // 3. Filtro por Estado
      const matchesEstado = estadoFilter === 'Todos' || row.estado === estadoFilter;

      // 4. Filtro por Fecha (SLA)
      const daysSLA = getDaysSLA(row.fecha_asignacion);
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
        (tecnicoFilter === 'Sin asignar' && !row.id_tecnico) ||
        row.id_tecnico === tecnicoFilter;

      return matchesSearch && matchesLocalidad && matchesEstado && matchesFecha && matchesTecnico;
    });
  }, [initialData, searchTerm, localidadFilter, estadoFilter, fechaFilter, tecnicoFilter]);

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

  const isAllVisibleSelected = filteredData.length > 0 && filteredData.every(o => selectedOrdenes.includes(o.orden_trabajo));

  return (
    <>
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
          className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
        >
          <option value="Todos">Todos los Estados</option>
          {estadosUnicos.map(est => (
            <option key={est} value={est}>{est}</option>
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
          {tecnicosUnicos.map(tech => (
            <option key={tech} value={tech}>{tech}</option>
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
                <th className="py-3 px-4">Estado</th>
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
                    <td className="py-3 px-4">{row.sector_operativo || '-'}</td>
                    <td className="py-3 px-4">{row.localidad}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${row.estado === 'Pendiente' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : row.estado === 'Cancelada' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {row.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const daysSLA = getDaysSLA(row.fecha_asignacion);
                        const slaColor = daysSLA <= 1 ? 'bg-green-100 text-green-800' : daysSLA === 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                        return (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${slaColor}`}>
                            {daysSLA} {daysSLA === 1 ? 'día' : 'días'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      {row.id_tecnico ? (
                        <p className="text-gray-900 font-medium">{row.id_tecnico}</p>
                      ) : (
                        <p className="text-gray-400 text-sm">Sin asignar</p>
                      )}
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
        Mostrando {filteredData.length} de {initialData.length} órdenes activas
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
            <select className="border border-gray-300 rounded px-4 py-2 bg-white focus:outline-none focus:border-blue-500 text-sm">
              <option value="">Seleccionar técnico para bloque...</option>
              {tecnicosUnicos.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition shadow-sm text-sm">
              Asignar órdenes en bloque
            </button>
          </div>
        </div>
      )}
    </>
  );
}
