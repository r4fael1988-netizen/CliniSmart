"use client";

import { useState } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { KanbanCard } from "@/components/kanban/KanbanCard";
import { CardType, updatePatientStatus } from "@/app/dashboard/kanban/actions";

export type ColumnType = {
  id: string;
  title: string;
  colorClass: string;
};

const defaultColumns: ColumnType[] = [
  { id: "new_contact", title: "🔵 Novo Contato", colorClass: "bg-blue-500" },
  { id: "active", title: "🟡 Em Atendimento", colorClass: "bg-yellow-500" },
  { id: "waiting", title: "🟠 Aguardando", colorClass: "bg-orange-500" },
  { id: "proposed", title: "🟣 Proposto", colorClass: "bg-purple-500" },
  { id: "scheduled", title: "🟢 Agendado", colorClass: "bg-green-500" },
  { id: "return", title: "⚪ Retorno", colorClass: "bg-gray-500" },
  { id: "cancelled", title: "🔴 Cancelado", colorClass: "bg-red-500" },
  { id: "done", title: "✅ Atendido", colorClass: "bg-green-800" },
];

export function KanbanBoard({ initialCards }: { initialCards: CardType[] }) {
  const [columns] = useState<ColumnType[]>(defaultColumns);
  const [cards, setCards] = useState<CardType[]>(initialCards);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    const card = cards.find((c) => c.id === active.id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveCard = active.data.current?.type === "Card";
    const isOverCard = over.data.current?.type === "Card";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveCard) return;

    // Dropping a card over another card
    if (isActiveCard && isOverCard) {
      setCards((cardsSnapshot) => {
        const activeIndex = cardsSnapshot.findIndex((c) => c.id === activeId);
        const overIndex = cardsSnapshot.findIndex((c) => c.id === overId);
        
        if (cardsSnapshot[activeIndex].columnId !== cardsSnapshot[overIndex].columnId) {
          const newCards = [...cardsSnapshot];
          newCards[activeIndex].columnId = cardsSnapshot[overIndex].columnId;
          return arrayMove(newCards, activeIndex, overIndex);
        }

        return arrayMove(cardsSnapshot, activeIndex, overIndex);
      });
    }

    // Dropping a card over an empty column
    if (isActiveCard && isOverColumn) {
      setCards((cardsSnapshot) => {
        const activeIndex = cardsSnapshot.findIndex((c) => c.id === activeId);
        const newCards = [...cardsSnapshot];
        // Only trigger update if it actually changed column
        newCards[activeIndex].columnId = overId;
        return arrayMove(newCards, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    const droppedCard = activeCard;
    setActiveCard(null);
    
    if (!over || !droppedCard) return;

    const activeId = active.id;
    const overId = over.id;

    // Check what is the new column ID
    let newColumnId = "";
    const isOverCard = over.data.current?.type === "Card";
    const isOverColumn = over.data.current?.type === "Column";

    if (isOverColumn) {
      newColumnId = overId;
    } else if (isOverCard) {
      const overCardItem = cards.find((c) => c.id === overId);
      if (overCardItem) newColumnId = overCardItem.columnId;
    }

    // Server-side database update required if card moved to new column
    if (newColumnId && droppedCard.columnId !== newColumnId) {
      // Optimistic update fired during handleDragOver.
      // Now fire persistent update.
      await updatePatientStatus(droppedCard.id, newColumnId);
    }
  };

  return (
    <div className="flex-1 overflow-x-auto pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full min-h-[600px] gap-4">
          <SortableContext items={columns.map((col) => col.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                cards={cards.filter((card) => card.columnId === col.id)}
              />
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeCard ? <KanbanCard card={activeCard} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
