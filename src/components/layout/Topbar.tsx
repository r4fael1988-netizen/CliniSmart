import { Bell, Search, UserCircle } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pacientes, telefone, prontuários..."
            className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors">
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-red-500"></span>
          <Bell className="h-5 w-5" />
        </button>
        
        <div className="h-6 w-px bg-border" />
        
        <button className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors">
          <UserCircle className="h-8 w-8 text-gray-400" />
          <div className="hidden flex-col items-start sm:flex text-left mr-2">
            <span className="text-sm font-semibold text-gray-700">Dr. Administrador</span>
            <span className="text-xs text-muted-foreground">Clínica Master</span>
          </div>
        </button>
      </div>
    </header>
  );
}
