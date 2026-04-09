"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { PatientFormPanel } from "./PatientFormPanel";

export function PatientsListHeader() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie o cadastro, prontuários e histórico de contatos reais.</p>
        </div>
        <button 
          onClick={() => setIsPanelOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Novo Paciente
        </button>
      </div>

      <PatientFormPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
      />
    </>
  );
}
