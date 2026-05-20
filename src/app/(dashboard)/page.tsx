import { supabase } from '@/lib/supabase';
import UploadExcelButton from '@/components/UploadExcelButton';
import UserProfile from '@/components/UserProfile';

export default async function DashboardPage() {
  // Fetch real data
  const { data: ordenes, error } = await supabase.from('ordenes').select('*');
  const data = ordenes || [];

  // Cálculos totales
  const totalOrdenes = data.length;
  const pendientes = data.filter(o => o.estado === 'Pendiente').length;
  const finalizadas = data.filter(o => o.estado === 'Efectiva' || o.estado === 'Cancelada').length;

  const pendientesPct = totalOrdenes ? ((pendientes / totalOrdenes) * 100).toFixed(1) : 0;
  const finalizadasPct = totalOrdenes ? ((finalizadas / totalOrdenes) * 100).toFixed(1) : 0;

  // Agrupar por Localidad
  const locMap = data.reduce((acc, curr) => {
    const loc = curr.localidad || 'SIN LOCALIDAD';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const localidades = Object.keys(locMap)
    .map(loc => ({
      loc,
      val: locMap[loc],
      pct: totalOrdenes ? ((locMap[loc] / totalOrdenes) * 100).toFixed(1) + '%' : '0%',
      // Colores dinámicos simples basados en el índice
      color: 'blue', 
      colorHex: 'bg-blue-600'
    }))
    .sort((a, b) => b.val - a.val); // Ordenar por mayor cantidad

  // Colores para localidades
  const colors = [
    { color: 'blue', colorHex: 'bg-blue-600' },
    { color: 'purple', colorHex: 'bg-purple-600' },
    { color: 'pink', colorHex: 'bg-pink-500' },
    { color: 'rose', colorHex: 'bg-rose-500' },
    { color: 'orange', colorHex: 'bg-orange-500' },
    { color: 'teal', colorHex: 'bg-teal-500' },
  ];
  localidades.forEach((l, i) => {
    l.color = colors[i % colors.length].color;
    l.colorHex = colors[i % colors.length].colorHex;
  });

  // Agrupar por Técnico (Carga por Técnico)
  const techMap = data.reduce((acc, curr) => {
    const tech = curr.id_tecnico || 'Sin asignar';
    acc[tech] = (acc[tech] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxCarga = Math.max(...(Object.values(techMap) as number[]), 15); // Evitar dividir por 0

  const tecnicos = Object.keys(techMap)
    .map(tech => {
      // Intentar extraer iniciales si es un nombre, si no las primeras letras
      const parts = tech.split(' ');
      const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : tech.substring(0, 2).toUpperCase();
      return {
        initials,
        name: tech,
        val: techMap[tech],
        bg: tech === 'Sin asignar' ? 'bg-gray-400' : 'bg-blue-600',
        max: maxCarga
      };
    })
    .sort((a, b) => b.val - a.val);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Visión global del sistema de órdenes</p>
        </div>
        <div className="flex items-center gap-4">
          <UploadExcelButton />
          <button className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {/* Badge numérico temporal para notificaciones */}
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">3</span>
          </button>
          <UserProfile />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          No se pudieron cargar los datos del Dashboard.
        </div>
      )}

      {/* Tarjetas de Conteo Total */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center">
          <div className="flex-shrink-0 mr-4 p-3 rounded-full bg-blue-50 text-blue-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">Órdenes Totales</span>
            <span className="text-4xl font-bold text-gray-900 mt-1">{totalOrdenes}</span>
            <span className="text-xs text-gray-400 mt-1">100% del total</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center">
          <div className="flex-shrink-0 mr-4 p-3 rounded-full bg-orange-50 text-orange-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">Pendientes</span>
            <span className="text-4xl font-bold text-gray-900 mt-1">{pendientes}</span>
            <span className="text-xs text-gray-400 mt-1">{pendientesPct}% del total</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center">
          <div className="flex-shrink-0 mr-4 p-3 rounded-full bg-green-50 text-green-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">Finalizadas</span>
            <span className="text-4xl font-bold text-gray-900 mt-1">{finalizadas}</span>
            <span className="text-xs text-gray-400 mt-1">{finalizadasPct}% del total</span>
          </div>
        </div>
      </div>

      {/* Tarjetas de Localidad */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <h2 className="text-lg font-semibold text-slate-800">Órdenes por Localidad</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {localidades.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay datos para mostrar.</p>
          ) : (
            localidades.map((item) => (
              <div key={item.loc} className="p-5 bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(6,81,237,0.08)] relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-bold text-slate-800 truncate pr-2" title={item.loc}>{item.loc}</p>
                  <div className={`w-8 h-8 rounded-lg bg-${item.color}-50 flex items-center justify-center text-${item.color}-500 shrink-0`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-0.5">{item.val}</p>
                <p className="text-[11px] text-slate-400 mb-4">órdenes</p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                  <div className={`${item.colorHex} h-1.5 rounded-full`} style={{ width: item.pct }}></div>
                </div>
                <p className="text-[10px] text-slate-500">{item.pct} del total</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Monitor de Fuerza Laboral */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          <h2 className="text-lg font-semibold text-slate-800">Carga por Técnico</h2>
        </div>
        <div className="space-y-6">
          {tecnicos.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay técnicos asignados.</p>
          ) : (
            tecnicos.map((tech) => {
              const pct = (tech.val / tech.max) * 100;
              return (
                <div key={tech.name} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full ${tech.bg} flex items-center justify-center text-white text-xs font-medium shrink-0`}>
                    {tech.initials}
                  </div>
                  <div className="w-40 shrink-0">
                    <span className="text-[13px] font-medium text-slate-700 truncate block" title={tech.name}>{tech.name}</span>
                  </div>
                  <div className="flex-1 max-w-2xl">
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                  <div className="w-24 text-right shrink-0">
                    <span className="text-sm font-bold text-slate-800">{tech.val} </span>
                    <span className="text-xs text-slate-500">órdenes</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
