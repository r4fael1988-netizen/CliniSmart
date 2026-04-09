"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, User, Activity, ShieldCheck, MoreVertical } from "lucide-react";
import { getDoctors, addDoctor, deleteDoctor, toggleDoctorStatus } from "@/app/dashboard/settings/doctors/actions";

interface DoctorItem {
  id: string;
  name: string;
  specialty: string;
  crm: string | null;
  isActive: boolean;
}

export function DoctorsList() {
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newCRM, setNewCRM] = useState("");

  const loadDoctors = async () => {
    setIsLoading(true);
    const data = await getDoctors();
    setDoctors(data as DoctorItem[]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSpecialty) return;

    setIsSubmitting(true);
    const result = await addDoctor({ 
      name: newName, 
      specialty: newSpecialty,
      crm: newCRM 
    });
    
    if (result.success) {
      setNewName("");
      setNewSpecialty("");
      setNewCRM("");
      await loadDoctors();
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este médico?")) return;
    
    const result = await deleteDoctor(id);
    if (result.success) {
      await loadDoctors();
    } else {
      alert(result.error);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await toggleDoctorStatus(id, !currentStatus);
    if (result.success) {
      await loadDoctors();
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1 border-b border-gray-100 pb-2">
          Equipe Médica e Especialistas
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie os profissionais que realizam atendimentos em sua clínica. Médicos ativos aparecem como filtros na Agenda Geral.
        </p>
      </div>

      {/* Formulário de Adição */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-6 rounded-2xl border border-gray-200">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Nome Completo</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
               <User className="h-4 w-4" />
            </div>
            <input 
              type="text" 
              placeholder="Ex: Dr. Roberto Alencar" 
              required 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Especialidade / CRM</label>
          <input 
            type="text" 
            placeholder="Ex: Cardiologia (CRM 12345)" 
            required
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
          />
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="h-10 flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all disabled:opacity-50 shadow-md shadow-primary/20"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar Membro
        </button>
      </form>

      {/* Grid de Médicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-gray-400">
             <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
             Carregando equipe médica...
          </div>
        ) : doctors.length === 0 ? (
          <div className="col-span-full py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl text-center">
             <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
             <h3 className="text-gray-900 font-medium">Nenhum médico cadastrado</h3>
             <p className="text-sm text-gray-500">Adicione os profissionais acima para começar a gerenciar a agenda.</p>
          </div>
        ) : (
          doctors.map((dr) => (
            <div key={dr.id} className={`group relative bg-white border rounded-2xl p-5 transition-all hover:shadow-lg hover:border-primary/30 ${!dr.isActive ? 'opacity-60 grayscale' : ''}`}>
               <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                     <User className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1">
                     <button 
                       onClick={() => handleToggleStatus(dr.id, dr.isActive)}
                       className={`p-1.5 rounded-lg transition-colors ${dr.isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                       title={dr.isActive ? "Ativo - Clique para Desativar" : "Desativado - Clique para Ativar"}
                     >
                        <ShieldCheck className="h-4 w-4" />
                     </button>
                     <button 
                       onClick={() => handleDelete(dr.id)}
                       className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                       title="Remover Médico"
                     >
                        <Trash2 className="h-4 w-4" />
                     </button>
                  </div>
               </div>

               <div>
                  <h3 className="font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">{dr.name}</h3>
                  <p className="text-xs text-primary font-semibold mt-1 flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {dr.specialty}
                  </p>
                  {dr.crm && <p className="text-[10px] text-gray-400 mt-1">CRM: {dr.crm}</p>}
               </div>

               <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${dr.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {dr.isActive ? 'Ativo na Agenda' : 'Indisponível'}
                  </span>
                  <div className="flex -space-x-2">
                     <div className="h-6 w-6 rounded-full border-2 border-white bg-gray-200" />
                     <div className="h-6 w-6 rounded-full border-2 border-white bg-gray-300 text-[8px] flex items-center justify-center font-bold">12+</div>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
