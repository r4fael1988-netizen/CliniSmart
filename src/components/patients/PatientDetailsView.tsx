"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Calendar, Phone, Mail, MoreVertical, Send, Bot, User, Clock, Loader2 } from "lucide-react";
import { sendMessage, updatePatientNotes } from "@/app/dashboard/patients/actions";
import { createAppointment } from "@/app/dashboard/agenda/actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, Check, Stethoscope, UserCheck } from "lucide-react";

export function PatientDetailsView({ 
  patient, 
  doctors = [], 
  services = [] 
}: { 
  patient: any;
  doctors?: any[];
  services?: any[];
}) {
  const [activeTab, setActiveTab] = useState("resumo");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [notes, setNotes] = useState(patient.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  // Modal Agendamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selection, setSelection] = useState({
    doctorId: "",
    serviceId: "",
    start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: ""
  });
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === "conversa") {
      scrollToBottom();
    }
  }, [activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    const result = await sendMessage(patient.id, message);
    
    if (result.success) {
      setMessage("");
      // Como usamos revalidatePath, a página vai atualizar os dados via server-side
      // Mas para uma experiência instantânea, poderíamos dar push local.
    } else {
      alert(result.error);
    }
    setIsSending(false);
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await updatePatientNotes(patient.id, notes);
    setIsSavingNotes(false);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createAppointment({
      patientId: patient.id,
      doctorId: selection.doctorId || undefined,
      serviceId: selection.serviceId || undefined,
      scheduledAt: new Date(selection.start),
      durationMinutes: 30,
      notes: selection.notes
    });

    if (result.success) {
      setIsModalOpen(false);
      window.location.reload(); // Atualiza pra mostrar o novo agendamento
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const interactions = patient.conversations?.[0]?.interactions || [];
  const appointments = patient.appointments || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* MODAL DE AGENDAMENTO EXCLUSIVO DESTE PACIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="bg-primary p-6 text-white relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Marcar Consulta</h3>
                  <p className="text-blue-100 text-sm">Para: {patient.fullName}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Data e Horário
                  </label>
                  <input 
                    type="datetime-local"
                    required
                    value={selection.start}
                    onChange={(e) => setSelection({...selection, start: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

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
                    <UserCheck className="h-3 w-3" /> Serviço / Procedimento
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
                  placeholder="Ex: Primeira vez na clínica..."
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

      {/* Header Profile */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/patients" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
             <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div className="flex items-center gap-4">
             <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white shadow-md">
                {patient.fullName.substring(0, 1).toUpperCase()}
             </div>
             <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{patient.fullName}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                   <Phone className="h-3 w-3" /> {patient.phone} 
                   <span className="mx-1">•</span> 
                   Paciente desde {format(new Date(patient.createdAt), "MMM yyyy", { locale: ptBR })}
                </p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab("conversa")}
            className="hidden sm:flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-600 transition-colors"
          >
            <MessageSquare className="h-4 w-4" /> Intervir agora
          </button>
          <button 
            onClick={() => setActiveTab("agendamentos")}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark transition-colors"
          >
            <Calendar className="h-4 w-4" /> Agendar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
         <nav className="-mb-px flex gap-6">
            {[
              { id: 'resumo', label: 'Resumo' },
              { id: 'conversa', label: 'Conversa (WhatsApp)' },
              { id: 'agendamentos', label: 'Agendamentos' },
              { id: 'anotacoes', label: 'Anotações' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-1 pb-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
         </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
         {activeTab === 'resumo' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2 space-y-6">
                   <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Prontuário</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <p className="text-xs text-gray-500 mb-1">E-mail</p>
                            <p className="text-sm font-medium text-gray-900">{patient.email || "Não informado"}</p>
                         </div>
                         <div>
                            <p className="text-xs text-gray-500 mb-1">Data de Nascimento</p>
                            <p className="text-sm font-medium text-gray-900">
                              {patient.birthDate ? format(new Date(patient.birthDate), "dd/MM/yyyy") : "Não informado"}
                            </p>
                         </div>
                         <div>
                            <p className="text-xs text-gray-500 mb-1">CPF</p>
                            <p className="text-sm font-medium text-gray-900">{patient.cpf || "Não informado"}</p>
                         </div>
                         <div>
                            <p className="text-xs text-gray-500 mb-1">Status no Kanban</p>
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-1 uppercase text-xs">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">{patient.status}</span>
                            </p>
                         </div>
                         <div className="sm:col-span-2">
                            <p className="text-xs text-gray-500 mb-1">Plano de Saúde / Convênio</p>
                            <p className="text-sm font-medium text-gray-900">{patient.healthPlan || "Particular"}</p>
                         </div>
                      </div>
                   </div>

                   <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Anotações da Secretária</h3>
                      <p className="text-sm text-gray-600 line-clamp-3 italic">
                        {patient.notes || "Sem anotações internas para este paciente."}
                      </p>
                   </div>
               </div>
               
               <div className="space-y-6">
                   <div className="rounded-xl border border-border bg-blue-50/50 p-6 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-4">Último Agendamento</h3>
                      {appointments.length > 0 ? (
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                           <div className="flex items-start justify-between mb-2">
                              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                                {appointments[0].specialty}
                              </span>
                              <span className="text-xs font-medium text-gray-500">{appointments[0].status}</span>
                           </div>
                           <p className="font-bold text-gray-900 mt-2">
                             {format(new Date(appointments[0].scheduledAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                           </p>
                           <p className="text-sm text-gray-600">{appointments[0].doctor?.name || "Dr. Geral"}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Nenhum agendamento encontrado.</p>
                      )}
                   </div>
               </div>
            </div>
         )}

         {activeTab === 'conversa' && (
            <div className="flex flex-col h-[600px] rounded-xl border border-border bg-[#efeae2] shadow-sm overflow-hidden relative">
               <div className="bg-white border-b border-border p-3 flex justify-between items-center z-10">
                  <div className="flex items-center gap-2">
                     <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
                     <span className="text-sm font-medium text-gray-700">Chat ao Vivo (Evolution)</span>
                  </div>
                  <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                     Histórico de Interações
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {interactions.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Nenhuma mensagem trocada ainda nas últimas conversas.
                    </div>
                  ) : (
                    interactions.map((int: any) => (
                      <div key={int.id} className={`flex ${int.direction === 'outbound' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`rounded-2xl px-4 py-2 max-w-[80%] shadow-sm relative ${
                          int.direction === 'outbound' 
                            ? (int.handledBy === 'ai' ? 'bg-white rounded-tl-none border border-gray-100' : 'bg-green-50 rounded-tl-none ring-1 ring-green-100') 
                            : 'bg-[#d9fdd3] rounded-tr-none'
                        }`}>
                           <div className="flex items-center gap-1.5 mb-1">
                              {int.direction === 'outbound' && (
                                int.handledBy === 'ai' 
                                  ? <span className="text-[10px] font-bold text-primary flex items-center gap-1"><Bot className="h-3 w-3"/> IA</span>
                                  : <span className="text-[10px] font-bold text-green-700 flex items-center gap-1"><User className="h-3 w-3"/> Secretária</span>
                              )}
                           </div>
                           <p className="text-sm text-gray-800">{int.content}</p>
                           <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-[10px] text-gray-400">
                                {format(new Date(int.createdAt), "HH:mm")}
                              </span>
                              {int.direction === 'inbound' && <span className="text-[10px] text-blue-500">✓✓</span>}
                           </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
               </div>

               <form onSubmit={handleSendMessage} className="bg-gray-100 p-3 pt-0">
                  <div className="flex items-center p-2 rounded-xl bg-white focus-within:ring-2 ring-primary border border-gray-200">
                     <div className="p-2 text-gray-400"><MessageSquare className="h-4 w-4"/></div>
                     <input 
                       type="text" 
                       value={message}
                       onChange={(e) => setMessage(e.target.value)}
                       disabled={isSending}
                       className="flex-1 bg-transparent border-0 outline-none text-sm px-2" 
                       placeholder="Intervir agora (Enviar como clínica)..." 
                     />
                     <button 
                       type="submit"
                       disabled={isSending || !message.trim()}
                       className="p-2 bg-primary rounded-lg text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                     >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                     </button>
                  </div>
               </form>
            </div>
         )}
         
         {activeTab === 'agendamentos' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                <div>
                  <h4 className="font-bold text-blue-900">Histórico de Consultas</h4>
                  <p className="text-xs text-blue-700">Gerencie todos os agendamentos deste paciente aqui.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95 shrink-0"
                >
                  <Calendar className="h-4 w-4" />
                  Novo Agendamento
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase font-bold text-gray-500">
                     <tr>
                        <th className="px-6 py-4">Data/Hora</th>
                        <th className="px-6 py-4">Especialidade</th>
                        <th className="px-6 py-4">Médico</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Valor</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {appointments.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Nenhum agendamento realizado.</td></tr>
                     ) : (
                       appointments.map((appt: any) => (
                        <tr key={appt.id}>
                           <td className="px-6 py-4 font-medium">{format(new Date(appt.scheduledAt), "dd/MM/yyyy HH:mm")}</td>
                           <td className="px-6 py-4">{appt.service?.name || appt.specialty}</td>
                           <td className="px-6 py-4 text-gray-500">{appt.doctor?.name || "Dr. Geral"}</td>
                           <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold">{appt.status}</span>
                           </td>
                           <td className="px-6 py-4 text-right font-semibold">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(appt.value || 0))}
                           </td>
                        </tr>
                       ))
                     )}
                  </tbody>
               </table>
              </div>
            </div>
         )}
         
         {activeTab === 'anotacoes' && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm min-h-[300px]">
               <h3 className="font-semibold text-gray-900 mb-2">Bloco de Notas Clínicas</h3>
               <p className="text-xs text-gray-500 mb-4 italic">Essas informações são privadas e não são enviadas ao paciente via WhatsApp.</p>
               <textarea 
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 className="w-full h-48 rounded-lg border border-gray-300 p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none" 
                 placeholder="Digite anotações clínicas privadas aqui..."
               />
               <div className="mt-4 flex justify-end">
                  <button 
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-all disabled:opacity-50 shadow-md shadow-primary/20"
                  >
                     {isSavingNotes ? <Loader2 className="h-4 w-4 animate-spin"/> : null}
                     Salvar no Prontuário
                  </button>
               </div>
            </div>
         )}
      </div>
    </div>
  );
}
