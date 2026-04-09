"use client";

import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Copy, AlertCircle } from "lucide-react";

interface TimeRange {
  start: string;
  end: string;
}

interface DayConfig {
  enabled: boolean;
  ranges: TimeRange[];
}

interface WorkingHoursConfig {
  [key: string]: DayConfig;
}

const DAYS = [
  { id: "monday", label: "Segunda-feira" },
  { id: "tuesday", label: "Terça-feira" },
  { id: "wednesday", label: "Quarta-feira" },
  { id: "thursday", label: "Quinta-feira" },
  { id: "friday", label: "Sexta-feira" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
];

const DEFAULT_RANGE: TimeRange = { start: "08:00", end: "12:00" };

interface WorkingHoursProps {
  initialData?: WorkingHoursConfig;
  onChange: (config: WorkingHoursConfig) => void;
}

export function WorkingHours({ initialData, onChange }: WorkingHoursProps) {
  const [config, setConfig] = useState<WorkingHoursConfig>(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      return initialData;
    }
    
    // Default configuration
    const defaultConfig: WorkingHoursConfig = {};
    DAYS.forEach(day => {
      defaultConfig[day.id] = {
        enabled: day.id !== "sunday",
        ranges: [{ start: "08:00", end: "18:00" }]
      };
    });
    return defaultConfig;
  });

  useEffect(() => {
    onChange(config);
  }, [config, onChange]);

  const toggleDay = (dayId: string) => {
    setConfig(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        enabled: !prev[dayId].enabled
      }
    }));
  };

  const addRange = (dayId: string) => {
    setConfig(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        ranges: [...prev[dayId].ranges, { start: "14:00", end: "18:00" }]
      }
    }));
  };

  const removeRange = (dayId: string, index: number) => {
    setConfig(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        ranges: prev[dayId].ranges.filter((_, i) => i !== index)
      }
    }));
  };

  const updateRange = (dayId: string, index: number, field: keyof TimeRange, value: string) => {
    const newRanges = [...config[dayId].ranges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    
    setConfig(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        ranges: newRanges
      }
    }));
  };

  const copyToAll = (sourceDayId: string) => {
    const sourceConfig = config[sourceDayId];
    const newConfig = { ...config };
    
    DAYS.forEach(day => {
      if (day.id !== sourceDayId) {
        newConfig[day.id] = {
          enabled: sourceConfig.enabled,
          ranges: JSON.parse(JSON.stringify(sourceConfig.ranges))
        };
      }
    });
    
    setConfig(newConfig);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Horários de Funcionamento
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Defina os períodos em que a clínica está aberta e a IA pode agendar consultas.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {DAYS.map((day) => {
          const dayConfig = config[day.id] || { enabled: false, ranges: [] };
          return (
            <div key={day.id} className={`p-4 rounded-xl border transition-all ${dayConfig.enabled ? 'bg-white border-gray-200' : 'bg-gray-50/50 border-gray-100 opacity-75'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-40">
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={dayConfig.enabled}
                      onChange={() => toggleDay(day.id)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                  <span className={`text-sm font-semibold ${dayConfig.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                    {day.label}
                  </span>
                </div>

                {dayConfig.enabled ? (
                  <div className="flex-1 flex flex-col gap-3">
                    {dayConfig.ranges.map((range, idx) => (
                      <div key={idx} className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                          <input 
                            type="time" 
                            value={range.start}
                            onChange={(e) => updateRange(day.id, idx, "start", e.target.value)}
                            className="bg-transparent border-none text-sm p-1 outline-none focus:ring-0 w-24 text-gray-700 font-medium"
                          />
                          <span className="text-gray-400 text-xs">até</span>
                          <input 
                            type="time" 
                            value={range.end}
                            onChange={(e) => updateRange(day.id, idx, "end", e.target.value)}
                            className="bg-transparent border-none text-sm p-1 outline-none focus:ring-0 w-24 text-gray-700 font-medium"
                          />
                        </div>
                        {dayConfig.ranges.length > 1 && (
                          <button 
                            onClick={() => removeRange(day.id, idx)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-4 mt-1">
                      <button 
                        onClick={() => addRange(day.id)}
                        className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Adicionar Pausa/Turno
                      </button>
                      <button 
                        onClick={() => copyToAll(day.id)}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar para todos os dias
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-sm text-gray-400 italic">
                    Clínica fechada
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Dica:</strong> Se você configurar das 08:00 às 12:00 e das 14:00 às 18:00, o sistema entenderá que há uma pausa de almoço entre 12:00 e 14:00 e não agendará pacientes nesse intervalo.
        </p>
      </div>
    </div>
  );
}
