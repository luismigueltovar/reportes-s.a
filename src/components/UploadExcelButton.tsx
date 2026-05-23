"use client";
import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

// Helper to handle Excel dates
const parseExcelDate = (excelDate: string | number | undefined | null) => {
  if (!excelDate) return null;
  // If it's a number, it's an Excel serial date
  if (typeof excelDate === 'number') {
    // Excel epoch is 1899-12-30
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    return date.toISOString();
  }
  // Try to parse string
  const date = new Date(excelDate);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }
  return null;
};

// Helper to normalize Localidad
const normalizeLocalidad = (rawLocalidad: string) => {
  if (!rawLocalidad) return '';
  // Extraer el texto dentro del último par de paréntesis
  const match = rawLocalidad.match(/\(([^)]+)\)[^(]*$/);
  let normalized = match ? match[1].trim().toUpperCase() : rawLocalidad.trim().toUpperCase();
  // Unificar variantes conocidas
  if (normalized === 'SANTIAGO DE CALI') normalized = 'CALI';
  return normalized;
};

export default function UploadExcelButton() {
  const [loading, setLoading] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Cargar el último timestamp guardado asíncronamente para evitar error de linting
    const saved = localStorage.getItem('lastUploadTimestamp');
    if (saved) {
      setTimeout(() => setLastUpload(saved), 0);
    }
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    toast.loading('Procesando datos...', { id: 'excel-upload' });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet, { defval: '' });

      // Validar que hay datos
      if (jsonData.length === 0) {
        throw new Error('El archivo Excel está vacío.');
      }

      // Mapeo inicial
      const formattedData = jsonData
        .filter(row => !!row['ORDEN TRABAJO']) // Ignorar filas sin orden de trabajo
        .map(row => ({
          orden_trabajo: String(row['ORDEN TRABAJO']).trim(),
          contrato: String(row['CONTRATO'] || '').trim(),
          direccion: String(row['DIRECCION'] || '').trim(),
          barrio: String(row['BARRIO'] || row['SECTOR OPERATIVO'] || '').trim(),
          localidad: normalizeLocalidad(String(row['LOCALIDAD'] || '')),
          descripcion_del_trabajo: String(row['DESCRIPCIÓN DEL TRABAJO'] || row['DESCRIPCION DEL TRABAJO'] || row['DESCRIPCION_DEL_TRABAJO'] || row['TIPO TRABAJO'] || '').trim(),
          fecha_asignacion_ot: parseExcelDate(row['FECHA_ASIGNACION_OT'] || row['FECHA ASIGNACION']),
          observacion_solicitud: String(row['OBSERVACIÓN SOLICITUD'] || row['OBSERVACION SOLICITUD'] || row['OBSERVACION'] || row['OBSERVACION_SOLICITUD'] || '').trim(),
          estado: 'Pendiente',
          id_tecnico_asignado: null,
        }));

      if (formattedData.length === 0) {
        throw new Error('No se encontraron órdenes válidas en el archivo.');
      }

      // 1. Obtener órdenes existentes para no sobrescribir técnicos ni estado
      const ordenesIds = formattedData.map(o => o.orden_trabajo);

      // Consultamos en lotes si son demasiadas, pero Supabase soporta in() con miles de ids
      const { data: existingOrders, error: fetchError } = await supabase
        .from('ordenes')
        .select('orden_trabajo, id_tecnico_asignado, estado')
        .in('orden_trabajo', ordenesIds);

      if (fetchError) throw fetchError;

      const existingMap = new Map();
      existingOrders?.forEach(o => existingMap.set(o.orden_trabajo, o));

      // 2. Combinar datos
      const finalDataToUpsert = formattedData.map(order => {
        const existing = existingMap.get(order.orden_trabajo);
        if (existing) {
          return {
            ...order,
            id_tecnico_asignado: existing.id_tecnico_asignado, // Preservar técnico
            estado: existing.estado,                           // Preservar estado actual
          };
        }
        return order;
      });

      // 3. Upsert
      const { error: upsertError } = await supabase
        .from('ordenes')
        .upsert(finalDataToUpsert, { onConflict: 'orden_trabajo' });

      if (upsertError) throw upsertError;

      const newTimestamp = new Date().toLocaleString();
      localStorage.setItem('lastUploadTimestamp', newTimestamp);
      setLastUpload(newTimestamp);

      toast.success(`Archivo procesado: ${finalDataToUpsert.length} órdenes cargadas`, { id: 'excel-upload' });

      // Refrescar los componentes de servidor de Next.js
      router.refresh();

    } catch (error: unknown) {
      console.error('Error procesando Excel:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudo procesar el archivo';
      toast.error(`Error: ${errorMessage}`, { id: 'excel-upload' });
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = ''; // Reset input file
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      {lastUpload && (
        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md hidden sm:block">
          Última carga: {lastUpload}
        </span>
      )}
      <input
        type="file"
        ref={inputRef}
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 shadow-sm whitespace-nowrap"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Subir Excel (Asignación)
          </>
        )}
      </button>
    </div>
  );
}
