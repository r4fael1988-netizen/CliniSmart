import { getKanbanCards } from "./actions";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";

// Isto força a rota a ser dinâmica (Server Component puro que não guarda cache obsoleto do banco)
export const dynamic = 'force-dynamic';

export default async function KanbanPage() {
  // Busca as cartas reais do banco de dados (Prisma) usando a ID da Clínica na sessão!
  const cards = await getKanbanCards();

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Kanban de Leads</h1>
          <p className="text-sm text-muted-foreground">Arraste e solte para mover os pacientes. Alterações são salvas automaticamente.</p>
        </div>
      </div>
      
      {/* Componente Client puro para carregar a biblioteca dnd-kit visual */}
      <KanbanBoard initialCards={cards} />
    </div>
  );
}
