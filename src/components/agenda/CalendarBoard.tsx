"use client";

import { useState, useMemo } from "react";
import { Calendar as BigCalendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pt-br";
import { X, User, UserCheck, Stethoscope, Clock, Check, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { createAppointment } from "@/app/dashboard/agenda/actions";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/app/calendar.css";

moment.locale("pt-br");
const localizer = momentLocalizer(moment);

interface CalendarBoardProps {
  initialEvents: any[];
  doctors: any[];
  patients: any[];
  services: any[];
}

export function CalendarBoard({ initialEvents, doctors, patients, services }: CalendarBoardProps) {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selection, setSelection] = useState({
    patientId: "",
    doctorId: "",
    serviceId: "",
    start: new Date(),
    notes: ""
  });

  const events = useMemo(() => initialEvents.map(e => ({
    ...e,
    start: new Date(e.start),
    end: new Date(e.end)
  })), [initialEvents]);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelection(prev => ({ ...prev, start, patientId: "", doctorId: "", serviceId: "", notes: "" }));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selection.patientId) return alert("Selecione um paciente");

    setIsSubmitting(true);
    const result = await createAppointment({
      patientId: selection.patientId,
      doctorId: selection.doctorId || undefined,
      serviceId: selection.serviceId || undefined,
      scheduledAt: selection.start,
      durationMinutes: 30, // Default for manual
      notes: selection.notes
    });

    if (result.success) {
      setIsModalOpen(false);
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const components = {
    event: (props: any) => (
      <div className="text-[10px] leading-tight p-0.5 h-full overflow-hidden flex flex-col justify-center">
        <div className="font-bold truncate">{props.event.patientName}</div>
        <div className="opacity-80 truncate">{props.event.doctorName}</div>
      </div>
    ),
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor = "#0EA5E9"; // Default
    if (event.specialty?.toLowerCase().includes("derm")) backgroundColor = "#3B82F6";
    if (event.specialty?.toLowerCase().includes("cardio")) backgroundColor = "#8B5CF6";
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.85,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="flex-1 min-h-[600px] relative">
      <BigCalendar
        localizer={localizer}
        events={events}
        view={view}
        date={date}
        onView={(v) => setView(v)}
        onNavigate={(d) => setDate(d)}
        selectable
        onSelectSlot={handleSelectSlot}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        eventPropGetter={eventStyleGetter}
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Lista"
        }}
        components={components}
        className="text-gray-600 font-sans custom-calendar"
      />

      {/* MODAL DE AGENDAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="bg-primary p-6 text-white relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Novo Agendamento</h3>
                  <p className="text-blue-100 text-sm">{format(selection.start, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Paciente */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User className="h-3 w-3" /> Paciente
                </label>
                <select 
                  required
                  value={selection.patientId}
                  onChange={(e) => setSelection({...selection, patientId: e.target.value})}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">Selecione o paciente...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {/* Médico */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Stethoscope className="h-3 w-3" /> Médico
                  </label>
                  <select 
                    value={selection.doctorId}
                    onChange={(e) => setSelection({...selection, doctorId: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="">Qualquer médico</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                  </select>
                </div>

                {/* Serviço */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Serviço / Procedimento
                  </label>
                  <select 
                    value={selection.serviceId}
                    onChange={(e) => setSelection({...selection, serviceId: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="">Selecione o serviço...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  Anotações Internas
                </label>
                <textarea 
                  value={selection.notes}
                  onChange={(e) => setSelection({...selection, notes: e.target.value})}
                  placeholder="Ex: Paciente com urgência, primeira vez na clínica."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm h-20 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4" />}
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to format date in the client component
function format(date: Date, formatStr: string, options: any) {
  return moment(date).format("dddd, DD [de] MMMM [às] HH:mm");
}
const ptBR = null;
