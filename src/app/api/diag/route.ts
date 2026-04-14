import { NextResponse } from "next/server";
// Force Rebuild: 2026-04-14T22:02 - Clean Env Vars (no trailing newlines)


export async function GET() {
  return NextResponse.json({
    webhook_secret_set: !!process.env.WEBHOOK_SECRET,
    n8n_url: process.env.N8N_WEBHOOK_BASE || "NOT_SET",
    evolution_url: process.env.EVOLUTION_API_URL || "https://lostbaskingshark-evolution.cloudfy.live",
    evolution_instance: process.env.EVOLUTION_INSTANCE_NAME || "SOFIA_CRM (FALLBACK)",
    node_env: process.env.NODE_ENV,
    url: process.env.VERCEL_URL || "unknown"
  });
}
