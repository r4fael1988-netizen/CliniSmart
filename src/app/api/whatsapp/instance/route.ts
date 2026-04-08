import { NextResponse } from "next/server";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "https://lostbaskingshark-evolution.cloudfy.live";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "ZP2Vfc24UP1BtNZ6QlbISCVz0N9GW9BE";
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || "ClinicaMaster";

// Headers required by Evolution API
const headers = {
  "Content-Type": "application/json",
  "apikey": EVOLUTION_API_KEY as string,
};

export async function GET(req: Request) {
  try {
    // 1. Fetch current connection state
    const statusRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: "GET",
      headers,
    });

    // If instance doesn't exist (404), create it
    if (statusRes.status === 404) {
      const createRes = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          instanceName: INSTANCE_NAME,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });

      if (!createRes.ok) {
        return NextResponse.json({ error: "Erro ao criar instância na Evolution API" }, { status: 500 });
      }

      // Fetch the QR code directly after creating
      const connectRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
        method: "GET",
        headers,
      });
      const connectData = await connectRes.json();
      
      return NextResponse.json({ 
        state: "connecting", 
        qrcode: connectData.base64 || connectData.qrcode,
        message: "Instância criada e aguardando leitura."
      });
    }

    const statusData = await statusRes.json();
    const state = statusData?.instance?.state || "close"; // "open", "connecting", "close"
    
    // If it's already connected
    if (state === "open") {
      return NextResponse.json({ state: "open", message: "Conectado" });
    }

    // If disconnected or connecting, try to fetch the latest QR code
    const connectRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
      method: "GET",
      headers,
    });
    
    if (!connectRes.ok) {
        return NextResponse.json({ state, message: "Aguardando inicialização do QR Code..." });
    }

    const connectData = await connectRes.json();

    return NextResponse.json({
      state,
      qrcode: connectData.base64 || connectData.qrcode,
      message: "Aguardando leitura do QR Code"
    });

  } catch (error) {
    console.error("Evolution API Error:", error);
    return NextResponse.json({ error: "Erro interno no servidor de integração" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    // Logout the instance (disconnects WhatsApp but keeps the instance)
    const res = await fetch(`${EVOLUTION_API_URL}/instance/logout/${INSTANCE_NAME}`, {
      method: "DELETE",
      headers,
    });
    
    if (!res.ok) {
        return NextResponse.json({ error: "Erro ao desconectar instância" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Instância desconectada com sucesso" });
  } catch (error) {
    console.error("Evolution API Disconnect Error:", error);
    return NextResponse.json({ error: "Erro interno ao desconectar" }, { status: 500 });
  }
}
