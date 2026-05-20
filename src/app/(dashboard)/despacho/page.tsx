import { supabase } from '@/lib/supabase';
import DespachoTableClient from '@/components/DespachoTableClient';
import UserProfile from '@/components/UserProfile';

export default async function DespachoPage() {
  // Realizamos la consulta a Supabase en el servidor
  const { data: ordenes, error } = await supabase
    .from('ordenes')
    .select('*')
    .order('fecha_asignacion', { ascending: false });

  const data = ordenes || [];

  return (
    <div className="space-y-6 relative pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Despacho</h1>
          <p className="text-sm text-slate-500 mt-1">Asignación y gestión de órdenes activas</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {/* Badge numérico temporal para notificaciones */}
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">3</span>
          </button>
          <UserProfile />
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          No se pudieron cargar las órdenes en este momento. Verificando conexión...
        </div>
      ) : (
        <DespachoTableClient initialData={data} />
      )}


    </div>
  );
}
