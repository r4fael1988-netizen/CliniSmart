import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    webhook_secret_set: !!process.env.WEBHOOK_SECRET,
    webhook_secret_length: process.env.WEBHOOK_SECRET?.length || 0,
    node_env: process.env.NODE_ENV,
    url: process.env.VERCEL_URL || "unknown"
  });
}
