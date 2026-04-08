import { getAppointments, getDoctors, getPatients, getServices } from "./actions";
import { CalendarBoard } from "@/components/agenda/CalendarBoard";
import { Calendar as CalendarIcon, Filter, Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  // Busca todos os dados em paralelo no servidor
  const [appointments, doctors, patients, services] = await Promise.all([
    getAppointments(),
    getDoctors(),
    getPatients(),
    getServices()
  ]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            Agenda Geral
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie consultas reais marcadas pela IA e equipe.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            Filtrar Médicos
          </button>
        </div>
      </div>

      {/* Calendário Client-Side envelopado */}
      <div className="flex-1 rounded-xl border border-border bg-white shadow-sm overflow-hidden p-4">
        <CalendarBoard 
          initialEvents={JSON.parse(JSON.stringify(appointments))} 
          doctors={doctors}
          patients={patients}
          services={services}
        />
      </div>
    </div>
  );
}
