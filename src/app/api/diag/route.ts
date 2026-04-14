import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    webhook_secret_set: !!process.env.WEBHOOK_SECRET,
    n8n_url: process.env.N8N_WEBHOOK_BASE || "NOT_SET",
    node_env: process.env.NODE_ENV,
    url: process.env.VERCEL_URL || "unknown"
  });
}
