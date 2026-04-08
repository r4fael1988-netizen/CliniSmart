"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bot, Phone, Video, MoreVertical, Send, User, CheckCheck, Loader2, AlertCircle } from "lucide-react";
import { getConversationMessages, takeOverConversation, handBackToAI, sendMessage } from "@/app/dashboard/conversations/actions";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OmnichannelProps {
  initialConversations: any[];
}

export function OmnichannelView({ initialConversations }: OmnichannelProps) {
  const [activeChatId, setActiveChatId] = useState<string | null>(initialConversations[0]?.id || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const activeChat = initialConversations.find(c => c.id === activeChatId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = async (id: string) => {
    setIsLoadingMessages(true);
    const msgs = await getConversationMessages(id);
    setMessages(msgs);
    setIsLoadingMessages(false);
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  useEffect(() => {
    if (activeChatId) loadMessages(activeChatId);
  }, [activeChatId]);

  const handleTakeOver = async () => {
    if (!activeChatId) return;
    await takeOverConversation(activeChatId);
    loadMessages(activeChatId);
  };

  const handleHandBack = async () => {
    if (!activeChatId) return;
    await handBackToAI(activeChatId);
    loadMessages(activeChatId);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || !inputMessage.trim() || isSending) return;

    setIsSending(true);
    const result = await sendMessage(activeChatId, inputMessage);
    if (result.success) {
      setInputMessage("");
      loadMessages(activeChatId);
    } else {
      alert(result.error);
    }
    setIsSending(false);
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex rounded-xl border border-border bg-white shadow-xl overflow-hidden">
      {/* Sidebar - Contacts List */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-gray-800">Mensagens</h2>
          <div className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">Live</div>
        </div>
        
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              className="w-full rounded-lg bg-gray-100 py-2 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {initialConversations.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`flex items-start gap-3 p-4 cursor-pointer transition-all border-b border-gray-50 last:border-0 ${
                activeChatId === chat.id ? "bg-blue-50/80 ring-1 ring-inset ring-blue-100" : "hover:bg-gray-50/80"
              }`}
            >
              <div className="relative h-12 w-12 rounded-full flex-shrink-0 bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm">
                {chat.patientName.substring(0, 2).toUpperCase()}
                {chat.isEscalated && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white">
                        <User className="h-3 w-3 text-white" />
                    </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-sm text-gray-900 truncate">{chat.patientName}</h3>
                  <span className="text-[10px] text-gray-400 uppercase font-medium">
                    {formatDistanceToNow(new Date(chat.updatedAt), { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                    {!chat.isEscalated && <Bot className="h-3 w-3 text-sky-500" />}
                    <p className="text-xs text-gray-500 truncate">{chat.lastMsg}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#efeae2] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-repeat" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-light_04fcacde539c58cca6745483d4858c52.png")' }}></div>

        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-gray-200 bg-white flex items-center justify-between z-10 shrink-0 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {activeChat.patientName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{activeChat.patientName}</h2>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Conexão Ativa via Evolution API</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {activeChat.isEscalated ? (
                    <button 
                      onClick={handleHandBack}
                      className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-blue-200 shadow-sm"
                    >
                      <Bot className="h-3.5 w-3.5" /> Devolver para IA
                    </button>
                ) : (
                    <button 
                      onClick={handleTakeOver}
                      className="flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-orange-200 shadow-sm"
                    >
                      <User className="h-3.5 w-3.5" /> Assumir Atendimento
                    </button>
                )}
                <div className="h-4 w-px bg-gray-200 mx-1"></div>
                <MoreVertical className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 z-10 custom-scrollbar">
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm font-medium">Sincronizando histórico...</span>
                </div>
              ) : messages.map((msg, i) => (
                <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-start' : 'justify-end'}`}>
                  {msg.channel === 'system' ? (
                     <div className="mx-auto my-4 px-4 py-1.5 bg-white/70 backdrop-blur-sm rounded-lg border border-orange-200 shadow-sm">
                        <p className="text-[11px] text-orange-600 font-bold flex items-center gap-2 uppercase tracking-wide">
                           <AlertCircle className="h-3.5 w-3.5" /> {msg.content}
                        </p>
                     </div>
                  ) : (
                    <div className={`relative px-4 py-2 rounded-2xl max-w-[80%] shadow-md ${
                        msg.direction === 'outbound' 
                          ? (msg.handledBy === 'ai' ? 'bg-white rounded-tl-none border border-gray-100' : 'bg-blue-50 rounded-tl-none ring-1 ring-blue-100 border-blue-200') 
                          : 'bg-[#d9fdd3] rounded-tr-none border border-[#c6e9bc]'
                    }`}>
                      {msg.direction === 'outbound' && (
                        <span className={`block text-[9px] font-black uppercase tracking-widest mb-1 ${msg.handledBy === 'ai' ? 'text-sky-500' : 'text-blue-600'}`}>
                          {msg.handledBy === 'ai' ? 'Brain AI' : 'Secretária'}
                        </span>
                      )}
                      <p className="text-sm text-gray-800 leading-relaxed font-medium">{msg.content}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-1.5 opacity-60">
                        <span className="text-[9px] font-bold text-gray-500">{format(new Date(msg.createdAt), "HH:mm")}</span>
                        {msg.direction === 'inbound' && <CheckCheck className="h-3 w-3 text-blue-500" />}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Chat Input Container */}
            <form onSubmit={handleSend} className="bg-gray-50/50 backdrop-blur-md p-4 flex items-end gap-4 z-10 shrink-0 border-t border-gray-200">
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl flex items-center overflow-hidden focus-within:ring-2 ring-primary/20 shadow-sm transition-all focus-within:border-primary">
                 <textarea 
                   value={inputMessage}
                   onChange={(e) => setInputMessage(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleSend(e);
                     }
                   }}
                   disabled={isSending}
                   className="w-full max-h-32 min-h-[48px] py-3.5 px-5 resize-none outline-none text-sm bg-transparent placeholder-gray-400 font-medium"
                   placeholder={activeChat.isEscalated ? "Digite sua mensagem humana..." : "Assuma o atendimento para responder..."}
                   rows={1}
                 />
              </div>
              <div className="pb-1">
                <button 
                  type="submit"
                  disabled={isSending || !inputMessage.trim() || !activeChat.isEscalated}
                  className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primary text-white hover:bg-primary-dark transition-all hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:scale-100 shadow-lg shadow-primary/20"
                >
                  {isSending ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5 relative left-[1px]"/>}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20 gap-4 opacity-40">
              <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center">
                <MessageSquareIcon className="h-12 w-12" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Nenhuma Conversa Selecionada</h3>
                <p className="text-sm">Selecione um contato ao lado para iniciar o monitoramento em tempo real.</p>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageSquareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
