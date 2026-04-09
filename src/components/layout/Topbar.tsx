"use client";

import { useState } from "react";
import { Bell, Search, UserCircle, LogOut, User, Settings, ShieldCheck, Mail, Phone } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function Topbar() {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    { id: 1, title: "Novo Paciente", description: "Rafael C. acabou de se cadastrar.", time: "há 5 min", unread: true },
    { id: 2, title: "Consulta Confirmada", description: "Dr. Marcos: Paciente Maria às 14h.", time: "há 20 min", unread: true },
    { id: 3, title: "Pausa de Almoço", description: "Lembrete: Clínica fecha em 15 min.", time: "há 1h", unread: false },
  ];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-6 relative z-50">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pacientes, telefone, prontuários..."
            className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notificações */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className={`relative rounded-full p-2 transition-colors ${showNotifications ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            {notifications.some(n => n.unread) && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
            <Bell className="h-5 w-5" />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-3 border-b border-gray-50 mb-2">
                  <h3 className="text-sm font-bold text-gray-900">Notificações</h3>
                  <button className="text-[10px] uppercase tracking-wider font-bold text-primary hover:underline">Marcar todas como lidas</button>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer mb-1 relative border-l-4 ${n.unread ? 'border-primary bg-primary/5' : 'border-transparent'}`}>
                      <p className="text-xs font-bold text-gray-900">{n.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{n.description}</p>
                      <span className="text-[9px] text-gray-400 mt-1 block">{n.time}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full p-3 text-center text-xs font-semibold text-gray-500 hover:text-primary transition-colors border-t border-gray-50 mt-2">
                  Ver todas as notificações
                </button>
              </div>
            </>
          )}
        </div>
        
        <div className="h-6 w-px bg-border mx-2" />
        
        {/* Menu de Perfil */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-50 transition-all active:scale-95"
          >
            {session?.user?.image ? (
              <img src={session.user.image} alt="Perfil" className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-100" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="h-7 w-7 text-primary" />
              </div>
            )}
            <div className="hidden flex-col items-start sm:flex text-left mr-2">
              <span className="text-sm font-bold text-gray-800 leading-tight">
                {session?.user?.name || "Carregando..."}
              </span>
              <span className="text-[10px] font-medium text-primary shadow-sm px-1.5 py-0.5 bg-primary/5 rounded uppercase tracking-wider">
                {(session?.user as any)?.role === 'admin' ? 'Administrador' : 'Colaborador'}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3 bg-gray-50 rounded-xl mb-2">
                  <p className="text-xs font-medium text-gray-500">Logado como</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{session?.user?.email}</p>
                </div>
                
                <div className="space-y-1">
                  <Link 
                    href="/dashboard/profile" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Meu Perfil
                  </Link>
                  <Link 
                    href="/dashboard/settings" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Configurações
                  </Link>
                  {(session?.user as any)?.role === 'admin' && (
                    <Link 
                      href="/dashboard/settings?tab=team" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Gestão de Acessos
                    </Link>
                  )}
                </div>

                <div className="my-2 border-t border-gray-50" />
                
                <button 
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-semibold"
                >
                  <LogOut className="h-4 w-4" />
                  Sair do Sistema
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
