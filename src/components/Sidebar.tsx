'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Derive display name and initials from user
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full flex-shrink-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C11.5 2 11 2.4 10.8 2.9C10.2 4.3 9 5.7 8.2 6.9C7.1 8.5 6 10 6 12C6 15.3 8.7 18 12 18S18 15.3 18 12C18 10 16.9 8.5 15.8 6.9C15 5.7 13.8 4.3 13.2 2.9C13 2.4 12.5 2 12 2ZM12 16C9.8 16 8 14.2 8 12C8 10.5 8.8 9.3 9.7 8C10.3 7 11.2 5.8 11.8 4.7C12.4 5.8 13.3 7 13.9 8C14.8 9.3 15.6 10.5 15.6 12C15.6 14.2 13.8 16 11.6 16H12Z"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide leading-none">Reportes S.A</h1>
            <p className="text-xs text-slate-400 mt-1">Sistema de Gestión</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        <Link 
          href="/" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
            pathname === '/' 
              ? 'bg-blue-600 text-white' 
              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <svg className={`w-5 h-5 ${pathname === '/' ? 'opacity-100' : 'opacity-70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          Dashboard
        </Link>
        <Link 
          href="/despacho" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
            pathname === '/despacho' 
              ? 'bg-blue-600 text-white' 
              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <svg className={`w-5 h-5 ${pathname === '/despacho' ? 'opacity-100' : 'opacity-70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          Panel de Despacho
        </Link>
        <Link 
          href="/auditoria" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
            pathname === '/auditoria' 
              ? 'bg-blue-600 text-white' 
              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <svg className={`w-5 h-5 ${pathname === '/auditoria' ? 'opacity-100' : 'opacity-70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Auditoría y Soportes
        </Link>
      </nav>
      <div className="border-t border-slate-800 p-4 space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">{initial}</div>
            <div>
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-slate-400">Administrador</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-slate-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-2 text-slate-400 hover:text-white transition-colors w-full text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
