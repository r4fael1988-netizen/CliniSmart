"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardType } from "@/app/dashboard/kanban/actions";
import { Clock, MessageSquare, Calendar, UserPlus } from "lucide-react";

interface Props {
  card: CardType;
  isOverlay?: boolean;
}

export function KanbanCard({ card, isOverlay }: Props) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: {
      type: "Card",
      card,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const getPriorityColor = (level: string) => {
    switch (level) {
      case "urgent": return "bg-red-500 animate-pulse";
      case "attention": return "bg-yellow-500";
      default: return "bg-gray-300";
    }
  };

  if (isDragging && !isOverlay) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="h-[140px] w-full rounded-lg border-2 border-dashed border-primary bg-primary/10 opacity-30" 
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative flex cursor-grab flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md active:cursor-grabbing transition-all ${
        isOverlay ? "scale-105 shadow-xl rotate-2 ring-2 ring-primary" : ""
      } ${card.isOverdue ? "border-red-300 ring-1 ring-red-300 bg-red-50/20" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
            {card.patientName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 leading-tight">{card.patientName}</h4>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 mt-1">
              {card.specialty}
            </span>
          </div>
        </div>
        <div className={`h-2.5 w-2.5 rounded-full ${getPriorityColor(card.priority)}`} title={`Prioridade: ${card.priority}`} />
      </div>

      <div className="text-sm text-gray-600 line-clamp-2 italic border-l-2 border-gray-200 pl-2 ml-1">
        "{card.lastMessage}"
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1 font-medium bg-gray-100 px-2 py-1 rounded-md">
          <Clock className={`h-3 w-3 ${card.isOverdue ? 'text-red-500' : ''}`} />
          <span className={card.isOverdue ? 'text-red-600 font-bold' : ''}>{card.timeAgo}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
          {card.source === "WhatsApp" ? <MessageSquare className="h-3 w-3 text-green-500" /> : <UserPlus className="h-3 w-3" />}
          {card.source}
        </div>
      </div>
      
      {/* Quick Actions (visible on hover only) */}
      <div className="absolute -right-2 -top-2 hidden group-hover:flex items-center gap-1 bg-white p-1 shadow-lg rounded-lg border border-gray-200">
        <button className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Ver Conversa">
          <MessageSquare className="h-4 w-4" />
        </button>
        <button className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Agendar">
          <Calendar className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
