import { getPatients } from "./actions";
import Link from "next/link";
import { Search, UserPlus, FileEdit, MessageSquare, MoreHorizontal, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
  const patients = await getPatients();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie o cadastro, prontuários e histórico de contatos reais.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark transition-colors">
          <UserPlus className="h-4 w-4" />
          Novo Paciente
        </button>
      </div>

      {/* Caixa de Busca (Simulada para V1 Frontend-side ou futura API) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-border shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Filter className="h-4 w-4" />
          Filtros Avançados
        </button>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Nome / Contato</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold hidden md:table-cell">Origem</th>
                <th className="px-6 py-4 font-semibold hidden sm:table-cell">Atribuído a</th>
                <th className="px-6 py-4 font-semibold hidden lg:table-cell">Última Atualização</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-gray-50/20">
                    <div className="flex flex-col items-center gap-2">
                       <Users className="h-8 w-8 text-gray-300" />
                       <p>Nenhum paciente encontrado no banco de dados.</p>
                       <p className="text-xs">Os leads aparecerão aqui assim que enviarem mensagem no WhatsApp.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          {patient.fullName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{patient.fullName}</div>
                          <div className="text-gray-500 text-xs">{patient.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        patient.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                        patient.status === 'new_contact' ? 'bg-blue-100 text-blue-800' :
                        patient.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        {patient.source === 'whatsapp' && <MessageSquare className="h-3.5 w-3.5 text-green-500" />}
                        {patient.source}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                         <span className={`h-2 w-2 rounded-full ${patient.assignedTo?.includes('IA') ? 'bg-primary' : 'bg-green-500'}`} />
                         {patient.assignedTo || "Sofia IA"}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-gray-500">
                      {formatDistanceToNow(new Date(patient.updatedAt), { addSuffix: true, locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/dashboard/patients/${patient.id}`}
                          className="rounded p-2 text-gray-400 hover:bg-primary-light/50 hover:text-primary transition-colors"
                          title="Ver Ficha"
                        >
                          <FileEdit className="h-4 w-4" />
                        </Link>
                        <button className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Paginação */}
        <div className="flex items-center justify-between border-t border-border bg-gray-50/50 px-6 py-3">
          <p className="text-sm text-gray-500">Total de <span className="font-medium text-gray-900">{patients.length}</span> pacientes</p>
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50">Anterior</button>
            <button className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
}
