import { getPatientById } from "../actions";
import { getDoctors, getServices } from "../../agenda/actions";
import { PatientDetailsView } from "@/components/patients/PatientDetailsView";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let patient = null;
  let doctors: any[] = [];
  let services: any[] = [];

  try {
    const results = await Promise.allSettled([
      getPatientById(id),
      getDoctors(),
      getServices()
    ]);

    patient = results[0].status === 'fulfilled' ? results[0].value : null;
    doctors = results[1].status === 'fulfilled' ? (results[1].value || []) : [];
    services = results[2].status === 'fulfilled' ? (results[2].value || []) : [];

  } catch (error) {
    console.error("Erro ao carregar dados do paciente:", error);
  }

  if (!patient) {
    notFound();
  }

  return <PatientDetailsView patient={patient} doctors={doctors} services={services} />;
}
