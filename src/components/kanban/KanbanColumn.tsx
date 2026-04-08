"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardType } from "@/app/dashboard/kanban/actions";
import { ColumnType } from "@/components/kanban/KanbanBoard";
import { KanbanCard } from "@/components/kanban/KanbanCard";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface Props {
  column: ColumnType;
  cards: CardType[];
}

export function KanbanColumn({ column, cards }: Props) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex h-full w-80 flex-shrink-0 flex-col rounded-xl border border-gray-200 bg-gray-50/50 ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="flex items-center justify-between p-4 cursor-grab active:cursor-grabbing border-b border-gray-200/50"
      >
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full shadow-sm ${column.colorClass}`} />
          <h3 className="font-semibold text-gray-700">{column.title.split(' ')[1]} {column.title.split(' ')[2] || ''}</h3>
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
          {cards.length}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
            <span className="text-sm font-medium text-gray-400">Arraste para cá</span>
          </div>
        )}
      </div>
    </div>
  );
}
