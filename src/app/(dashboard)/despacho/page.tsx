import DespachoTableClient from '@/components/DespachoTableClient';
import UserProfile from '@/components/UserProfile';
import NotificationsBell from '@/components/NotificationsBell';

export default function DespachoPage() {
  return (
    <div className="space-y-6 relative pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Despacho</h1>
          <p className="text-sm text-slate-500 mt-1">Asignación y gestión de órdenes pendientes</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationsBell />
          <UserProfile />
        </div>
      </div>

      <DespachoTableClient />
    </div>
  );
}

