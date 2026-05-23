'use client';

import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import UserProfile from '@/components/UserProfile';
import { supabase } from '@/lib/supabase';

type Orden = {
  orden_trabajo: string;
  contrato: string;
  estado: string;
  id_tecnico_asignado?: string;
  fecha_asignacion_ot?: string;
  updated_at?: string;
  fecha_cierre?: string;
  direccion?: string;
  barrio?: string;
  [key: string]: any;
};

type Tecnico = {
  id_usuario: string;
  nombre: string;
};

export default function AuditoriaClient({ initialData, error }: { initialData: Orden[], error: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tecnicoFilter, setTecnicoFilter] = useState('Todos los Técnicos');
  const [estadoFilter, setEstadoFilter] = useState('Todos los Estados');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);

  useEffect(() => {
    const fetchTecnicos = async () => {
      const { data, error } = await supabase
        .from('perfiles')
        .select('id_usuario, nombre')
        .eq('rol', 'Técnico');
      if (!error && data) {
        setTecnicos(data);
      }
    };
    fetchTecnicos();
  }, []);

  const getTecnicoNombre = (id?: string) => {
    if (!id) return 'Sin asignar';
    const t = tecnicos.find(t => t.id_usuario === id);
    return t ? t.nombre : id;
  };

  const tecnicosUnicos = useMemo(() => {
    const techs = initialData.map(o => o.id_tecnico_asignado).filter(Boolean);
    return Array.from(new Set(techs)).sort().map(id => getTecnicoNombre(id));
  }, [initialData, tecnicos]);

  const filteredData = useMemo(() => {
    return initialData.filter(row => {
      if (row.estado !== 'Efectiva' && row.estado !== 'Cancelada') return false;

      const matchesEstadoFilter = estadoFilter === 'Todos los Estados' || row.estado === estadoFilter;

      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        (row.contrato && row.contrato.toLowerCase().includes(term)) ||
        (row.orden_trabajo && row.orden_trabajo.toLowerCase().includes(term));

      const techName = getTecnicoNombre(row.id_tecnico_asignado);
      const matchesTecnico = tecnicoFilter === 'Todos los Técnicos' || techName === tecnicoFilter;

      let matchesDate = true;
      if (row.fecha_cierre) {
        // Extraer solo la parte de fecha (YYYY-MM-DD) para comparar sin hora
        const fechaCierreDay = row.fecha_cierre.slice(0, 10);
        if (startDate && fechaCierreDay < startDate) matchesDate = false;
        if (endDate && fechaCierreDay > endDate) matchesDate = false;
      } else if (startDate || endDate) {
        // Si no tiene fecha_cierre y hay filtro activo, excluir la fila
        matchesDate = false;
      }

      return matchesEstadoFilter && matchesSearch && matchesTecnico && matchesDate;
    });
  }, [initialData, searchTerm, tecnicoFilter, estadoFilter, startDate, endDate, tecnicos]);

  const exportToExcel = () => {
    const exportData = filteredData.map(row => ({
      'Fecha Cierre': row.fecha_cierre ? new Date(row.fecha_cierre).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) : 'Sin fecha',
      'Nº Orden': row.orden_trabajo,
      'Contrato': row.contrato,
      'Dirección': row.direccion || '',
      'Barrio': row.barrio || '',
      'Estado': row.estado,
      'Técnico': getTecnicoNombre(row.id_tecnico_asignado)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditoría');
    XLSX.writeFile(workbook, 'Reporte_Auditoria.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Auditoría y Soportes</h1>
          <p className="text-sm text-slate-500 mt-1">Historial de órdenes cerradas y descarga de documentos</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg shadow-sm font-medium transition-colors flex items-center gap-2 text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Descargar Soportes (ZIP)
          </button>

          <button
            onClick={exportToExcel}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg shadow-sm font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Descargar Reporte (Excel)
          </button>

          <div className="h-8 w-px bg-gray-200"></div>

          <button className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">3</span>
          </button>
          <UserProfile />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-6">
          Error cargando las órdenes de auditoría.
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="relative flex-1 min-w-[280px] max-w-xl">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Buscar por Contrato o Nº Orden..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <input
            type="date"
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-700 w-40"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="relative">
          <input
            type="date"
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-700 w-40"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          value={tecnicoFilter}
          onChange={(e) => setTecnicoFilter(e.target.value)}
        >
          <option value="Todos los Técnicos">Todos los Técnicos</option>
          {tecnicosUnicos.map(tech => (
            <option key={tech} value={tech}>{tech}</option>
          ))}
        </select>
        <select
          className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
        >
          <option value="Todos los Estados">Todos los Estados</option>
          <option value="Efectiva">Efectiva</option>
          <option value="Cancelada">Cancelada</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="py-4 px-6">Fecha de Cierre</th>
                <th className="py-4 px-6">Nº Orden</th>
                <th className="py-4 px-6">Contrato</th>
                <th className="py-4 px-6">Dirección</th>
                <th className="py-4 px-6">Barrio</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6">Técnico</th>
                <th className="py-4 px-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-gray-500">
                    No hay órdenes en historial o que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                    <tr key={row.orden_trabajo} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-gray-900">
                        {row.fecha_cierre ? new Date(row.fecha_cierre).toLocaleString('es-CO', {
                          timeZone: 'America/Bogota',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : 'Sin fecha'}
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">{row.orden_trabajo}</td>
                      <td className="py-4 px-6 text-gray-500">{row.contrato}</td>
                      <td className="py-4 px-6 text-gray-500">{row.direccion || '-'}</td>
                      <td className="py-4 px-6 text-gray-500">{row.barrio || '-'}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${row.estado === 'Cancelada' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                          {row.estado}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{getTecnicoNombre(row.id_tecnico_asignado)}</td>
                      <td className="py-4 px-6">
                        <button className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Ver PDF
                        </button>
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
