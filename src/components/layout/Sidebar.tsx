import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  ListTodo, 
  Users, 
  Calendar, 
  Settings,
  Activity,
  LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Conversas", href: "/dashboard/conversations", icon: MessageSquare },
  { name: "Kanban", href: "/dashboard/kanban", icon: ListTodo },
  { name: "Pacientes", href: "/dashboard/patients", icon: Users },
  { name: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-border">
      {/* Logo Area */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">CliniSmart</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-primary-light/50 text-primary"
                  : "text-muted-foreground hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                  isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-500"
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area / Status */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-4 px-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-gray-700">WhatsApp Online</span>
        </div>
        
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
}
