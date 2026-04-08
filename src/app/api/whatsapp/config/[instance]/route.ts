import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ instance: string }> }
) {
  try {
    const { instance: instanceName } = await params;

    if (!instanceName) {
      return NextResponse.json({ error: "Instance parameters missing" }, { status: 400 });
    }

    // Procura pela clínica associada a essa instância do WhatsApp
    // Na nossa base assumimos que: `whatsappInstance` guarda o valor "ClinicaMaster"
    // Caso não encontre especificamente, como fallback para a V1, usaremos a primeira.
    let clinic = await prisma.clinic.findFirst({
      where: { whatsappInstance: instanceName }
    });

    if (!clinic) {
      // Fallback para single-tenant demo ou a clínica primária
      clinic = await prisma.clinic.findFirst();
      if (!clinic) {
        return NextResponse.json({ error: "Clinic not found for this instance" }, { status: 404 });
      }
    }

    const settings = clinic.settings as any || {};

    const iaName = settings.iaName || "Assistente Virtual";
    const iaPrompt = settings.iaPrompt || `Você é ${iaName}, secretária inteligente da clínica ${clinic.name}. Seu tom é profissional e amigável. Seu objetivo é ajudar pacientes a agendar consultas, informar sobre a clínica e orientar procedimentos iniciais.`;
    const iaEnabled = settings.iaEnabled !== undefined ? settings.iaEnabled : true;

    return NextResponse.json({
      success: true,
      clinicId: clinic.id,
      clinicName: clinic.name,
      iaEnabled,
      agentConfig: {
        name: iaName,
        systemPrompt: iaPrompt
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Config fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
