import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEMRRecords, getPendingPatientRequests } from "@/modules/hospital/actions";
import { getTriageRequestsForHospital } from "@/modules/triage/actions";
import { HospitalDashboardView } from "@/modules/dashboard/hospital/views/HospitalDashboardView";

export default async function HospitalDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const hospitalId = session.user.id;

  const [emrRecords, pendingRequests, triageRequests] = await Promise.all([
    getEMRRecords(hospitalId),
    getPendingPatientRequests(hospitalId),
    getTriageRequestsForHospital(hospitalId),
  ]);

  return (
    <HospitalDashboardView
      hospitalId={hospitalId}
      hospitalName={session.user.name}
      hospitalEmail={session.user.email}
      emrCount={emrRecords.length}
      pendingRequests={pendingRequests}
      triageRequests={triageRequests}
    />
  );
}
