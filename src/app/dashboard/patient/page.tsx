import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPatientHospitalLinks, getApprovedHospitals } from "@/modules/patient/actions";
import { getPatientEscrows } from "@/modules/escrow/actions";
import { getPatientTriageRequests } from "@/modules/triage/actions";
import { PatientDashboardView } from "@/modules/dashboard/patient/views/PatientDashboardView";

export default async function PatientDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const patientId = session.user.id;

  const [hospitalLinks, allHospitals, escrows, triageRequests] =
    await Promise.all([
      getPatientHospitalLinks(patientId),
      getApprovedHospitals(),
      getPatientEscrows(patientId),
      getPatientTriageRequests(patientId),
    ]);

  return (
    <PatientDashboardView
      patientId={patientId}
      patientName={session.user.name}
      patientEmail={session.user.email}
      hospitalLinks={hospitalLinks}
      allHospitals={allHospitals}
      escrows={escrows}
      triageRequests={triageRequests}
    />
  );
}
