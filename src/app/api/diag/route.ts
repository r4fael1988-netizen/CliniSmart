import { NextResponse } from "next/server";
// CliniSmart CRM v0.2.1 - Production Ready


export async function GET() {
  return NextResponse.json({
    version: "0.2.1",
    webhook_secret_set: !!process.env.WEBHOOK_SECRET,
    n8n_url: process.env.N8N_WEBHOOK_BASE || "NOT_SET",
    evolution_url: process.env.EVOLUTION_API_URL || "https://lostbaskingshark-evolution.cloudfy.live",
    evolution_instance: process.env.EVOLUTION_INSTANCE_NAME || "SOFIA_CRM (FALLBACK)",
    node_env: process.env.NODE_ENV,
    status: "operational"
  });
}
