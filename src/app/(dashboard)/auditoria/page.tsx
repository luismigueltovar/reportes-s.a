import { supabase } from '@/lib/supabase';
import AuditoriaClient from '@/components/AuditoriaClient';

export default async function AuditoriaPage() {
  const { data: ordenes, error } = await supabase
    .from('ordenes')
    .select('*')
    .neq('estado', 'Pendiente')
    .order('fecha_asignacion', { ascending: false });

  return <AuditoriaClient initialData={ordenes || []} error={error} />;
}
