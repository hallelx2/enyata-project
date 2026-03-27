import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getAdminStats,
  getApprovedHospitals,
  getPendingHospitals,
} from "@/modules/admin/actions";
import { AdminDashboardView } from "@/modules/admin/views/AdminDashboardView";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user?.email !== "admin@aurahealth.com") {
    redirect("/admin/login");
  }

  const [pendingHospitals, approvedHospitals, stats] = await Promise.all([
    getPendingHospitals(),
    getApprovedHospitals(),
    getAdminStats(),
  ]);

  return (
    <AdminDashboardView
      adminName={session.user.name}
      adminEmail={session.user.email}
      pendingHospitals={pendingHospitals}
      approvedHospitals={approvedHospitals}
      stats={stats}
    />
  );
}
