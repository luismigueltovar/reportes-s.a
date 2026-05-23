import { supabase } from '@/lib/supabase';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  // Fetch real data
  const { data: ordenes, error: errOrdenes } = await supabase.from('ordenes').select('*');
  const { data: perfiles, error: errPerfiles } = await supabase.from('perfiles').select('id_usuario, nombre').eq('rol', 'Técnico');

  const data = ordenes || [];
  const perfs = perfiles || [];

  return (
    <DashboardClient initialOrdenes={data} perfiles={perfs} error={errOrdenes || errPerfiles} />
  );
}
