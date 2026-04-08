"use client";

import { useState, useEffect } from "react";
import { Globe, QrCode, RefreshCw, PowerOff, CheckCircle2 } from "lucide-react";
import Image from "next/image";

type ConnectionState = "loading" | "disconnected" | "connecting" | "open" | "error";

export function WhatsAppConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("Verificando status...");

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/instance");
      const data = await res.json();
      
      if (!res.ok) {
        setConnectionState("error");
        setMessage(data.error || "Erro ao comunicar com a API");
        return;
      }

      if (data.state === "open") {
        setConnectionState("open");
        setQrCode(null);
        setMessage(data.message);
      } else {
        setConnectionState("connecting");
        if (data.qrcode) {
          setQrCode(data.qrcode);
        }
        setMessage(data.message || "Aguardando leitura do QR Code");
      }
    } catch (error) {
      setConnectionState("error");
      setMessage("Erro ao conectar ao servidor interno.");
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Polling a cada 10 segundos para verificar mudança de estado
    const interval = setInterval(() => {
      if (connectionState === "connecting" || connectionState === "loading") {
        fetchStatus();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [connectionState]);

  const handleDisconnect = async () => {
    setConnectionState("loading");
    setMessage("Desconectando...");
    try {
      const res = await fetch("/api/whatsapp/instance", {
        method: "DELETE",
      });
      if (res.ok) {
        setConnectionState("disconnected");
        setQrCode(null);
        // Force refresh to get new qr code right away
        fetchStatus();
      } else {
        setConnectionState("error");
        setMessage("Erro ao desconectar");
      }
    } catch (e) {
      setConnectionState("error");
      setMessage("Erro na comunicação para desconectar");
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            Conexão WhatsApp (Evolution API)
          </h3>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>
        
        {connectionState === "open" ? (
          <span className="text-xs font-semibold bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Conectado
          </span>
        ) : connectionState === "connecting" ? (
          <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
            <RefreshCw className="h-4 w-4 animate-spin" /> Aguardando Leitura
          </span>
        ) : (
          <span className="text-xs font-semibold bg-red-100 text-red-800 px-3 py-1 rounded-full flex items-center gap-1">
            <PowerOff className="h-4 w-4" /> Desconectado
          </span>
        )}
      </div>

      <div className="border-t border-gray-200 py-4 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 space-y-4 w-full">
          {connectionState === "open" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-600">
                Seu número está pareado e pronto para disparar/responder mensagens aos pacientes da Clínica.
              </p>
              <button 
                onClick={handleDisconnect}
                className="w-fit flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
              >
                <PowerOff className="h-4 w-4" />
                Desconectar WhatsApp
              </button>
            </div>
          ) : connectionState === "connecting" || connectionState === "loading" ? (
            <div className="flex flex-col items-center justify-center pt-2">
              {qrCode ? (
                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 inline-block">
                  <Image 
                    src={qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`} 
                    alt="QR Code WhatsApp" 
                    width={200} 
                    height={200}
                    className="rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded-xl border border-dashed border-gray-300">
                  <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
                </div>
              )}
              <p className="text-sm font-medium text-gray-600 mt-4 text-center">
                1. Abra o WhatsApp no seu celular<br/>
                2. Vá em Dispositivos Conectados<br/>
                3. Escaneie este QR Code
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-red-600">
                Conexão perdida ou erro de comunicação.
              </p>
              <button 
                onClick={fetchStatus}
                className="w-fit flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
